<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";
import type { UserFormData } from "@/core/schemas";

const props = withDefaults(
  defineProps<{
    modelValue: UserFormData;
    errors?: Record<string, string>;
    /** Incrementado após erro de validação (cliente ou API) para abrir o separador certo. */
    submitAttempt?: number;
    mode?: "create" | "edit" | "view";
    roleOptions: { id: number; name: string; permission_ids?: number[] }[];
    permissionOptions?: { id: number; name: string; slug?: string }[];
    companyOptions?: { id: number; name: string }[];
    branchOptions?: { id: number; name: string; company_name?: string }[];
    sectorOptions?: { id: number; branch_id: number; name: string; slug?: string }[];
    fixedBranchId?: number | null;
    showCompanySelector?: boolean;
  }>(),
  {
    errors: () => ({}),
    submitAttempt: 0,
    mode: "create",
    companyOptions: () => [],
    permissionOptions: () => [],
    branchOptions: () => [],
    sectorOptions: () => [],
    fixedBranchId: null,
    showCompanySelector: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: UserFormData): void;
  (e: "clear-error", field: string): void;
}>();

const isCreate = props.mode === "create";
const isView = props.mode === "view";
const showUserPassword = ref(false);
const roleSelectRef = ref<HTMLSelectElement | null>(null);
const companySelectRef = ref<HTMLSelectElement | null>(null);
const branchSelectRef = ref<HTMLSelectElement | null>(null);
const sectorSelectRef = ref<HTMLSelectElement | null>(null);
const suppressReinitRole = ref(false);
const suppressReinitCompany = ref(false);
const suppressReinitBranch = ref(false);
const suppressReinitSector = ref(false);
let roleSelectr: any = null;
let companySelectr: any = null;
let branchSelectr: any = null;
let sectorSelectr: any = null;
const permissionSearch = ref("");
const moduleOpenState = ref<Record<string, boolean>>({});
/** Separador 0: dados pessoais / contexto; 1: perfis e permissões */
const activeTabIndex = ref(0);

const TAB0_FIELDS = new Set([
  "name",
  "email",
  "password",
  "password_confirmation",
  "company_ids",
  "branch_ids",
  "sector_ids",
  "status",
]);

