<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";
import UIComponentCard from "@/components/UIComponentCard.vue";
import InputMask from "@/components/InputMask.vue";
import type { EmployeeFormData } from "@/core/schemas";
import type { SectorPluckItem } from "@/api/resources/sectors";
import { sectorsApi } from "@/api/resources";
import { notifyError } from "@/helpers/notify";

const props = withDefaults(
  defineProps<{
    modelValue: EmployeeFormData;
    errors?: Record<string, string>;
    mode?: "create" | "edit" | "view";
    companyOptions?: Array<{ id: number; name: string }>;
    branchOptions?: Array<{ id: number; name: string; company_id?: number }>;
    /** Utilizadores da empresa (`company_id` do formulário) para vínculo opcional */
    userOptions?: Array<{ id: number; name: string; email?: string }>;
    lockCompanyId?: number | null;
    lockBranchId?: number | null;
    /** Fluxo filial: vincular vs criar utilizador */
    branchUserFlow?: boolean;
    userAccessMode?: "link" | "create";
    newUserPassword?: string;
    newUserPasswordConfirm?: string;
    newUserRoleId?: number;
    roleOptions?: Array<{ id: number; name: string }>;
    /** Na edição, já existe vínculo — não oferecer "criar novo" */
    hideCreateUserOption?: boolean;

    branchAccessAccountState?: "normal" | "pending" | "link_only" | "blocked";
    /** Contexto empresa/filial: não mostrar campo Empresa (já implícito). */
    hideCompanyField?: boolean;
    /** Contexto filial: não mostrar coluna Filial nas atribuições (já é a filial do contexto). */
    hideBranchAssignmentField?: boolean;
  }>(),
  {
    errors: () => ({}),
    mode: "create",
    companyOptions: () => [],
    branchOptions: () => [],
    userOptions: () => [],
    lockCompanyId: null,
    lockBranchId: null,
    branchUserFlow: false,
    userAccessMode: "link",
    newUserPassword: "",
    newUserPasswordConfirm: "",
    newUserRoleId: 0,
    roleOptions: () => [],
    hideCreateUserOption: false,
    branchAccessAccountState: "normal",
    hideCompanyField: false,
    hideBranchAssignmentField: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: EmployeeFormData): void;
  (e: "clear-error", field: string): void;
  (e: "update:userAccessMode", value: "link" | "create"): void;
  (e: "update:newUserPassword", value: string): void;
  (e: "update:newUserPasswordConfirm", value: string): void;
  (e: "update:newUserRoleId", value: number): void;
}>();

watch(
  () => props.branchAccessAccountState,
  (s) => {
    if (props.branchUserFlow && (s === "link_only" || s === "blocked")) {
      emit("update:userAccessMode", "link");
    }
  },
  { immediate: true }
);

const searchingZipCode = ref(false);
/** Evita repetir ViaCEP para o mesmo CEP na busca automática. */
const lastViaCepZipFetched = ref("");
/** Só busca automática após o utilizador interagir com o CEP (evita ViaCEP ao abrir edição com CEP já guardado). */
const zipTouchedByUser = ref(false);
let zipLookupDebounceTimer: ReturnType<typeof setTimeout> | null = null;
/** Ver/ocultar palavras-passe ao criar utilizador no fluxo filial. */
const showNewUserPassword = ref(false);
const isView = computed(() => props.mode === "view");
/** Asterisco em campos obrigatórios (criar/editar). */
const req = computed(() => !isView.value);
const reqCompany = computed(() => req.value && !isCompanyLocked.value);
const reqBranchCol = computed(() => req.value && !props.hideBranchAssignmentField && !isBranchLocked.value);
const reqSector = computed(() => req.value);
const branchAccessIsLinkOnly = computed(() => props.branchAccessAccountState === "link_only");
const reqAccessUserLink = computed(
  () =>
    req.value &&
    props.branchUserFlow &&
    (props.userAccessMode === "link" || branchAccessIsLinkOnly.value)
);
const reqAccessUserCreate = computed(() => req.value && props.branchUserFlow && props.userAccessMode === "create");
const isCompanyLocked = computed(() => Number(props.lockCompanyId ?? 0) > 0);
const isBranchLocked = computed(() => Number(props.lockBranchId ?? 0) > 0);
/** Selectr em filial/setor no modo edição/criação (inclui filial bloqueada no contexto filial). */
const useAssignmentSelectrs = computed(() => !isView.value);
const assignmentCardTitle = computed(() =>
  props.hideBranchAssignmentField ? "Setor na filial" : "Filiais e setores"
);
const accessAccountCardTitle = computed(() =>
  props.branchUserFlow ? "Conta de acesso (obrigatório)" : "Usuário de acesso"
);
const companySelectRef = ref<HTMLSelectElement | null>(null);
let companySelectr: any = null;
const userSelectRef = ref<HTMLSelectElement | null>(null);
let userSelectr: any = null;
const roleSelectRef = ref<HTMLSelectElement | null>(null);
let roleSelectr: any = null;

