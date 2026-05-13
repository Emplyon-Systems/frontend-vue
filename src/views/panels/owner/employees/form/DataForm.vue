<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";
import UIComponentCard from "@/components/UIComponentCard.vue";
import InputMask from "@/components/InputMask.vue";
import type { EmployeeFormData } from "@/core/schemas";
import type { SectorPluckItem } from "@/api/resources/sectors";
import type { PositionPluckItem } from "@/api/resources/positions";
import type { ModalityTypePluckItem } from "@/api/resources/modality-types";
import { modalityTypesApi, positionsApi, sectorsApi, usersApi } from "@/api/resources";
import { notifyError } from "@/helpers/notify";

const props = withDefaults(
  defineProps<{
    modelValue: EmployeeFormData;
    errors?: Record<string, string>;
    mode?: "create" | "edit" | "view";
    companyOptions?: Array<{ id: number; name: string; internal_email_domain?: string }>;
    /** Domínio sintético da empresa selecionada (usuario@slug.com). */
    tenantEmailDomain?: string | null;
    branchOptions?: Array<{ id: number; name: string; company_id?: number }>;
    /** Usuárioes da empresa (`company_id` do formulário) para vínculo opcional */
    userOptions?: Array<{ id: number; name: string; email?: string }>;
    lockCompanyId?: number | null;
    lockBranchId?: number | null;
    /** Fluxo filial: vincular vs criar usuário */
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
    /** Cargos disponíveis para a filial principal do funcionário. */
    positionOptions?: PositionPluckItem[];
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
    tenantEmailDomain: null,
    positionOptions: () => [],
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
/** Só busca automática após o usuário interagir com o CEP (evita ViaCEP ao abrir edição com CEP já guardado). */
const zipTouchedByUser = ref(false);
let zipLookupDebounceTimer: ReturnType<typeof setTimeout> | null = null;
/** Ver/ocultar senhas ao criar usuário no fluxo filial. */
const showNewUserPassword = ref(false);
const isView = computed(() => props.mode === "view");
const isCreate = computed(() => props.mode === "create");
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

const positionSelectRef = ref<HTMLSelectElement | null>(null);
let positionSelectr: any = null;

const positionDisplayName = computed(() => {
  const pid = Number(props.modelValue.position_id ?? 0);
  if (!pid) return "—";
  return props.positionOptions?.find((p) => p.id === pid)?.name || `Cargo #${pid}`;
});

const branchSelectEls = new Map<number, HTMLSelectElement>();
const branchAssignmentSelectrs = new Map<number, any>();
const sectorSelectEls = new Map<number, HTMLSelectElement>();
const sectorAssignmentSelectrs = new Map<number, any>();
const modalitySelectEls = new Map<number, HTMLSelectElement>();
const modalityAssignmentSelectrs = new Map<number, any>();

const sectorOptionsByRow = ref<SectorPluckItem[][]>([]);
const modalityOptionsByRow = ref<ModalityTypePluckItem[][]>([]);

function sectorScheduleForRow(index: number, sectorId?: number): string {
  const sid = Number(sectorId ?? 0);
  if (sid <= 0) return "";
  const sector = (sectorOptionsByRow.value[index] ?? []).find((s) => s.id === sid) as
    | (SectorPluckItem & { start_time?: string; end_time?: string })
    | undefined;
  const start = String(sector?.start_time ?? "").trim();
  const end = String(sector?.end_time ?? "").trim();
  if (!start || !end) return "";
  return `${start} às ${end}`;
}

function modalityTypeLabelForRow(index: number, row: { modality_type_id?: number }): string {
  const id = Number(row.modality_type_id ?? 0);
  if (id <= 0) return "—";
  const o = (modalityOptionsByRow.value[index] ?? []).find((m) => m.id === id);
  return o?.name?.trim() || `— #${id}`;
}

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
  return `Usuário #${uid}`;
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

const selectedAssignmentBranchIds = computed(() =>
  (props.modelValue.assignments ?? [])
    .map((a) => Number(a.branch_id ?? 0))
    .filter((id) => id > 0)
);

const availableBranchIdsForNewRow = computed(() => {
  const selected = new Set(selectedAssignmentBranchIds.value);
  return branchesFilteredForForm.value.map((b) => b.id).filter((id) => !selected.has(id));
});

const canAddAssignmentRow = computed(() => availableBranchIdsForNewRow.value.length > 0);

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

const tenantDomainNormalized = computed(() => (props.tenantEmailDomain ?? "").trim().toLowerCase());
const useSplitTenantEmail = computed(() => Boolean(tenantDomainNormalized.value) && !isView.value);
const branchSyntheticEmailEnabled = computed(
  () =>
    isCreate.value &&
    useSplitTenantEmail.value &&
    !isView.value &&
    (!props.branchUserFlow || props.userAccessMode === "create")
);

const primaryAssignmentForAccess = computed(() => {
  const rows = props.modelValue.assignments ?? [];
  return rows.find((a) => !!a.is_primary) ?? rows[0] ?? null;
});

const linkedUserEmail = computed(() => {
  const uid = Number(props.modelValue.user_id ?? 0);
  if (uid <= 0) return "";
  const u = props.userOptions?.find((x) => x.id === uid);
  return String(u?.email ?? "").trim();
});

const branchSyntheticPreviewEmail = ref("");
let branchSyntheticPreviewSeq = 0;

async function refreshBranchSyntheticPreview(): Promise<void> {
  if (!branchSyntheticEmailEnabled.value) {
    branchSyntheticPreviewEmail.value = "";
    return;
  }
  const bid = Number(primaryAssignmentForAccess.value?.branch_id ?? 0);
  const sid = Number(primaryAssignmentForAccess.value?.sector_id ?? 0);
  if (bid <= 0 || sid <= 0) {
    branchSyntheticPreviewEmail.value = "";
    return;
  }
  const seq = ++branchSyntheticPreviewSeq;
  try {
    const res = await usersApi.syntheticEmailPreview({
      branch_id: bid,
      sector_id: sid,
    });
    if (seq !== branchSyntheticPreviewSeq) return;
    branchSyntheticPreviewEmail.value = String(res.preview?.email ?? "").trim();
  } catch {
    if (seq !== branchSyntheticPreviewSeq) return;
    branchSyntheticPreviewEmail.value = "";
  }
}

function parseEmailLocal(full: string, domain: string): string {
  const f = full.trim();
  const d = domain.toLowerCase();
  if (!f || !d) return f.replace(/@/g, "");
  const at = f.lastIndexOf("@");
  if (at < 0) return f.replace(/@/g, "");
  const host = f.slice(at + 1).toLowerCase();
  const local = f.slice(0, at);
  if (host === d) return local;
  return local.replace(/@/g, "");
}

function sanitizeEmailLocalInput(raw: string, domain: string): string {
  let s = String(raw ?? "").trim();
  const suffix = `@${domain.toLowerCase()}`;
  const lower = s.toLowerCase();
  if (lower.endsWith(suffix)) {
    s = s.slice(0, s.length - suffix.length).trim();
  }
  return s.replace(/@/g, "").trim();
}

const emailLocalModel = computed({
  get: () => parseEmailLocal(props.modelValue.email ?? "", tenantDomainNormalized.value),
  set: (v: string) => {
    const d = tenantDomainNormalized.value;
    if (!d) {
      updateField("email", v);
      return;
    }
    const cleaned = sanitizeEmailLocalInput(v, d);
    updateField("email", cleaned ? `${cleaned}@${d}` : "");
  },
});

watch(
  () => tenantDomainNormalized.value,
  (domain, prev) => {
    if (!domain || isView.value) return;
    const email = (props.modelValue.email ?? "").trim();
    if (!email) return;
    const lower = email.toLowerCase();
    if (prev && lower.endsWith(`@${prev}`)) {
      const local = email.slice(0, email.length - prev.length - 1).trim();
      const next = local ? `${local}@${domain}` : "";
      if (next !== email) updateField("email", next);
      return;
    }
    if (!email.includes("@")) {
      updateField("email", `${email}@${domain}`);
    }
  }
);

watch(
  () =>
    [
      branchSyntheticEmailEnabled.value,
      tenantDomainNormalized.value,
      primaryAssignmentForAccess.value?.branch_id ?? 0,
      primaryAssignmentForAccess.value?.sector_id ?? 0,
    ] as const,
  () => {
    void refreshBranchSyntheticPreview();
  },
  { immediate: true }
);

watch(
  () =>
    [
      branchSyntheticEmailEnabled.value,
      branchSyntheticPreviewEmail.value,
      props.userAccessMode,
      linkedUserEmail.value,
      props.modelValue.user_id,
    ] as const,
  () => {
    if (isView.value) return;
    if (props.branchUserFlow && props.userAccessMode === "link") {
      const linked = linkedUserEmail.value;
      if (linked && (props.modelValue.email ?? "").trim().toLowerCase() !== linked.toLowerCase()) {
        updateField("email", linked);
      }
      return;
    }
    if (!branchSyntheticEmailEnabled.value) return;
    const synthetic = branchSyntheticPreviewEmail.value.trim();
    if (!synthetic) {
      if ((props.modelValue.email ?? "").trim() !== "") updateField("email", "");
      return;
    }
    if ((props.modelValue.email ?? "").trim().toLowerCase() !== synthetic.toLowerCase()) {
      updateField("email", synthetic);
    }
  },
  { immediate: true }
);

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
  patch: Partial<{ branch_id: number; sector_id: number; modality_type_id: number; is_primary: boolean }>
) {
  const next = [...localForm.value.assignments];
  const cur = { ...next[index], ...patch };
  next[index] = cur;
  updateField("assignments", next);
  emit("clear-error", `assignments.${index}.branch_id`);
  emit("clear-error", `assignments.${index}.sector_id`);
  emit("clear-error", `assignments.${index}.modality_type_id`);
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

function destroyPositionSelectr() {
  positionSelectr?.destroy?.();
  positionSelectr = null;
}

function initPositionSelectr() {
  destroyPositionSelectr();
  if (isView.value) return;
  if (!positionSelectRef.value) return;
  positionSelectr = new Selectr(positionSelectRef.value, {
    searchable: true,
    multiple: false,
    placeholder: "Selecione um cargo",
  });
  positionSelectr.on("selectr.change", () => {
    const raw = positionSelectr?.getValue();
    updateField("position_id", raw === "" || raw == null ? 0 : Number(raw));
  });
  const pid = Number(props.modelValue.position_id ?? 0);
  if (pid > 0) positionSelectr.setValue(pid);
  else positionSelectr.setValue("");
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
    placeholder: props.branchUserFlow ? "Selecione o usuário" : "Sem usuário vinculado",
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
 * @param manual — true: usuário clicou no ícone; valida e permite repetir o mesmo CEP.
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

function isBranchSelectedInOtherRow(index: number, branchId: number): boolean {
  if (branchId <= 0) return false;
  return props.modelValue.assignments.some((row, rowIndex) => rowIndex !== index && Number(row.branch_id ?? 0) === branchId);
}

function branchOptionDisabledForRow(index: number, branchId: number): boolean {
  return isBranchSelectedInOtherRow(index, branchId);
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

function setModalitySelectEl(index: number, el: unknown) {
  if (el instanceof HTMLSelectElement) {
    modalitySelectEls.set(index, el);
  } else {
    modalitySelectEls.delete(index);
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

function destroyModalityAssignmentSelectrs() {
  modalityAssignmentSelectrs.forEach((s) => s.destroy?.());
  modalityAssignmentSelectrs.clear();
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
    const branchId = Number(row?.branch_id ?? 0);
    if (branchId <= 0) continue;
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

async function initModalityAssignmentSelectrs() {
  destroyModalityAssignmentSelectrs();
  if (!useAssignmentSelectrs.value) return;
  await nextTick();
  const rows = props.modelValue.assignments.length;
  for (let index = 0; index < rows; index++) {
    const el = modalitySelectEls.get(index);
    if (!el) continue;
    const row = props.modelValue.assignments[index];
    const selr = new Selectr(el, {
      searchable: true,
      multiple: false,
      placeholder: "Selecione a modalidade de domingo",
    });
    selr.on("selectr.change", () => {
      const raw = selr.getValue();
      const mid = raw === "" || raw == null ? 0 : Number(raw);
      updateAssignment(index, { modality_type_id: mid });
    });
    modalityAssignmentSelectrs.set(index, selr);
    const mId = Number(row?.modality_type_id ?? 0);
    if (mId > 0) selr.setValue(mId);
    else selr.setValue("");
  }
}

async function initAssignmentRowSelectrs() {
  await initBranchAssignmentSelectrs();
  await initSectorAssignmentSelectrs();
  await initModalityAssignmentSelectrs();
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

async function loadModalityTypesForRow(index: number, branchId: number) {
  if (branchId <= 0) {
    modalityOptionsByRow.value[index] = [];
    return;
  }
  try {
    const plucks = await modalityTypesApi.plucks({ branch_id: branchId });
    modalityOptionsByRow.value[index] = plucks;
  } catch {
    modalityOptionsByRow.value[index] = [];
  }
}

async function onAssignmentBranchChange(index: number, branchId: number) {
  const previousBranchId = Number(props.modelValue.assignments[index]?.branch_id ?? 0);
  if (branchId > 0 && isBranchSelectedInOtherRow(index, branchId) && branchId !== previousBranchId) {
    notifyError("Esta filial já foi selecionada noutra linha. Escolha uma filial diferente.");
    const selr = branchAssignmentSelectrs.get(index);
    if (selr) {
      if (previousBranchId > 0) selr.setValue(previousBranchId);
      else selr.setValue("");
    }
    return;
  }
  updateAssignment(index, { branch_id: branchId, sector_id: 0, modality_type_id: 0 });
  await loadSectorsForRow(index, branchId);
  await loadModalityTypesForRow(index, branchId);
}

function addAssignmentRow() {
  if (!canAddAssignmentRow.value) return;
  const nextBranchId = Number(availableBranchIdsForNewRow.value[0] ?? 0);
  const next = [
    ...localForm.value.assignments,
    { branch_id: nextBranchId, sector_id: 0, modality_type_id: 0, is_primary: false },
  ];
  if (!next.some((a) => a.is_primary)) {
    next[0] = { ...next[0], is_primary: true };
  }
  updateField("assignments", next);
  sectorOptionsByRow.value.push([]);
  modalityOptionsByRow.value.push([]);
}

function removeAssignmentRow(index: number) {
  if (localForm.value.assignments.length <= 1) return;
  const next = localForm.value.assignments.filter((_, i) => i !== index);
  if (!next.some((a) => a.is_primary) && next.length) {
    next[0] = { ...next[0], is_primary: true };
  }
  updateField("assignments", next);
  sectorOptionsByRow.value.splice(index, 1);
  modalityOptionsByRow.value.splice(index, 1);
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
      await loadModalityTypesForRow(i, bid);
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
    assignmentBranches: props.modelValue.assignments.map((a) => a.branch_id),
    branches: branchesFilteredForForm.value.map((b) => b.id),
    sectorRows: sectorOptionsByRow.value.map((row) => row.map((s) => s.id)),
    modalityRows: modalityOptionsByRow.value.map((row) => row.map((m) => m.id)),
    n: props.modelValue.assignments.length,
  })
);

watch(assignmentSelectSignature, async () => {
  await nextTick();
  await initAssignmentRowSelectrs();
});

const positionSelectSignature = computed(() =>
  JSON.stringify({
    mode: props.mode,
    position_id: props.modelValue.position_id,
    positions: props.positionOptions?.map((p) => p.id) ?? [],
  })
);

watch(positionSelectSignature, async () => {
  await nextTick();
  initPositionSelectr();
});

onMounted(async () => {
  await nextTick();
  initCompanySelectr();
  initUserSelectr();
  initPositionSelectr();
  for (let i = 0; i < props.modelValue.assignments.length; i++) {
    const bid = props.modelValue.assignments[i].branch_id;
    await loadSectorsForRow(i, bid);
    await loadModalityTypesForRow(i, bid);
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
  destroyModalityAssignmentSelectrs();
  destroySelectrs();
  destroyUserSelectr();
  destroyPositionSelectr();
});
</script>

<template>
  <div class="employee-form-layout" :class="{ 'employee-form-layout--setup-first': !isView }">
  <UIComponentCard title="Dados pessoais" class="employee-card employee-card-personal">
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
      <b-col v-if="!branchUserFlow" md="6">
        <b-form-group :label-for="useSplitTenantEmail ? 'emp-email-local' : 'emp-email'">
          <template #label>
            {{ useSplitTenantEmail ? "E-mail (usuário)" : "E-mail"
            }}<span v-if="req" class="text-danger ms-1" aria-hidden="true">*</span>
          </template>
          <template v-if="branchSyntheticEmailEnabled && useSplitTenantEmail">
            <b-input-group>
              <b-form-input
                id="emp-email-local"
                :model-value="emailLocalModel || '-'"
                type="text"
                readonly
                class="bg-body-secondary user-select-all"
                :class="{ 'is-invalid': errors?.email }"
              />
              <b-input-group-text class="text-body-secondary user-select-all">
                @{{ tenantEmailDomain }}
              </b-input-group-text>
            </b-input-group>
            <b-form-text class="d-block">
              Defina filial e setor principal para gerar o e-mail automático.
            </b-form-text>
          </template>
          <template v-else-if="useSplitTenantEmail">
            <b-input-group>
              <b-form-input
                id="emp-email-local"
                v-model="emailLocalModel"
                type="text"
                placeholder="joao.silva"
                autocomplete="off"
                :class="{ 'is-invalid': errors?.email }"
              />
              <b-input-group-text class="text-body-secondary user-select-all">
                @{{ tenantEmailDomain }}
              </b-input-group-text>
            </b-input-group>
            <b-form-text class="d-block">O domínio é fixo para esta empresa. Digite só o nome antes do @.</b-form-text>
          </template>
          <b-form-input
            v-else
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
      <b-col :md="branchUserFlow ? 6 : 12">
        <b-form-group label-for="emp-position_id">
          <template #label>Cargo</template>
          <b-form-input
            v-if="isView"
            readonly
            tabindex="-1"
            :model-value="positionDisplayName"
            class="bg-light"
          />
          <template v-else>
            <select
              id="emp-position_id"
              ref="positionSelectRef"
              class="form-select"
              :class="{ 'is-invalid': !!errors?.position_id }"
            >
              <option value="">Selecione um cargo</option>
              <option v-for="p in positionOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </template>
          <b-form-invalid-feedback v-if="errors?.position_id">{{ errors.position_id }}</b-form-invalid-feedback>
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
        <b-form-group label="Usuário vinculado (conta de acesso)">
          <b-form-input readonly tabindex="-1" :model-value="linkedUserDisplayName" class="bg-light" />
        </b-form-group>
      </b-col>
    </b-row>
  </UIComponentCard>

  <UIComponentCard :title="assignmentCardTitle" class="mt-3 employee-card employee-card-assignment">
    <p v-if="!isView" class="text-muted small mb-3">
      <template v-if="hideBranchAssignmentField || isBranchLocked">
        Escolha o setor e a modalidade de domingo desta filial. Não é possível vincular outras filiais.
      </template>
      <template v-else> Em cada filial, indique o setor e a modalidade de domingo (obrigatórios) do colaborador. </template>
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
              <option
                v-for="b in branchesFilteredForForm"
                :key="b.id"
                :value="b.id"
                :disabled="branchOptionDisabledForRow(index, b.id)"
              >
                {{ b.name }}
              </option>
            </select>
            <b-form-invalid-feedback v-if="errors?.[`assignments.${index}.branch_id`]">
              {{ errors[`assignments.${index}.branch_id`] }}
            </b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col :md="hideBranchAssignmentField ? 8 : 5">
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
            <b-form-text v-if="sectorScheduleForRow(index, row.sector_id)">
              Horário do setor: {{ sectorScheduleForRow(index, row.sector_id) }}
            </b-form-text>
          </b-form-group>
        </b-col>
        <b-col :md="hideBranchAssignmentField ? 4 : 2">
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
      <b-row v-if="row.branch_id" class="g-3 mt-1">
        <b-col md="12">
          <b-form-group
            :label-for="`emp-m-${index}`"
          >
            <template #label>
              <span v-if="hideBranchAssignmentField">Modalidade de domingo</span>
              <span v-else>Modalidade de domingo (filial #{{ index + 1 }})</span
              ><span
                v-if="req && row.branch_id"
                class="text-danger ms-1"
                aria-hidden="true"
                >*</span
              >
            </template>
            <b-form-input
              v-if="isView"
              :id="`emp-m-${index}`"
              readonly
              tabindex="-1"
              class="bg-light"
              :model-value="modalityTypeLabelForRow(index, row)"
            />
            <template v-else>
              <select
                :id="`emp-m-${index}`"
                :ref="(el) => setModalitySelectEl(index, el)"
                class="form-select"
                :disabled="isView || !row.branch_id"
                :class="{ 'is-invalid': errors?.[`assignments.${index}.modality_type_id`] }"
              >
                <option value="">Selecione</option>
                <option v-for="m in modalityOptionsByRow[index] ?? []" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
              <b-form-text> Obrigatório: tipo de modalidade de domingo da filial para este colaborador. </b-form-text>
              <b-form-invalid-feedback v-if="errors?.[`assignments.${index}.modality_type_id`]">
                {{ errors[`assignments.${index}.modality_type_id`] }}
              </b-form-invalid-feedback>
            </template>
          </b-form-group>
        </b-col>
      </b-row>
    </div>
    <b-button
      v-if="!isView && !isBranchLocked && !hideBranchAssignmentField && canAddAssignmentRow"
      variant="outline-primary"
      size="sm"
      @click="addAssignmentRow"
    >
      <i class="iconoir-plus me-1"></i>
      Adicionar filial
    </b-button>
  </UIComponentCard>

  <UIComponentCard v-if="!isView" :title="accessAccountCardTitle" class="mt-3 employee-card employee-card-access">
    <b-row class="g-3">
      <b-col v-if="branchUserFlow" md="12">
        <template v-if="branchAccessAccountState === 'pending'">
          <p class="text-muted small mb-0 d-flex align-items-center gap-2">
            <b-spinner small class="flex-shrink-0" role="status" aria-hidden="true" />
            <span>A verificar limites e usuárioes disponíveis…</span>
          </p>
        </template>
        <template v-else-if="branchAccessAccountState === 'blocked'">
          <div class="alert alert-warning mb-0" role="alert">
            Entre em contato com a <strong>empresa Matriz</strong> sobre os limites de usuárioes e de funcionários. Não é
            possível criar um novo usuário para este funcionário; só é permitido vincular um existente com acesso à
            empresa. Neste momento não há usuárioes disponíveis para vínculo nesta filial.
          </div>
        </template>
        <template v-else-if="branchAccessAccountState === 'link_only'">
          <p class="text-muted small mb-2">
            O limite de usuárioes da empresa foi atingido. Não é possível criar uma nova conta; vincule um usuário
            existente com acesso a esta filial.
          </p>
          <p class="text-muted small mb-2">
            Só aparecem usuárioes desta filial que ainda não estão ligados a outro funcionário.
          </p>
          <template v-if="!canPickLinkedUser">
            <p class="text-muted small mb-0">
              {{ hideCompanyField ? "Aguarde o carregamento dos dados." : "Selecione a empresa." }}
            </p>
          </template>
          <template v-else>
            <b-form-group label-for="emp-user_id">
              <template #label>
                Usuário<span v-if="reqAccessUserLink" class="text-danger ms-1" aria-hidden="true">*</span>
              </template>
              <select
                id="emp-user_id"
                ref="userSelectRef"
                class="form-select"
                :class="{ 'is-invalid': !!errors?.user_id }"
              >
                <option value="" :selected="!localForm.user_id">Selecione o usuário</option>
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
            <b-form-radio v-if="!hideCreateUserOption" value="create">Criar novo usuário</b-form-radio>
          </b-form-radio-group>
          <p class="text-muted small mb-2">
            Só aparecem usuárioes desta filial que ainda não estão ligados a outro funcionário.
          </p>
          <template v-if="userAccessMode === 'link'">
            <p v-if="!canPickLinkedUser" class="text-muted small mb-0">
              {{ hideCompanyField ? "Aguarde o carregamento dos dados." : "Selecione a empresa." }}
            </p>
            <template v-else>
              <b-form-group label-for="emp-user_id">
                <template #label>
                  Usuário<span v-if="reqAccessUserLink" class="text-danger ms-1" aria-hidden="true">*</span>
                </template>
                <select
                  id="emp-user_id"
                  ref="userSelectRef"
                  class="form-select"
                  :class="{ 'is-invalid': !!errors?.user_id }"
                >
                  <option value="" :selected="!localForm.user_id">Selecione o usuário</option>
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
              <b-col md="12">
                <b-form-group :label-for="useSplitTenantEmail ? 'emp-email-create-local' : 'emp-email-create'">
                  <template #label>
                    {{ useSplitTenantEmail ? "E-mail (usuário)" : "E-mail"
                    }}<span v-if="reqAccessUserCreate" class="text-danger ms-1" aria-hidden="true">*</span>
                  </template>
                  <template v-if="branchSyntheticEmailEnabled && useSplitTenantEmail">
                    <b-input-group>
                      <b-form-input
                        id="emp-email-create-local"
                        :model-value="emailLocalModel"
                        type="text"
                        readonly
                        class="bg-body-secondary user-select-all"
                        :class="{ 'is-invalid': !!errors?.email }"
                      />
                      <b-input-group-text class="text-body-secondary user-select-all">@{{ tenantEmailDomain }}</b-input-group-text>
                    </b-input-group>
                    <p class="text-muted small mb-0 mt-1">
                      Gerado automaticamente pela regra de setor + sequência de usuário + filial.
                    </p>
                  </template>
                  <template v-else-if="useSplitTenantEmail">
                    <b-input-group>
                      <b-form-input
                        id="emp-email-create-local"
                        v-model="emailLocalModel"
                        type="text"
                        placeholder="joao.silva"
                        autocomplete="off"
                        :class="{ 'is-invalid': !!errors?.email }"
                      />
                      <b-input-group-text class="text-body-secondary user-select-all">@{{ tenantEmailDomain }}</b-input-group-text>
                    </b-input-group>
                    <p class="text-muted small mb-0 mt-1">O domínio é fixo para esta empresa. Digite só o nome antes do @.</p>
                  </template>
                  <b-form-input
                    v-else
                    id="emp-email-create"
                    :model-value="modelValue.email"
                    type="email"
                    :class="{ 'is-invalid': !!errors?.email }"
                    @update:model-value="updateField('email', String($event ?? ''))"
                  />
                  <b-form-invalid-feedback v-if="errors?.email" class="d-block">{{ errors.email }}</b-form-invalid-feedback>
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-group label-for="emp-nup">
                  <template #label>
                    Senha<span v-if="reqAccessUserCreate" class="text-danger ms-1" aria-hidden="true">*</span>
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
                    Confirmar senha<span v-if="reqAccessUserCreate" class="text-danger ms-1" aria-hidden="true">*</span>
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
                    class="form-select"
                    :value="Number(newUserRoleId ?? 0) || ''"
                    :class="{ 'is-invalid': !!errors?.new_user_role }"
                    @change="
                      emit('update:newUserRoleId', Number(($event.target as HTMLSelectElement).value || 0));
                      emit('clear-error', 'new_user_role');
                    "
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
        <b-form-group label="Usuário vinculado" label-for="emp-user_id">
          <p v-if="!canPickLinkedUser" class="text-muted small mb-0">
            {{
              hideCompanyField
                ? "Aguarde o carregamento dos dados."
                : "Selecione a empresa para listar usuárioes com acesso a essa empresa."
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
              Usuárioes da empresa sem vínculo a funcionário. Um usuário só pode estar ligado a um funcionário.
            </p>
          </template>
        </b-form-group>
      </b-col>
    </b-row>
  </UIComponentCard>

  <div v-if="!isView" class="d-flex gap-2 mt-3 employee-form-actions">
    <slot name="actions" />
  </div>
  </div>
</template>

<style scoped>
.employee-form-layout--setup-first {
  display: flex;
  flex-direction: column;
}

.employee-form-layout--setup-first .employee-card-assignment {
  order: 1;
}

.employee-form-layout--setup-first .employee-card-personal {
  order: 2;
}

.employee-form-layout--setup-first .employee-card-access {
  order: 3;
}

.employee-form-layout--setup-first .employee-form-actions {
  order: 4;
}
</style>