watch(
  () => props.submitAttempt,
  async () => {
    const errs = props.errors ?? {};
    const keys = Object.keys(errs);
    if (!keys.length) return;
    await nextTick();
    const hasTab0 = keys.some((k) => TAB0_FIELDS.has(k));
    activeTabIndex.value = hasTab0 ? 0 : 1;
    await nextTick();
    const first = document.querySelector<HTMLElement>(
      "#user-name.is-invalid, #user-email.is-invalid, .user-selectr-field--invalid .selectr-selected"
    );
    first?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
);

const permissionModuleLabels: Record<string, string> = {
  audits: "Auditoria",
  branches: "Filiais",
  companies: "Empresas",
  modality_types: "Modalidades",
  permissions: "Permissões",
  scale_types: "Tipos de escala",
  roles: "Perfis",
  sectors: "Setores",
  shifts: "Turnos",
  users: "Usuários",
};

function togglePassword() {
  showUserPassword.value = !showUserPassword.value;
}

const localForm = computed({
  get: () => props.modelValue,
  set: (value: UserFormData) => emit("update:modelValue", value),
});

function parseIds(value: unknown): number[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => Number(String(entry).trim()))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
  const s = String(value ?? "").trim();
  if (!s) return [];
  if (s.includes(",")) {
    return s
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? [n] : [];
}

function sameSortedIds(a: number[], b: number[]): boolean {
  const sa = [...a].sort((x, y) => x - y).join(",");
  const sb = [...b].sort((x, y) => x - y).join(",");
  return sa === sb;
}

function selectionLabel(count: number, singular: string, plural: string): string {
  if (!count) return "Nenhum selecionado";
  return `${count} ${count === 1 ? singular : plural} selecionado${count === 1 ? "" : "s"}`;
}

function updateField<K extends keyof UserFormData>(field: K, value: UserFormData[K]) {
  localForm.value = { ...localForm.value, [field]: value };
  emit("clear-error", field);
}

function clearRoleSelection() {
  updateField("roles", []);
}

function clearPermissionSelection() {
  updateField("direct_permission_ids", []);
}

function clearBranchSelection() {
  updateField("branch_ids", []);
}

function destroySelectrs() {
  roleSelectr?.destroy?.();
  roleSelectr = null;
  companySelectr?.destroy?.();
  companySelectr = null;
  branchSelectr?.destroy?.();
  branchSelectr = null;
  sectorSelectr?.destroy?.();
  sectorSelectr = null;
}

function initRoleSelectr() {
  if (!roleSelectRef.value || !props.roleOptions.length) return;
  const ids = (props.modelValue.roles ?? []).map((n) => String(n));
  const sel = roleSelectRef.value;
  Array.from(sel.options).forEach((opt) => {
    (opt as HTMLOptionElement).selected = ids.includes(String(opt.value));
  });
  roleSelectr = new Selectr(sel, {
    searchable: true,
    multiple: true,
    placeholder: "Selecione um ou mais perfis",
    selectedValue: ids.length ? ids : undefined,
  });
  roleSelectr.on("selectr.change", () => {
    const next = parseIds(roleSelectr?.getValue());
    const prev = props.modelValue.roles ?? [];
    if (sameSortedIds(next, prev)) return;
    suppressReinitRole.value = true;
    updateField("roles", next);
  });
  if (ids.length) roleSelectr.setValue(ids);
}

function getPermissionModuleLabel(moduleName: string): string {
  return permissionModuleLabels[moduleName] ?? moduleName;
}

const inheritedPermissionIds = computed(() => {
  const selectedRoles = new Set(props.modelValue.roles ?? []);
  const ids = new Set<number>();
  for (const role of props.roleOptions) {
    if (!selectedRoles.has(role.id)) continue;
    for (const permissionId of role.permission_ids ?? []) {
      if (Number.isFinite(permissionId) && permissionId > 0) ids.add(permissionId);
    }
  }
  return ids;
});

const effectivePermissionIds = computed(() => {
  const ids = new Set<number>(inheritedPermissionIds.value);
  for (const permissionId of props.modelValue.direct_permission_ids ?? []) {
    if (Number.isFinite(permissionId) && permissionId > 0) ids.add(permissionId);
  }
  return ids;
});

const groupedPermissions = computed(() => {
  const term = permissionSearch.value.trim().toLowerCase();
  const groups = new Map<string, { id: number; name: string; slug: string }[]>();
  for (const permission of props.permissionOptions) {
    const slug = permission.slug ?? "";
    const text = `${permission.name} ${slug}`.toLowerCase();
    if (term && !text.includes(term)) continue;
    const moduleName = slug.split(".")[0] || "geral";
    if (!groups.has(moduleName)) groups.set(moduleName, []);
    groups.get(moduleName)!.push({ id: permission.id, name: permission.name, slug });
  }

  return [...groups.entries()]
    .sort(([a], [b]) => getPermissionModuleLabel(a).localeCompare(getPermissionModuleLabel(b)))
    .map(([moduleName, options]) => {
      const sorted = options.sort((a, b) => a.name.localeCompare(b.name));
      const checked = sorted.filter((p) => effectivePermissionIds.value.has(p.id)).length;
      const extras = sorted.filter((p) => (props.modelValue.direct_permission_ids ?? []).includes(p.id)).length;
      return {
        moduleName,
        moduleLabel: getPermissionModuleLabel(moduleName),
        options: sorted,
        total: sorted.length,
        checked,
        extras,
      };
    });
});

function isInheritedPermission(permissionId: number): boolean {
  return inheritedPermissionIds.value.has(permissionId);
}

function isExtraPermission(permissionId: number): boolean {
  return (props.modelValue.direct_permission_ids ?? []).includes(permissionId);
}

function isPermissionChecked(permissionId: number): boolean {
  return effectivePermissionIds.value.has(permissionId);
}

function togglePermission(permissionId: number, checked: boolean) {
  if (isInheritedPermission(permissionId)) return;
  const current = new Set(props.modelValue.direct_permission_ids ?? []);
  if (checked) current.add(permissionId);
  else current.delete(permissionId);
  updateField("direct_permission_ids", [...current]);
}

function toggleModule(moduleName: string, checked: boolean) {
  const group = groupedPermissions.value.find((g) => g.moduleName === moduleName);
  if (!group) return;
  const current = new Set(props.modelValue.direct_permission_ids ?? []);
  for (const permission of group.options) {
    if (isInheritedPermission(permission.id)) continue;
    if (checked) current.add(permission.id);
    else current.delete(permission.id);
  }
  updateField("direct_permission_ids", [...current]);
}

function onModuleToggle(moduleName: string, event: Event) {
  const element = event.target;
  if (!(element instanceof HTMLDetailsElement)) return;
  moduleOpenState.value[moduleName] = element.open;
}

function initCompanySelectr() {
  if (!props.showCompanySelector || !companySelectRef.value || !props.companyOptions.length) return;
  const ids = (props.modelValue.company_ids ?? []).map((n) => String(n));
  const sel = companySelectRef.value;
  Array.from(sel.options).forEach((opt) => {
    (opt as HTMLOptionElement).selected = ids.includes(String(opt.value));
  });
  companySelectr = new Selectr(sel, {
    searchable: true,
    multiple: true,
    placeholder: "Selecione uma ou mais empresas",
    selectedValue: ids.length ? ids : undefined,
  });
  companySelectr.on("selectr.change", () => {
    const next = parseIds(companySelectr?.getValue());
    const prev = props.modelValue.company_ids ?? [];
    if (sameSortedIds(next, prev)) return;
    suppressReinitCompany.value = true;
    updateField("company_ids", next);
  });
  if (ids.length) companySelectr.setValue(ids);
}

function initBranchSelectr() {
  if (props.fixedBranchId || !branchSelectRef.value || !props.branchOptions.length) return;
  const ids = (props.modelValue.branch_ids ?? []).map((n) => String(n));
  const sel = branchSelectRef.value;
  Array.from(sel.options).forEach((opt) => {
    (opt as HTMLOptionElement).selected = ids.includes(String(opt.value));
  });
  branchSelectr = new Selectr(sel, {
    searchable: true,
    multiple: true,
    placeholder: "Selecione uma ou mais filiais",
    selectedValue: ids.length ? ids : undefined,
  });
  branchSelectr.on("selectr.change", () => {
    const next = parseIds(branchSelectr?.getValue());
    const prev = props.modelValue.branch_ids ?? [];
    if (sameSortedIds(next, prev)) return;
    suppressReinitBranch.value = true;
    updateField("branch_ids", next);
  });
  if (ids.length) branchSelectr.setValue(ids);
}

function initSectorSelectr() {
  if (!sectorSelectRef.value || !props.sectorOptions.length) return;
  const ids = (props.modelValue.sector_ids ?? []).map((n) => String(n));
  const sel = sectorSelectRef.value;
  Array.from(sel.options).forEach((opt) => {
    (opt as HTMLOptionElement).selected = ids.includes(String(opt.value));
  });
  sectorSelectr = new Selectr(sel, {
    searchable: true,
    multiple: true,
    placeholder: "Selecione um ou mais setores",
    selectedValue: ids.length ? ids : undefined,
  });
  sectorSelectr.on("selectr.change", () => {
    const next = parseIds(sectorSelectr?.getValue());
    const prev = props.modelValue.sector_ids ?? [];
    if (sameSortedIds(next, prev)) return;
    suppressReinitSector.value = true;
    updateField("sector_ids", next);
  });
  if (ids.length) sectorSelectr.setValue(ids);
}

/** Já existe empresa no contexto (workspace ou seleção) — lista vazia de perfis é explicada em termos da empresa. */
const hasCompanyContextForRoles = computed(() => {
  if (!props.showCompanySelector) return true;
  return (props.modelValue.company_ids?.length ?? 0) > 0 || props.fixedBranchId != null;
});

/** Só lista de opções (não valores escolhidos) — evita destroy/reinit a cada clique no multiselect. */
const roleSelectSignature = computed(() =>
  JSON.stringify(props.roleOptions.map((r) => r.id))
);

const companySelectSignature = computed(() =>
  JSON.stringify({
    show: props.showCompanySelector,
    options: props.companyOptions.map((c) => c.id),
  })
);

const branchSelectSignature = computed(() =>
  JSON.stringify({
    fixed: props.fixedBranchId,
    options: props.branchOptions.map((b) => b.id),
  })
);

const sectorSelectSignature = computed(() => JSON.stringify(props.sectorOptions.map((s) => s.id)));

watch(roleSelectSignature, async () => {
  if (suppressReinitRole.value) {
    suppressReinitRole.value = false;
    return;
  }
  await nextTick();
  roleSelectr?.destroy?.();
  roleSelectr = null;
  await nextTick();
  initRoleSelectr();
});

watch(companySelectSignature, async () => {
  if (suppressReinitCompany.value) {
    suppressReinitCompany.value = false;
    return;
  }
  await nextTick();
  companySelectr?.destroy?.();
  companySelectr = null;
  initCompanySelectr();
});

watch(branchSelectSignature, async () => {
  if (suppressReinitBranch.value) {
    suppressReinitBranch.value = false;
    return;
  }
  await nextTick();
  branchSelectr?.destroy?.();
  branchSelectr = null;
  await nextTick();
  initBranchSelectr();
});

watch(sectorSelectSignature, async () => {
  if (suppressReinitSector.value) {
    suppressReinitSector.value = false;
    return;
  }
  await nextTick();
  sectorSelectr?.destroy?.();
  sectorSelectr = null;
  initSectorSelectr();
});

/** Quando o pai altera os IDs sem mudar a lista de opções — só sincroniza o plugin (sem destroy). */
watch(
  () => [...(props.modelValue.roles ?? [])].sort((a, b) => a - b).join(","),
  async () => {
    await nextTick();
    if (!roleSelectr) return;
    const want = (props.modelValue.roles ?? []).filter((id) => Number.isFinite(id) && id > 0);
    const have = parseIds(roleSelectr.getValue());
    if (sameSortedIds(want, have)) return;
    roleSelectr.setValue(want.map(String));
  }
);

watch(
  () => [...(props.modelValue.company_ids ?? [])].sort((a, b) => a - b).join(","),
  async () => {
    await nextTick();
    if (!companySelectr) return;
    const want = (props.modelValue.company_ids ?? []).filter((id) => Number.isFinite(id) && id > 0);
    const have = parseIds(companySelectr.getValue());
    if (sameSortedIds(want, have)) return;
    companySelectr.setValue(want.map(String));
  }
);

watch(
  () => [...(props.modelValue.branch_ids ?? [])].sort((a, b) => a - b).join(","),
  async () => {
    await nextTick();
    if (!branchSelectr) return;
    const want = (props.modelValue.branch_ids ?? []).filter((id) => Number.isFinite(id) && id > 0);
    const have = parseIds(branchSelectr.getValue());
    if (sameSortedIds(want, have)) return;
    branchSelectr.setValue(want.map(String));
  }
);

watch(
  () => [...(props.modelValue.sector_ids ?? [])].sort((a, b) => a - b).join(","),
  async () => {
    await nextTick();
    if (!sectorSelectr) return;
    const want = (props.modelValue.sector_ids ?? []).filter((id) => Number.isFinite(id) && id > 0);
    const have = parseIds(sectorSelectr.getValue());
    if (sameSortedIds(want, have)) return;
    sectorSelectr.setValue(want.map(String));
  }
);

onMounted(async () => {
  if (isView) return;
  await nextTick();
  await nextTick();
  initRoleSelectr();
  initCompanySelectr();
  initBranchSelectr();
  initSectorSelectr();
});

watch(
  () => Array.from(inheritedPermissionIds.value).sort((a, b) => a - b).join(","),
  () => {
    const inherited = inheritedPermissionIds.value;
    const direct = props.modelValue.direct_permission_ids ?? [];
    const normalized = direct.filter((id) => !inherited.has(id));
    if (normalized.length !== direct.length) {
      updateField("direct_permission_ids", normalized);
    }
  }
);

onBeforeUnmount(() => {
  destroySelectrs();
});

function generateRandomPassword(length = 12): void {
  if (isView) return;

  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*";
  const all = `${upper}${lower}${numbers}${symbols}`;
  const randomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  const passwordChars = [randomChar(upper), randomChar(lower), randomChar(numbers), randomChar(symbols)];
  for (let i = passwordChars.length; i < length; i += 1) passwordChars.push(randomChar(all));
  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  const generated = passwordChars.join("");
  localForm.value = {
    ...localForm.value,
    password: generated,
    ...(isCreate ? { password_confirmation: generated } : {}),
  };
  emit("clear-error", "password");
  if (isCreate) emit("clear-error", "password_confirmation");
}
</script>

<template>
  <template v-if="!isView">
    <b-tabs v-model="activeTabIndex" content-class="pt-3">
      <b-tab title="Informações pessoais">
        <b-row>
          <b-col md="6">
            <b-form-group label="Nome" label-for="user-name" class="mb-3">
              <b-form-input
                id="user-name"
                :model-value="modelValue.name"
                type="text"
                placeholder="Nome completo"
                :state="errors.name ? false : null"
                @update:model-value="updateField('name', $event)"
              />
              <b-form-invalid-feedback v-if="errors.name">{{ errors.name }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="E-mail" label-for="user-email" class="mb-3">
              <b-form-input
                id="user-email"
                :model-value="modelValue.email"
                type="email"
                placeholder="email@exemplo.com"
                :state="errors.email ? false : null"
                @update:model-value="updateField('email', $event)"
              />
              <b-form-invalid-feedback v-if="errors.email">{{ errors.email }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>

          <b-col md="6">
            <b-form-group :label="isCreate ? 'Palavra-passe' : 'Nova palavra-passe'" label-for="user-password" class="mb-3">
              <b-input-group>
                <b-form-input
                  id="user-password"
                  :model-value="modelValue.password ?? ''"
                  :type="showUserPassword ? 'text' : 'password'"
                  :placeholder="isCreate ? '••••••••' : 'Deixe em branco para não alterar'"
                  :state="errors.password ? false : null"
                  @update:model-value="updateField('password', $event || undefined)"
                />
                <b-button
                  type="button"
                  variant="outline-secondary"
                  :title="showUserPassword ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="togglePassword"
                >
                  <i :class="showUserPassword ? 'iconoir-eye-closed' : 'iconoir-eye'"></i>
                </b-button>
                <b-button
                  v-if="isCreate"
                  type="button"
                  variant="outline-primary"
                  @click="generateRandomPassword()"
                >
                  Gerar senha
                </b-button>
              </b-input-group>
              <b-form-invalid-feedback v-if="errors.password">{{ errors.password }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col v-if="isCreate" md="6">
            <b-form-group label="Confirmar palavra-passe" label-for="user-password-confirmation" class="mb-3">
              <b-form-input
                id="user-password-confirmation"
                :model-value="modelValue.password_confirmation ?? ''"
                :type="showUserPassword ? 'text' : 'password'"
                placeholder="••••••••"
                :state="errors.password_confirmation ? false : null"
                @update:model-value="updateField('password_confirmation', $event || undefined)"
              />
              <b-form-invalid-feedback v-if="errors.password_confirmation">
                {{ errors.password_confirmation }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>

          <b-col v-if="showCompanySelector && companyOptions.length" md="6">
            <b-form-group label="Empresa" class="mb-3">
              <div
                class="user-selectr-field"
                :class="{ 'user-selectr-field--invalid': Boolean(errors.company_ids) }"
              >
              <select
                id="user-companies-select"
                ref="companySelectRef"
                class="form-select"
                multiple
              >
                <option
                  v-for="company in companyOptions"
                  :key="company.id"
                  :value="company.id"
                  :selected="(modelValue.company_ids ?? []).includes(company.id)"
                >
                  {{ company.name }}
                </option>
              </select>
              </div>
              <div class="d-flex justify-content-between align-items-center mt-1">
                <small v-if="!errors.company_ids" class="text-muted">{{
                  selectionLabel((modelValue.company_ids ?? []).length, "empresa", "empresas")
                }}</small>
                <b-button
                  v-if="(modelValue.company_ids ?? []).length"
                  type="button"
                  variant="link"
                  size="sm"
                  class="p-0"
                  @click="updateField('company_ids', [])"
                >
                  Limpar seleção
                </b-button>
              </div>
              <b-form-invalid-feedback v-if="errors.company_ids" class="d-block">{{ errors.company_ids }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col v-if="showCompanySelector && !companyOptions.length" md="6">
            <b-form-group label="Empresa" class="mb-3">
              <span class="text-muted">Nenhuma empresa disponível.</span>
            </b-form-group>
          </b-col>
          <b-col :md="showCompanySelector ? 6 : 12">
            <b-form-group label="Filial" class="mb-3">
              <template v-if="branchOptions.length && !fixedBranchId">
                <div
                  class="user-selectr-field"
                  :class="{ 'user-selectr-field--invalid': Boolean(errors.branch_ids) }"
                >
                <select
                  id="user-branches-select"
                  ref="branchSelectRef"
                  class="form-select"
                  multiple
                >
                  <option
                    v-for="branch in branchOptions"
                    :key="branch.id"
                    :value="branch.id"
                    :selected="(modelValue.branch_ids ?? []).includes(branch.id)"
                  >
                    {{ branch.name }}
                  </option>
                </select>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-1">
                  <small v-if="!errors.branch_ids" class="text-muted">{{
                    selectionLabel((modelValue.branch_ids ?? []).length, "filial", "filiais")
                  }}</small>
                  <b-button
                    v-if="(modelValue.branch_ids ?? []).length"
                    type="button"
                    variant="link"
                    size="sm"
                    class="p-0"
                    @click="clearBranchSelection"
                  >
                    Limpar seleção
                  </b-button>
                </div>
                <b-form-invalid-feedback v-if="errors.branch_ids" class="d-block">{{ errors.branch_ids }}</b-form-invalid-feedback>
              </template>
              <template v-else-if="fixedBranchId">
                <div class="form-control bg-light">{{ branchOptions.find((b) => b.id === fixedBranchId)?.name ?? `Filial #${fixedBranchId}` }}</div>
                <small class="text-muted">Filial definida pelo contexto atual.</small>
              </template>
              <span v-else class="text-muted">Nenhuma filial disponível.</span>
            </b-form-group>
          </b-col>
          <b-col v-if="(modelValue.branch_ids ?? []).length && sectorOptions.length" md="12">
            <b-form-group label="Setores" class="mb-3">
              <div
                class="user-selectr-field"
                :class="{ 'user-selectr-field--invalid': Boolean(errors.sector_ids) }"
              >
              <select
                id="user-sectors-select"
                ref="sectorSelectRef"
                class="form-select"
                multiple
              >
                <option
                  v-for="sector in sectorOptions"
                  :key="sector.id"
                  :value="sector.id"
                  :selected="(modelValue.sector_ids ?? []).includes(sector.id)"
                >
                  {{ sector.name }}
                </option>
              </select>
              </div>
              <div class="d-flex justify-content-between align-items-center mt-1">
                <small v-if="!errors.sector_ids" class="text-muted">{{
                  selectionLabel((modelValue.sector_ids ?? []).length, "setor", "setores")
                }}</small>
                <b-button
                  v-if="(modelValue.sector_ids ?? []).length"
                  type="button"
                  variant="link"
                  size="sm"
                  class="p-0"
                  @click="updateField('sector_ids', [])"
                >
                  Limpar seleção
                </b-button>
              </div>
              <small class="text-muted">Setores das filiais selecionadas.</small>
            </b-form-group>
          </b-col>
          <b-col v-else-if="(modelValue.branch_ids ?? []).length && !sectorOptions.length" md="12">
            <b-form-group label="Setores" class="mb-3">
              <span class="text-muted">Nenhum setor disponível para as filiais selecionadas.</span>
            </b-form-group>
          </b-col>

          <b-col md="12">
            <b-form-group label="Status" class="mb-3">
              <div class="d-flex align-items-center gap-2">
                <span class="text-muted small">Inativo</span>
                <b-form-checkbox
                  id="user-status-switch"
                  switch
                  :model-value="(modelValue.status ?? 'active') === 'active'"
                  @update:model-value="updateField('status', $event ? 'active' : 'inactive')"
                />
                <span class="text-muted small">Ativo</span>
              </div>
              <small class="text-muted d-block mt-1">
                {{ (modelValue.status ?? "active") === "active" ? "Usuário ativo" : "Usuário inativo" }}
              </small>
              <b-form-invalid-feedback v-if="errors.status" class="d-block">{{ errors.status }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>
      </b-tab>

      <b-tab title="Permissões">
        <b-row>
          <b-col md="12">
            <b-form-group label="Perfis" class="mb-3">
              <template v-if="roleOptions.length">
                <div
                  class="user-selectr-field"
                  :class="{ 'user-selectr-field--invalid': Boolean(errors.roles) }"
                >
                  <select
                    id="user-roles-select"
                    ref="roleSelectRef"
                    class="form-select"
                    multiple
                  >
                    <option
                      v-for="role in roleOptions"
                      :key="role.id"
                      :value="role.id"
                      :selected="(modelValue.roles ?? []).includes(role.id)"
                    >
                      {{ role.name }}
                    </option>
                  </select>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-1">
                  <small v-if="!errors.roles" class="text-muted">{{
                    selectionLabel((modelValue.roles ?? []).length, "perfil", "perfis")
                  }}</small>
                  <b-button
                    v-if="(modelValue.roles ?? []).length"
                    type="button"
                    variant="link"
                    size="sm"
                    class="p-0"
                    @click="clearRoleSelection"
                  >
                    Limpar seleção
                  </b-button>
                </div>
              </template>
              <p v-else class="text-muted mb-0">
                {{
                  hasCompanyContextForRoles
                    ? "Não existem perfis cadastrados nesta empresa."
                    : "Selecione uma empresa para ver os perfis disponíveis."
                }}
              </p>
              <b-form-invalid-feedback v-if="errors.roles" class="d-block">{{ errors.roles }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>

          <b-col md="12">
            <b-form-group label="Permissões individuais" class="mb-3">
              <template v-if="permissionOptions.length">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <b-form-input
                    v-model="permissionSearch"
                    type="text"
                    placeholder="Pesquisar permissões..."
                    style="max-width: 360px"
                  />
                  <b-button
                    v-if="(modelValue.direct_permission_ids ?? []).length"
                    type="button"
                    variant="link"
                    size="sm"
                    class="p-0"
                    @click="clearPermissionSelection"
                  >
                    Limpar extras
                  </b-button>
                </div>

                <div v-if="groupedPermissions.length" class="border rounded">
                  <details
                    v-for="group in groupedPermissions"
                    :key="group.moduleName"
                    :open="moduleOpenState[group.moduleName] ?? (group.extras > 0 || group.checked > 0)"
                    class="border-bottom"
                    @toggle="onModuleToggle(group.moduleName, $event)"
                  >
                    <summary class="d-flex align-items-center justify-content-between px-3 py-2 cursor-pointer">
                      <strong>{{ group.moduleLabel }}</strong>
                      <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-light text-dark border">{{ group.checked }}/{{ group.total }}</span>
                        <span v-if="group.extras > 0" class="badge bg-warning text-dark">+{{ group.extras }} EXTRA</span>
                      </div>
                    </summary>
                    <div class="px-3 pb-3">
                      <b-form-checkbox
                        class="mb-2 permission-extra-toggle"
                        :model-value="group.options.filter((p) => !isInheritedPermission(p.id)).every((p) => isExtraPermission(p.id))"
                        @update:model-value="toggleModule(group.moduleName, Boolean($event))"
                      >
                        Marcar extras do módulo
                      </b-form-checkbox>
                      <b-row>
                        <b-col
                          v-for="permission in group.options"
                          :key="permission.id"
                          cols="12"
                          md="6"
                          lg="4"
                          class="mb-1 d-flex align-items-center justify-content-between gap-2 permission-item"
                          :class="{
                            'permission-item--inherited': isInheritedPermission(permission.id),
                            'permission-item--extra': isExtraPermission(permission.id),
                          }"
                        >
                          <b-form-checkbox
                            :model-value="isPermissionChecked(permission.id)"
                            :disabled="isInheritedPermission(permission.id)"
                            @update:model-value="togglePermission(permission.id, Boolean($event))"
                          >
                            {{ permission.name }} ({{ permission.slug }})
                          </b-form-checkbox>
                          <span v-if="isExtraPermission(permission.id)" class="badge permission-badge permission-badge--extra">+EXTRA</span>
                          <span v-else-if="isInheritedPermission(permission.id)" class="badge permission-badge permission-badge--inherited">Perfil</span>
                        </b-col>
                      </b-row>
                    </div>
                  </details>
                </div>
                <p v-else class="text-muted mb-0">Nenhuma permissão encontrada com esse filtro.</p>

                <small class="text-muted d-block mt-2">
                  Permissões herdadas do perfil ficam marcadas como "Perfil". Novas permissões no usuário são destacadas com "+EXTRA".
                </small>
                <b-form-invalid-feedback v-if="errors.direct_permission_ids" class="d-block">
                  {{ errors.direct_permission_ids }}
                </b-form-invalid-feedback>
              </template>
              <span v-else class="text-muted">Nenhuma permissão disponível para atribuir.</span>
            </b-form-group>
          </b-col>
        </b-row>
      </b-tab>
    </b-tabs>
  </template>

  <b-row v-else>
    <b-col md="6">
      <b-form-group label="Nome" class="mb-3">
        <div class="form-control bg-light">{{ modelValue.name }}</div>
      </b-form-group>
    </b-col>
    <b-col md="6">
      <b-form-group label="E-mail" class="mb-3">
        <div class="form-control bg-light">{{ modelValue.email }}</div>
      </b-form-group>
    </b-col>
    <b-col md="12">
      <b-form-group label="Status" class="mb-3">
        <b-badge :variant="(modelValue.status ?? 'active') === 'active' ? 'success' : 'danger'">
          {{ (modelValue.status ?? "active") === "active" ? "Ativo" : "Inativo" }}
        </b-badge>
      </b-form-group>
    </b-col>
    <b-col md="12">
      <b-form-group label="Permissões individuais" class="mb-3">
        <div v-if="(modelValue.direct_permission_ids ?? []).length" class="d-flex flex-wrap gap-1">
          <b-badge
            v-for="permissionId in (modelValue.direct_permission_ids ?? [])"
            :key="permissionId"
            variant="light"
            class="text-dark"
          >
            {{ permissionOptions.find((p) => p.id === permissionId)?.name ?? permissionId }}
          </b-badge>
        </div>
        <span v-else class="text-muted">—</span>
      </b-form-group>
    </b-col>
    <b-col md="12">
      <b-form-group label="Perfis" class="mb-3">
        <div v-if="(modelValue.roles ?? []).length" class="d-flex flex-wrap gap-1">
          <b-badge
            v-for="roleId in (modelValue.roles ?? [])"
            :key="roleId"
            variant="light"
            class="text-dark"
          >
            {{ roleOptions.find((r) => r.id === roleId)?.name ?? roleId }}
          </b-badge>
        </div>
        <span v-else class="text-muted">—</span>
      </b-form-group>
    </b-col>
    <b-col md="12">
      <b-form-group v-if="showCompanySelector" label="Empresas com acesso" class="mb-3">
        <div v-if="(modelValue.company_ids ?? []).length" class="d-flex flex-wrap gap-1">
          <b-badge
            v-for="companyId in (modelValue.company_ids ?? [])"
            :key="companyId"
            variant="light"
            class="text-dark"
          >
            {{ companyOptions.find((c) => c.id === companyId)?.name ?? companyId }}
          </b-badge>
        </div>
        <span v-else class="text-muted">—</span>
      </b-form-group>
    </b-col>
    <b-col md="12">
      <b-form-group label="Filiais com acesso" class="mb-3">
        <div v-if="(modelValue.branch_ids ?? []).length" class="d-flex flex-wrap gap-1">
          <b-badge
            v-for="branchId in (modelValue.branch_ids ?? [])"
            :key="branchId"
            variant="light"
            class="text-dark"
          >
            {{ branchOptions.find((b) => b.id === branchId)?.name ?? branchId }}
          </b-badge>
        </div>
        <span v-else class="text-muted">—</span>
      </b-form-group>
    </b-col>
    <b-col v-if="sectorOptions.length && (modelValue.sector_ids ?? []).length" md="12">
      <b-form-group label="Setores" class="mb-3">
        <div class="d-flex flex-wrap gap-1">
          <b-badge
            v-for="sectorId in (modelValue.sector_ids ?? [])"
            :key="sectorId"
            variant="light"
            class="text-dark"
          >
            {{ sectorOptions.find((s) => s.id === sectorId)?.name ?? sectorId }}
          </b-badge>
        </div>
      </b-form-group>
    </b-col>
  </b-row>
</template>

<style scoped>
/* Selectr: não usar is-invalid no <select> — o BS desenha borda/sombra no elemento nativo e o plugin deixa-o minúsculo; o erro ficava a “abraçar” tags como uma caixa. Só marcamos .selectr-selected. */
.user-selectr-field--invalid :deep(.selectr-selected) {
  border-color: var(--bs-danger) !important;
}
.user-selectr-field--invalid :deep(.selectr-container.open .selectr-selected) {
  border-color: var(--bs-danger) !important;
}

:deep(.permission-extra-toggle .form-check-input:checked) {
  background-color: #fd7e14;
  border-color: #fd7e14;
}

:deep(.permission-item--extra .form-check-input:checked) {
  background-color: #fd7e14;
  border-color: #fd7e14;
}

:deep(.permission-item--inherited .form-check-input:checked) {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

:deep(.permission-item--inherited .form-check-input:disabled) {
  opacity: 1;
}

.permission-badge {
  font-weight: 600;
}

.permission-badge--extra {
  background-color: #fd7e14;
  color: #1f2328;
}

.permission-badge--inherited {
  background-color: #0d6efd;
  color: #fff;
}
</style>