const branchSelectEls = new Map<number, HTMLSelectElement>();
const branchAssignmentSelectrs = new Map<number, any>();
const sectorSelectEls = new Map<number, HTMLSelectElement>();
const sectorAssignmentSelectrs = new Map<number, any>();

const sectorOptionsByRow = ref<SectorPluckItem[][]>([]);

const lockedCompanyDisplayName = computed(() => {
  const id = Number(props.lockCompanyId ?? 0);
  if (!id) return "—";
  const label = props.companyOptions?.find((c) => c.id === id)?.name;
  return label?.trim() || `Empresa #${id}`;
});

const canPickLinkedUser = computed(() => !isView.value && Number(props.modelValue.company_id ?? 0) > 0);

const linkedUserDisplayName = computed(() => {
  const uid = Number(props.modelValue.user_id ?? 0);
  if (uid <= 0) return "—";
  const o = props.userOptions?.find((u) => u.id === uid);
  if (o) {
    const mail = (o.email ?? "").trim();
    return mail ? `${o.name} (${mail})` : o.name;
  }
  return `Utilizador #${uid}`;
});

/** Filiais disponíveis por linha (empresa selecionada ou contexto filial bloqueado). */
const branchesFilteredForForm = computed(() => {
  const cid = Number(props.modelValue.company_id ?? 0);
  if (isBranchLocked.value && props.lockBranchId) {
    const b = props.branchOptions.find((x) => x.id === props.lockBranchId);
    return b ? [{ id: b.id, name: b.name }] : [];
  }
  if (cid <= 0) return props.branchOptions.map((b) => ({ id: b.id, name: b.name }));
  return props.branchOptions
    .filter((b) => b.company_id == null || b.company_id === cid)
    .map((b) => ({ id: b.id, name: b.name }));
});

const localForm = computed({
  get: () => props.modelValue,
  set: (value: EmployeeFormData) => emit("update:modelValue", value),
});

function updateField<K extends keyof EmployeeFormData>(field: K, value: EmployeeFormData[K]) {
  localForm.value = {
    ...localForm.value,
    [field]: value,
  };
  emit("clear-error", field);
}

function toggleNewUserPassword() {
  showNewUserPassword.value = !showNewUserPassword.value;
}

/** Comprimento padrão alinhado a boas práticas. Em `@click`, chame `generateNewUserPassword()` — senão o evento substitui o comprimento. */
function generateNewUserPassword(length: number = 16) {
  if (isView.value) return;
  const len =
    typeof length === "number" && Number.isFinite(length) && length >= 8 ? Math.min(64, Math.floor(length)) : 16;
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*";
  const all = `${upper}${lower}${numbers}${symbols}`;
  const randomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  const passwordChars = [randomChar(upper), randomChar(lower), randomChar(numbers), randomChar(symbols)];
  for (let i = passwordChars.length; i < len; i += 1) passwordChars.push(randomChar(all));
  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }
  const generated = passwordChars.join("");
  emit("update:newUserPassword", generated);
  emit("update:newUserPasswordConfirm", generated);
  emit("clear-error", "new_user_password");
}

function updateAssignment(
  index: number,
  patch: Partial<{ branch_id: number; sector_id: number; is_primary: boolean }>
) {
  const next = [...localForm.value.assignments];
  const cur = { ...next[index], ...patch };
  next[index] = cur;
  updateField("assignments", next);
  emit("clear-error", `assignments.${index}.branch_id`);
  emit("clear-error", `assignments.${index}.sector_id`);
}

function onCompanyChange(event: Event) {
  const value = (event.target as HTMLSelectElement | null)?.value ?? "";
  updateField("company_id", value === "" ? 0 : Number(value));
}

function destroySelectrs() {
  companySelectr?.destroy?.();
  companySelectr = null;
}

function destroyUserSelectr() {
  userSelectr?.destroy?.();
  userSelectr = null;
}

function destroyRoleSelectr() {
  roleSelectr?.destroy?.();
  roleSelectr = null;
}

function initRoleSelectr() {
  destroyRoleSelectr();
  if (isView.value || !props.branchUserFlow || props.userAccessMode !== "create") return;
  if (!roleSelectRef.value) return;
  roleSelectr = new Selectr(roleSelectRef.value, {
    searchable: true,
    multiple: false,
    placeholder: "Selecione o perfil",
  });
  roleSelectr.on("selectr.change", () => {
    const raw = roleSelectr?.getValue();
    emit("update:newUserRoleId", raw === "" || raw == null ? 0 : Number(raw));
    emit("clear-error", "new_user_role");
  });
  const rid = Number(props.newUserRoleId ?? 0);
  if (rid > 0) roleSelectr.setValue(rid);
  else roleSelectr.setValue("");
}

