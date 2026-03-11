<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";
import type { UserFormData } from "@/core/schemas";

const props = withDefaults(
  defineProps<{
    modelValue: UserFormData;
    errors?: Record<string, string>;
    mode?: "create" | "edit" | "view";
    roleOptions: { id: number; name: string }[];
    companyOptions?: { id: number; name: string }[];
    branchOptions?: { id: number; name: string; company_name?: string }[];
    sectorOptions?: { id: number; branch_id: number; name: string; slug?: string }[];
    fixedBranchId?: number | null;
    showCompanySelector?: boolean;
  }>(),
  {
    errors: () => ({}),
    mode: "create",
    companyOptions: () => [],
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

function togglePassword() {
  showUserPassword.value = !showUserPassword.value;
}

const localForm = computed({
  get: () => props.modelValue,
  set: (value: UserFormData) => emit("update:modelValue", value),
});

function parseIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => Number(String(entry).trim()))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) && n > 0 ? [n] : [];
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
    suppressReinitRole.value = true;
    updateField("roles", parseIds(roleSelectr?.getValue()));
  });
  if (ids.length) roleSelectr.setValue(ids);
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
    suppressReinitCompany.value = true;
    updateField("company_ids", parseIds(companySelectr?.getValue()));
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
    suppressReinitBranch.value = true;
    updateField("branch_ids", parseIds(branchSelectr?.getValue()));
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
    suppressReinitSector.value = true;
    updateField("sector_ids", parseIds(sectorSelectr?.getValue()));
  });
  if (ids.length) sectorSelectr.setValue(ids);
}

const roleSelectSignature = computed(() =>
  JSON.stringify({
    roles: props.modelValue.roles,
    options: props.roleOptions.map((r) => r.id),
  })
);

const companySelectSignature = computed(() =>
  JSON.stringify({
    show: props.showCompanySelector,
    company_ids: props.modelValue.company_ids,
    options: props.companyOptions.map((c) => c.id),
  })
);

const branchSelectSignature = computed(() =>
  JSON.stringify({
    fixed: props.fixedBranchId,
    branch_ids: props.modelValue.branch_ids,
    options: props.branchOptions.map((b) => b.id),
  })
);

const sectorSelectSignature = computed(() =>
  JSON.stringify({
    sector_ids: props.modelValue.sector_ids,
    options: props.sectorOptions.map((s) => s.id),
  })
);

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

onMounted(async () => {
  if (isView) return;
  await nextTick();
  await nextTick();
  initRoleSelectr();
  initCompanySelectr();
  initBranchSelectr();
  initSectorSelectr();
});

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
  <b-row>
    <b-col md="6">
      <b-form-group label="Nome" label-for="user-name" class="mb-3">
        <b-form-input
          id="user-name"
          :model-value="modelValue.name"
          type="text"
          placeholder="Nome completo"
          :readonly="isView"
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
          :readonly="isView"
          :state="errors.email ? false : null"
          @update:model-value="updateField('email', $event)"
        />
        <b-form-invalid-feedback v-if="errors.email">{{ errors.email }}</b-form-invalid-feedback>
      </b-form-group>
    </b-col>
  </b-row>
  <b-row v-if="!isView">
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
        <div class="d-flex justify-content-between align-items-center mt-1">
          <small class="text-muted">{{ selectionLabel((modelValue.company_ids ?? []).length, "empresa", "empresas") }}</small>
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
          <div class="d-flex justify-content-between align-items-center mt-1">
            <small class="text-muted">{{ selectionLabel((modelValue.branch_ids ?? []).length, "filial", "filiais") }}</small>
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
        <div class="d-flex justify-content-between align-items-center mt-1">
          <small class="text-muted">{{ selectionLabel((modelValue.sector_ids ?? []).length, "setor", "setores") }}</small>
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
      <b-form-group label="Perfis" class="mb-3">
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
        <div class="d-flex justify-content-between align-items-center mt-1">
          <small class="text-muted">{{ selectionLabel((modelValue.roles ?? []).length, "perfil", "perfis") }}</small>
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
        <b-form-invalid-feedback v-if="errors.roles" class="d-block">{{ errors.roles }}</b-form-invalid-feedback>
      </b-form-group>
    </b-col>
  </b-row>
  <b-row v-else>
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