function initCompanySelectr() {
  destroySelectrs();
  if (props.hideCompanyField) return;
  if (isView.value || isCompanyLocked.value) return;
  if (!companySelectRef.value) return;
  companySelectr = new Selectr(companySelectRef.value, {
    searchable: true,
    multiple: false,
    placeholder: "Selecione uma empresa",
  });
  companySelectr.on("selectr.change", () => {
    const raw = companySelectr?.getValue();
    updateField("company_id", raw === "" || raw == null ? 0 : Number(raw));
  });
  const cid0 = Number(props.modelValue.company_id ?? 0);
  if (cid0 > 0) companySelectr.setValue(cid0);
}

function initUserSelectr() {
  destroyUserSelectr();
  if (isView.value || !canPickLinkedUser.value) return;
  if (props.branchUserFlow && props.userAccessMode === "create") return;
  if (!userSelectRef.value) return;
  userSelectr = new Selectr(userSelectRef.value, {
    searchable: true,
    multiple: false,
    placeholder: props.branchUserFlow ? "Selecione o utilizador" : "Sem utilizador vinculado",
  });
  userSelectr.on("selectr.change", () => {
    const raw = userSelectr?.getValue();
    updateField("user_id", raw === "" || raw == null ? 0 : Number(raw));
  });
  const uid = Number(props.modelValue.user_id ?? 0);
  if (uid > 0) userSelectr.setValue(uid);
}

function cleanZipCode(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * @param manual — true: utilizador clicou no ícone; valida e permite repetir o mesmo CEP.
 * false: busca automática ao completar 8 dígitos (não repete se já preenchemos este CEP).
 */
async function fillAddressByZipCode(opts?: { manual?: boolean }): Promise<boolean> {
  if (isView.value) return false;
  const manual = !!opts?.manual;
  const zip = cleanZipCode(String(localForm.value.zip_code ?? "").trim());
  if (zip.length !== 8) {
    if (manual) notifyError("Informe um CEP válido com 8 dígitos.");
    return false;
  }
  if (!manual && zip === lastViaCepZipFetched.value) {
    return true;
  }
  searchingZipCode.value = true;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
    if (!res.ok) {
      notifyError("Não foi possível consultar o CEP. Tente novamente.");
      return false;
    }
    const data = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      complemento?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) {
      notifyError("CEP não encontrado.");
      return false;
    }
    const next = { ...localForm.value };
    next.street = data.logradouro ?? next.street;
    const comp = (data.complemento ?? "").trim();
    if (comp) {
      next.complement = comp;
    }
    next.neighborhood = data.bairro ?? next.neighborhood;
    next.city = data.localidade ?? next.city;
    next.state = data.uf ?? next.state;
    emit("update:modelValue", next);
    lastViaCepZipFetched.value = zip;
    emit("clear-error", "street");
    emit("clear-error", "complement");
    emit("clear-error", "neighborhood");
    emit("clear-error", "city");
    emit("clear-error", "state");
    return true;
  } catch {
    notifyError("Erro ao buscar CEP. Verifique a ligação ou tente mais tarde.");
    return false;
  } finally {
    searchingZipCode.value = false;
  }
}

function onZipCodeInput(raw: unknown) {
  zipTouchedByUser.value = true;
  updateField("zip_code", String(raw ?? ""));
}

watch(
  () => cleanZipCode(String(props.modelValue.zip_code ?? "")),
  (zip) => {
    if (isView.value) return;
    if (!zipTouchedByUser.value) return;
    if (zip.length < 8) {
      lastViaCepZipFetched.value = "";
    }
    if (zipLookupDebounceTimer) {
      clearTimeout(zipLookupDebounceTimer);
      zipLookupDebounceTimer = null;
    }
    if (zip.length !== 8) return;
    zipLookupDebounceTimer = setTimeout(() => {
      zipLookupDebounceTimer = null;
      void fillAddressByZipCode({ manual: false });
    }, 450);
  }
);

function parseSingleBranchSelectValue(raw: unknown): number {
  if (raw === "" || raw == null) return 0;
  if (Array.isArray(raw)) return Number(raw[0]) || 0;
  return Number(raw) || 0;
}

function setBranchSelectEl(index: number, el: unknown) {
  if (el instanceof HTMLSelectElement) {
    branchSelectEls.set(index, el);
  } else {
    branchSelectEls.delete(index);
  }
}

function setSectorSelectEl(index: number, el: unknown) {
  if (el instanceof HTMLSelectElement) {
    sectorSelectEls.set(index, el);
  } else {
    sectorSelectEls.delete(index);
  }
}

function destroyBranchAssignmentSelectrs() {
  branchAssignmentSelectrs.forEach((s) => s.destroy?.());
  branchAssignmentSelectrs.clear();
}

function destroySectorAssignmentSelectrs() {
  sectorAssignmentSelectrs.forEach((s) => s.destroy?.());
  sectorAssignmentSelectrs.clear();
}

async function initBranchAssignmentSelectrs() {
  destroyBranchAssignmentSelectrs();
  if (!useAssignmentSelectrs.value) return;
  await nextTick();
  const opts = branchesFilteredForForm.value;
  const rows = props.modelValue.assignments.length;
  for (let index = 0; index < rows; index++) {
    const el = branchSelectEls.get(index);
    if (!el || !opts.length) continue;
    const selr = new Selectr(el, {
      searchable: true,
      multiple: false,
      placeholder: "Selecione uma filial",
    });
    selr.on("selectr.change", () => {
      const bid = parseSingleBranchSelectValue(selr.getValue());
      void onAssignmentBranchChange(index, bid);
    });
    branchAssignmentSelectrs.set(index, selr);
    const bid = Number(props.modelValue.assignments[index]?.branch_id ?? 0);
    if (bid > 0) selr.setValue(bid);
    else selr.setValue("");
  }
}

async function initSectorAssignmentSelectrs() {
  destroySectorAssignmentSelectrs();
  if (!useAssignmentSelectrs.value) return;
  await nextTick();
  const rows = props.modelValue.assignments.length;
  for (let index = 0; index < rows; index++) {
    const el = sectorSelectEls.get(index);
    if (!el) continue;
    const row = props.modelValue.assignments[index];
    const selr = new Selectr(el, {
      searchable: true,
      multiple: false,
      placeholder: "Selecione o setor",
    });
    selr.on("selectr.change", () => {
      const raw = selr.getValue();
      const sid = raw === "" || raw == null ? 0 : Number(raw);
      updateAssignment(index, { sector_id: sid });
    });
    sectorAssignmentSelectrs.set(index, selr);
    const sid = Number(row?.sector_id ?? 0);
    if (sid > 0) selr.setValue(sid);
    else selr.setValue("");
  }
}

async function initAssignmentRowSelectrs() {
  await initBranchAssignmentSelectrs();
  await initSectorAssignmentSelectrs();
}

async function loadSectorsForRow(index: number, branchId: number) {
  if (branchId <= 0) {
    sectorOptionsByRow.value[index] = [];
    return;
  }
  try {
    const plucks = await sectorsApi.plucks({ branch_id: branchId });
    sectorOptionsByRow.value[index] = plucks;
  } catch {
    sectorOptionsByRow.value[index] = [];
  }
}

async function onAssignmentBranchChange(index: number, branchId: number) {
  updateAssignment(index, { branch_id: branchId, sector_id: 0 });
  await loadSectorsForRow(index, branchId);
}

function addAssignmentRow() {
  const next = [...localForm.value.assignments, { branch_id: 0, sector_id: 0, is_primary: false }];
  if (!next.some((a) => a.is_primary)) {
    next[0] = { ...next[0], is_primary: true };
  }
  updateField("assignments", next);
  sectorOptionsByRow.value.push([]);
}

function removeAssignmentRow(index: number) {
  if (localForm.value.assignments.length <= 1) return;
  const next = localForm.value.assignments.filter((_, i) => i !== index);
  if (!next.some((a) => a.is_primary) && next.length) {
    next[0] = { ...next[0], is_primary: true };
  }
  updateField("assignments", next);
  sectorOptionsByRow.value.splice(index, 1);
}

function setPrimary(index: number) {
  const next = localForm.value.assignments.map((a, i) => ({
    ...a,
    is_primary: i === index,
  }));
  updateField("assignments", next);
}

watch(
  () => props.modelValue.assignments.map((a) => a.branch_id).join(","),
  async (sig, oldSig) => {
    if (sig === oldSig) return;
    for (let i = 0; i < props.modelValue.assignments.length; i++) {
      const bid = props.modelValue.assignments[i].branch_id;
      await loadSectorsForRow(i, bid);
    }
  },
  { immediate: true }
);

const companySelectSignature = computed(() =>
  JSON.stringify({
    mode: props.mode,
    hideCompany: props.hideCompanyField,
    lock: props.lockCompanyId,
    company_id: props.modelValue.company_id,
    companies: props.companyOptions?.map((c) => c.id) ?? [],
  })
);

watch(companySelectSignature, async () => {
  await nextTick();
  initCompanySelectr();
});

const userSelectSignature = computed(() =>
  JSON.stringify({
    mode: props.mode,
    company_id: props.modelValue.company_id,
    user_id: props.modelValue.user_id,
    users: (props.userOptions ?? []).map((u) => u.id),
    branchUserFlow: props.branchUserFlow,
    userAccessMode: props.userAccessMode,
    branchAccessAccountState: props.branchAccessAccountState,
  })
);

watch(userSelectSignature, async () => {
  await nextTick();
  initUserSelectr();
});

const assignmentSelectSignature = computed(() =>
  JSON.stringify({
    unlocked: useAssignmentSelectrs.value,
    hideBranchCol: props.hideBranchAssignmentField,
    company_id: props.modelValue.company_id,
    assignments: props.modelValue.assignments.map((a) => ({ b: a.branch_id, s: a.sector_id })),
    branches: branchesFilteredForForm.value.map((b) => b.id),
    sectorRows: sectorOptionsByRow.value.map((row) => row.map((s) => s.id)),
    n: props.modelValue.assignments.length,
  })
);

watch(assignmentSelectSignature, async () => {
  await nextTick();
  await initAssignmentRowSelectrs();
});

const roleSelectSignature = computed(() =>
  JSON.stringify({
    branchUserFlow: props.branchUserFlow,
    userAccessMode: props.userAccessMode,
    newUserRoleId: props.newUserRoleId,
    roles: (props.roleOptions ?? []).map((r) => r.id),
  })
);

watch(roleSelectSignature, async () => {
  await nextTick();
  initRoleSelectr();
});

onMounted(async () => {
  await nextTick();
  initCompanySelectr();
  initUserSelectr();
  initRoleSelectr();
  for (let i = 0; i < props.modelValue.assignments.length; i++) {
    await loadSectorsForRow(i, props.modelValue.assignments[i].branch_id);
  }
  await initAssignmentRowSelectrs();
});

onBeforeUnmount(() => {
  if (zipLookupDebounceTimer) {
    clearTimeout(zipLookupDebounceTimer);
    zipLookupDebounceTimer = null;
  }
  destroyBranchAssignmentSelectrs();
  destroySectorAssignmentSelectrs();
  destroySelectrs();
  destroyUserSelectr();
  destroyRoleSelectr();
});
</script>

<template>
  <UIComponentCard title="Dados pessoais">
    <b-row v-if="!hideCompanyField && isCompanyLocked" class="g-3 mb-1">
      <b-col md="12">
        <b-form-group label="Empresa">
          <b-form-input readonly tabindex="-1" :model-value="lockedCompanyDisplayName" class="bg-light" />
        </b-form-group>
      </b-col>
    </b-row>
    <b-row v-else-if="!hideCompanyField" class="g-3 mb-1">
      <b-col md="12">
        <b-form-group label-for="emp-company_id">
          <template #label>
            Empresa<span v-if="reqCompany" class="text-danger ms-1" aria-hidden="true">*</span>
          </template>
          <select
            id="emp-company_id"
            ref="companySelectRef"
            class="form-select"
            :disabled="isView"
            :class="{ 'is-invalid': !!errors?.company_id }"
            @change="onCompanyChange"
          >
            <option value="" :selected="!localForm.company_id">Selecione uma empresa</option>
            <option
              v-for="c in companyOptions ?? []"
              :key="c.id"
              :value="c.id"
              :selected="Number(localForm.company_id ?? 0) === c.id"
            >
              {{ c.name }}
            </option>
          </select>
          <b-form-invalid-feedback v-if="errors?.company_id">{{ errors.company_id }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row class="g-3">
      <b-col md="6">
        <b-form-group label-for="emp-name">
          <template #label>
            Nome<span v-if="req" class="text-danger ms-1" aria-hidden="true">*</span>
          </template>
          <b-form-input
            id="emp-name"
            :model-value="modelValue.name"
            type="text"
            :readonly="isView"
            :class="{ 'is-invalid': errors?.name }"
            @update:model-value="updateField('name', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors?.name">{{ errors.name }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label-for="emp-cpf">
          <template #label>
            CPF<span v-if="req" class="text-danger ms-1" aria-hidden="true">*</span>
          </template>
          <InputMask
            id="emp-cpf"
            mask="999.999.999-99"
            :model-value="modelValue.cpf"
            :readonly="isView"
            :class="{ 'is-invalid': errors?.cpf }"
            placeholder="000.000.000-00"
            @update:model-value="updateField('cpf', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors?.cpf">{{ errors.cpf }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label-for="emp-email">
          <template #label>
            E-mail<span v-if="req" class="text-danger ms-1" aria-hidden="true">*</span>
          </template>
          <b-form-input
            id="emp-email"
            :model-value="modelValue.email"
            type="email"
            :readonly="isView"
            :class="{ 'is-invalid': errors?.email }"
            @update:model-value="updateField('email', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors?.email">{{ errors.email }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label-for="emp-phone">
          <template #label>
            Telefone<span v-if="req" class="text-danger ms-1" aria-hidden="true">*</span>
          </template>
          <InputMask
            id="emp-phone"
            mask="(99) 9999[9]-9999"
            :model-value="modelValue.phone"
            :readonly="isView"
            placeholder="(99) 99999-9999"
            :class="{ 'is-invalid': errors?.phone }"
            @update:model-value="updateField('phone', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors?.phone">{{ errors.phone }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="12">
        <b-form-group label-for="emp-job_title">
          <template #label>
            Cargo<span v-if="req" class="text-danger ms-1" aria-hidden="true">*</span>
          </template>
          <b-form-input
            id="emp-job_title"
            :model-value="modelValue.job_title"
            type="text"
            :readonly="isView"
            :class="{ 'is-invalid': errors?.job_title }"
            @update:model-value="updateField('job_title', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors?.job_title">{{ errors.job_title }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-row>

    <p class="text-muted small mb-2 mt-2">Endereço (opcional)</p>
    <b-row class="g-3">
      <b-col md="4">
        <b-form-group label="CEP" label-for="emp-zip_code">
          <b-input-group>
            <InputMask
              id="emp-zip_code"
              mask="99999-999"
              :model-value="modelValue.zip_code ?? ''"
              :readonly="isView"
              class="flex-grow-1 min-w-0"
              placeholder="Ex.: 01310-100"
              @update:model-value="onZipCodeInput"
            />
            <b-button
              v-if="!isView"
              type="button"
              variant="outline-secondary"
              :title="searchingZipCode ? 'A buscar…' : 'Buscar CEP'"
              :disabled="searchingZipCode"
              @click="fillAddressByZipCode({ manual: true })"
            >
              <b-spinner v-if="searchingZipCode" small class="align-middle" />
              <i v-else class="iconoir-search align-middle" aria-hidden="true" />
              <span class="visually-hidden">Buscar CEP</span>
            </b-button>
          </b-input-group>
          <p class="text-muted small mb-0 mt-1">Ao completar o CEP, o endereço é preenchido automaticamente; o ícone consulta de novo.</p>
        </b-form-group>
      </b-col>
      <b-col md="8">
        <b-form-group label="Logradouro">
          <b-form-input
            :model-value="modelValue.street ?? ''"
            :readonly="isView"
            @update:model-value="updateField('street', String($event ?? ''))"
          />
        </b-form-group>
      </b-col>
      <b-col md="2">
        <b-form-group label="Número" label-for="emp-street_number">
          <b-form-input
            id="emp-street_number"
            :model-value="modelValue.street_number ?? ''"
            :readonly="isView"
            placeholder="S/N"
            @update:model-value="updateField('street_number', String($event ?? ''))"
          />
        </b-form-group>
      </b-col>
      <b-col md="10">
        <b-form-group label="Complemento" label-for="emp-complement">
          <b-form-input
            id="emp-complement"
            :model-value="modelValue.complement ?? ''"
            :readonly="isView"
            placeholder="Apto., bloco, sala…"
            @update:model-value="updateField('complement', String($event ?? ''))"
          />
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Bairro">
          <b-form-input
            :model-value="modelValue.neighborhood ?? ''"
            :readonly="isView"
            @update:model-value="updateField('neighborhood', String($event ?? ''))"
          />
        </b-form-group>
      </b-col>
      <b-col md="4">
        <b-form-group label="Município">
          <b-form-input
            :model-value="modelValue.city ?? ''"
            :readonly="isView"
            @update:model-value="updateField('city', String($event ?? ''))"
          />
        </b-form-group>
      </b-col>
      <b-col md="2">
        <b-form-group label="UF">
          <b-form-input
            :model-value="modelValue.state ?? ''"
            maxlength="2"
            :readonly="isView"
            @update:model-value="updateField('state', String($event ?? '').toUpperCase())"
          />
        </b-form-group>
      </b-col>
    </b-row>

    <b-row v-if="isView" class="g-3 mt-1">
      <b-col md="12">
        <b-form-group label="Utilizador vinculado (conta de acesso)">
          <b-form-input readonly tabindex="-1" :model-value="linkedUserDisplayName" class="bg-light" />
        </b-form-group>
      </b-col>
    </b-row>
  </UIComponentCard>

  <UIComponentCard :title="assignmentCardTitle" class="mt-3">
    <p v-if="!isView" class="text-muted small mb-3">
      <template v-if="hideBranchAssignmentField || isBranchLocked">
        Escolha o setor desta filial. Não é possível vincular outras filiais.
      </template>
      <template v-else>Em cada filial, indique o setor do colaborador.</template>
    </p>
    <b-form-invalid-feedback v-if="errors?.assignments" class="d-block mb-2">{{ errors.assignments }}</b-form-invalid-feedback>
    <div
      v-for="(row, index) in modelValue.assignments"
      :key="`emp-assign-${index}`"
      class="border rounded p-3 mb-3 bg-light-subtle"
    >
      <b-row class="g-3 align-items-end">
        <b-col v-if="!hideBranchAssignmentField" md="4">
          <b-form-group :label-for="`emp-b-${index}`">
            <template #label>
              <span>{{ isBranchLocked ? "Filial" : `Filial #${index + 1}` }}</span
              ><span v-if="reqBranchCol" class="text-danger ms-1" aria-hidden="true">*</span>
            </template>
            <select
              :id="`emp-b-${index}`"
              :ref="(el) => setBranchSelectEl(index, el)"
              class="form-select"
              :disabled="isView || isBranchLocked"
              :class="{ 'is-invalid': errors?.[`assignments.${index}.branch_id`] }"
            >
              <option value="">Selecione</option>
              <option v-for="b in branchesFilteredForForm" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
            <b-form-invalid-feedback v-if="errors?.[`assignments.${index}.branch_id`]">
              {{ errors[`assignments.${index}.branch_id`] }}
            </b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col :md="hideBranchAssignmentField ? 8 : 4">
          <b-form-group :label-for="`emp-s-${index}`">
            <template #label>
              Setor<span v-if="reqSector" class="text-danger ms-1" aria-hidden="true">*</span>
            </template>
            <select
              :id="`emp-s-${index}`"
              :ref="(el) => setSectorSelectEl(index, el)"
              class="form-select"
              :disabled="isView || !row.branch_id"
              :class="{ 'is-invalid': errors?.[`assignments.${index}.sector_id`] }"
            >
              <option value="">Selecione</option>
              <option v-for="s in sectorOptionsByRow[index] ?? []" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <b-form-invalid-feedback v-if="errors?.[`assignments.${index}.sector_id`]">
              {{ errors[`assignments.${index}.sector_id`] }}
            </b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col :md="hideBranchAssignmentField ? 4 : 3">
          <b-form-group label="Principal">
            <b-form-checkbox
              :model-value="!!row.is_primary"
              :disabled="isView"
              @update:model-value="(v: boolean | undefined) => { if (v) setPrimary(index); }"
            >
              Filial principal
            </b-form-checkbox>
          </b-form-group>
        </b-col>
        <b-col v-if="!isView && !isBranchLocked && !hideBranchAssignmentField" md="1" class="text-end">
          <b-button variant="outline-danger" size="sm" :disabled="modelValue.assignments.length <= 1" @click="removeAssignmentRow(index)">
            <i class="iconoir-trash"></i>
          </b-button>
        </b-col>
      </b-row>
    </div>
    <b-button v-if="!isView && !isBranchLocked && !hideBranchAssignmentField" variant="outline-primary" size="sm" @click="addAssignmentRow">
      <i class="iconoir-plus me-1"></i>
      Adicionar filial
    </b-button>
  </UIComponentCard>

  <UIComponentCard v-if="!isView" :title="accessAccountCardTitle" class="mt-3">
    <b-row class="g-3">
      <b-col v-if="branchUserFlow" md="12">
        <template v-if="branchAccessAccountState === 'pending'">
          <p class="text-muted small mb-0 d-flex align-items-center gap-2">
            <b-spinner small class="flex-shrink-0" role="status" aria-hidden="true" />
            <span>A verificar limites e utilizadores disponíveis…</span>
          </p>
        </template>
        <template v-else-if="branchAccessAccountState === 'blocked'">
          <div class="alert alert-warning mb-0" role="alert">
            Entre em contato com a <strong>empresa Matriz</strong> sobre os limites de utilizadores e de funcionários. Não é
            possível criar um novo utilizador para este funcionário; só é permitido vincular um existente com acesso à
            empresa. Neste momento não há utilizadores disponíveis para vínculo nesta filial.
          </div>
        </template>
        <template v-else-if="branchAccessAccountState === 'link_only'">
          <p class="text-muted small mb-2">
            O limite de utilizadores da empresa foi atingido. Não é possível criar uma nova conta; vincule um utilizador
            existente com acesso a esta filial.
          </p>
          <p class="text-muted small mb-2">
            Só aparecem utilizadores desta filial que ainda não estão ligados a outro funcionário.
          </p>
          <template v-if="!canPickLinkedUser">
            <p class="text-muted small mb-0">
              {{ hideCompanyField ? "Aguarde o carregamento dos dados." : "Selecione a empresa." }}
            </p>
          </template>
          <template v-else>
            <b-form-group label-for="emp-user_id">
              <template #label>
                Utilizador<span v-if="reqAccessUserLink" class="text-danger ms-1" aria-hidden="true">*</span>
              </template>
              <select
                id="emp-user_id"
                ref="userSelectRef"
                class="form-select"
                :class="{ 'is-invalid': !!errors?.user_id }"
              >
                <option value="" :selected="!localForm.user_id">Selecione o utilizador</option>
                <option
                  v-for="u in userOptions ?? []"
                  :key="u.id"
                  :value="u.id"
                  :selected="Number(localForm.user_id ?? 0) === u.id"
                >
                  {{ u.name }}<template v-if="(u.email ?? '').trim()"> — {{ u.email }}</template>
                </option>
              </select>
              <b-form-invalid-feedback v-if="errors?.user_id">{{ errors.user_id }}</b-form-invalid-feedback>
            </b-form-group>
          </template>
        </template>
        <b-form-group v-else>
          <b-form-radio-group
            :model-value="userAccessMode"
            class="mb-3"
            @update:model-value="emit('update:userAccessMode', $event as 'link' | 'create')"
          >
            <b-form-radio value="link">Vincular existente</b-form-radio>
            <b-form-radio v-if="!hideCreateUserOption" value="create">Criar novo utilizador</b-form-radio>
          </b-form-radio-group>
          <p class="text-muted small mb-2">
            Só aparecem utilizadores desta filial que ainda não estão ligados a outro funcionário.
          </p>
          <template v-if="userAccessMode === 'link'">
            <p v-if="!canPickLinkedUser" class="text-muted small mb-0">
              {{ hideCompanyField ? "Aguarde o carregamento dos dados." : "Selecione a empresa." }}
            </p>
            <template v-else>
              <b-form-group label-for="emp-user_id">
                <template #label>
                  Utilizador<span v-if="reqAccessUserLink" class="text-danger ms-1" aria-hidden="true">*</span>
                </template>
                <select
                  id="emp-user_id"
                  ref="userSelectRef"
                  class="form-select"
                  :class="{ 'is-invalid': !!errors?.user_id }"
                >
                  <option value="" :selected="!localForm.user_id">Selecione o utilizador</option>
                  <option
                    v-for="u in userOptions ?? []"
                    :key="u.id"
                    :value="u.id"
                    :selected="Number(localForm.user_id ?? 0) === u.id"
                  >
                    {{ u.name }}<template v-if="(u.email ?? '').trim()"> — {{ u.email }}</template>
                  </option>
                </select>
                <b-form-invalid-feedback v-if="errors?.user_id">{{ errors.user_id }}</b-form-invalid-feedback>
              </b-form-group>
            </template>
          </template>
          <template v-else>
            <b-row class="g-3">
              <b-col md="6">
                <b-form-group label-for="emp-nup">
                  <template #label>
                    Palavra-passe<span v-if="reqAccessUserCreate" class="text-danger ms-1" aria-hidden="true">*</span>
                  </template>
                  <b-input-group>
                    <b-form-input
                      id="emp-nup"
                      :type="showNewUserPassword ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="••••••••"
                      :model-value="newUserPassword"
                      :class="{ 'is-invalid': !!errors?.new_user_password }"
                      @update:model-value="emit('update:newUserPassword', String($event ?? ''))"
                    />
                    <b-button
                      type="button"
                      variant="outline-secondary"
                      :title="showNewUserPassword ? 'Ocultar senha' : 'Mostrar senha'"
                      @click="toggleNewUserPassword"
                    >
                      <i :class="showNewUserPassword ? 'iconoir-eye-closed' : 'iconoir-eye'"></i>
                    </b-button>
                    <b-button type="button" variant="outline-primary" @click="generateNewUserPassword()">Gerar senha</b-button>
                  </b-input-group>
                  <b-form-invalid-feedback v-if="errors?.new_user_password">{{ errors.new_user_password }}</b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-group label-for="emp-nup2">
                  <template #label>
                    Confirmar palavra-passe<span v-if="reqAccessUserCreate" class="text-danger ms-1" aria-hidden="true">*</span>
                  </template>
                  <b-form-input
                    id="emp-nup2"
                    :type="showNewUserPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="••••••••"
                    :model-value="newUserPasswordConfirm"
                    @update:model-value="emit('update:newUserPasswordConfirm', String($event ?? ''))"
                  />
                </b-form-group>
              </b-col>
              <b-col md="12">
                <b-form-group label-for="emp-nur">
                  <template #label>
                    Perfil (papel)<span v-if="reqAccessUserCreate" class="text-danger ms-1" aria-hidden="true">*</span>
                  </template>
                  <select
                    id="emp-nur"
                    ref="roleSelectRef"
                    class="form-select"
                    :class="{ 'is-invalid': !!errors?.new_user_role }"
                  >
                    <option value="">Selecione o perfil</option>
                    <option v-for="r in roleOptions ?? []" :key="r.id" :value="r.id">{{ r.name }}</option>
                  </select>
                  <b-form-invalid-feedback v-if="errors?.new_user_role">{{ errors.new_user_role }}</b-form-invalid-feedback>
                </b-form-group>
              </b-col>
            </b-row>
            <p class="text-muted small mb-0">
              A conta será criada com acesso a esta filial e ao setor escolhido acima. O e-mail e o nome são os do
              funcionário.
            </p>
          </template>
        </b-form-group>
      </b-col>
      <b-col v-else md="12">
        <b-form-group label="Utilizador vinculado" label-for="emp-user_id">
          <p v-if="!canPickLinkedUser" class="text-muted small mb-0">
            {{
              hideCompanyField
                ? "Aguarde o carregamento dos dados."
                : "Selecione a empresa para listar utilizadores com acesso a essa empresa."
            }}
          </p>
          <template v-else>
            <select
              id="emp-user_id"
              ref="userSelectRef"
              class="form-select"
              :class="{ 'is-invalid': !!errors?.user_id }"
            >
              <option value="" :selected="!localForm.user_id">Sem vínculo</option>
              <option
                v-for="u in userOptions ?? []"
                :key="u.id"
                :value="u.id"
                :selected="Number(localForm.user_id ?? 0) === u.id"
              >
                {{ u.name }}<template v-if="(u.email ?? '').trim()"> — {{ u.email }}</template>
              </option>
            </select>
            <b-form-invalid-feedback v-if="errors?.user_id">{{ errors.user_id }}</b-form-invalid-feedback>
            <p class="text-muted small mt-1 mb-0">
              Utilizadores da empresa sem vínculo a funcionário. Um utilizador só pode estar ligado a um funcionário.
            </p>
          </template>
        </b-form-group>
      </b-col>
    </b-row>
  </UIComponentCard>

  <div v-if="!isView" class="d-flex gap-2 mt-3">
    <slot name="actions" />
  </div>
</template>
