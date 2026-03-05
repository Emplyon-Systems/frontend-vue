<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "mobius1-selectr";
import type { UserFormData } from "@/core/schemas";

const props = withDefaults(
  defineProps<{
    modelValue: UserFormData;
    errors?: Record<string, string>;
    mode?: "create" | "edit" | "view";
    roleOptions: { id: number; name: string }[];
    companyOptions?: { id: number; name: string }[];
    branchOptions?: { id: number; name: string; company_name?: string }[];
    showCompanySelector?: boolean;
  }>(),
  {
    errors: () => ({}),
    mode: "create",
    companyOptions: () => [],
    branchOptions: () => [],
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

const localForm = computed({
  get: () => props.modelValue,
  set: (value: UserFormData) => emit("update:modelValue", value),
});

const currentRoles = computed<number[]>(() => props.modelValue.roles ?? []);
const currentCompanyIds = computed<number[]>(() => props.modelValue.company_ids ?? []);
const currentBranchIds = computed<number[]>(() => props.modelValue.branch_ids ?? []);
const roleSelectRef = ref<HTMLSelectElement | null>(null);
const companySelectRef = ref<HTMLSelectElement | null>(null);
const branchSelectRef = ref<HTMLSelectElement | null>(null);
let roleSelectr: any = null;
let companySelectr: any = null;
let branchSelectr: any = null;

function updateField<K extends keyof UserFormData>(field: K, value: UserFormData[K]) {
  localForm.value = { ...localForm.value, [field]: value };
  emit("clear-error", field);
}

function parseNumberList(value: unknown): number[] {
  const arrayValue = Array.isArray(value) ? value : value == null || value === "" ? [] : [value];
  return arrayValue
    .map((entry) => Number(String(entry).trim()))
    .filter((entry) => Number.isFinite(entry) && entry > 0);
}

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

function destroyRoleSelectr() {
  roleSelectr?.destroy?.();
  roleSelectr = null;
}

function destroyCompanySelectr() {
  companySelectr?.destroy?.();
  companySelectr = null;
}

function destroyBranchSelectr() {
  branchSelectr?.destroy?.();
  branchSelectr = null;
}

function destroySelectrs() {
  destroyRoleSelectr();
  destroyCompanySelectr();
  destroyBranchSelectr();
}

function initRoleSelectr() {
  destroyRoleSelectr();
  if (roleSelectRef.value) {
    roleSelectr = new Selectr(roleSelectRef.value, {
      multiple: true,
      searchable: true,
      placeholder: "Selecione um ou mais perfis",
    });
    roleSelectr.on("selectr.change", () => {
      updateField("roles", parseNumberList(roleSelectr.getValue()));
    });
    const roleIds = currentRoles.value.length ? currentRoles.value.map(String) : [];
    if (roleIds.length) roleSelectr.setValue(roleIds);
  }
}

function initCompanySelectr() {
  destroyCompanySelectr();
  if (props.showCompanySelector && companySelectRef.value) {
    companySelectr = new Selectr(companySelectRef.value, {
      multiple: true,
      searchable: true,
      placeholder: "Selecione uma ou mais empresas",
    });
    companySelectr.on("selectr.change", () => {
      updateField("company_ids", parseNumberList(companySelectr.getValue()));
    });
    const companyIds = currentCompanyIds.value.length ? currentCompanyIds.value.map(String) : [];
    if (companyIds.length) companySelectr.setValue(companyIds);
  }
}

function initBranchSelectr() {
  destroyBranchSelectr();
  if (branchSelectRef.value) {
    branchSelectr = new Selectr(branchSelectRef.value, {
      multiple: true,
      searchable: true,
      placeholder: "Selecione uma ou mais filiais",
    });
    branchSelectr.on("selectr.change", () => {
      updateField("branch_ids", parseNumberList(branchSelectr.getValue()));
    });
    const branchIds = currentBranchIds.value.length ? currentBranchIds.value.map(String) : [];
    if (branchIds.length) branchSelectr.setValue(branchIds);
  }
}

function initSelectrs() {
  initRoleSelectr();
  initCompanySelectr();
  initBranchSelectr();
}

const roleOptionsSignature = computed(() =>
  JSON.stringify({
    roles: props.roleOptions.map((r) => r.id),
  })
);

const companyOptionsSignature = computed(() =>
  JSON.stringify({
    companies: props.companyOptions.map((c) => c.id),
    showCompanySelector: props.showCompanySelector,
  })
);

const branchOptionsSignature = computed(() =>
  JSON.stringify({
    branches: props.branchOptions.map((b) => b.id),
  })
);

watch(roleOptionsSignature, async () => {
  if (isView) return;
  await nextTick();
  initRoleSelectr();
});

watch(companyOptionsSignature, async () => {
  if (isView) return;
  await nextTick();
  initCompanySelectr();
});

watch(branchOptionsSignature, async () => {
  if (isView) return;
  await nextTick();
  initBranchSelectr();
});

onMounted(async () => {
  if (isView) return;
  await nextTick();
  initSelectrs();
});

onBeforeUnmount(() => {
  destroySelectrs();
});
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
            @click="showUserPassword = !showUserPassword"
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
    <b-col v-if="showCompanySelector" md="6">
      <b-form-group label="Empresa" class="mb-3">
        <template v-if="companyOptions.length">
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
              :selected="currentCompanyIds.includes(company.id)"
            >
              {{ company.name }}
            </option>
          </select>
          <b-form-invalid-feedback v-if="errors.company_ids" class="d-block">
            {{ errors.company_ids }}
          </b-form-invalid-feedback>
        </template>
        <span v-else class="text-muted">Nenhuma empresa disponível.</span>
      </b-form-group>
    </b-col>
    <b-col :md="showCompanySelector ? 6 : 12">
      <b-form-group label="Filial" class="mb-3">
        <template v-if="branchOptions.length">
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
              :selected="currentBranchIds.includes(branch.id)"
            >
              {{ branch.name }}
            </option>
          </select>
          <b-form-invalid-feedback v-if="errors.branch_ids" class="d-block">
            {{ errors.branch_ids }}
          </b-form-invalid-feedback>
        </template>
        <span v-else class="text-muted">Nenhuma filial disponível.</span>
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
            :selected="currentRoles.includes(role.id)"
          >
            {{ role.name }}
          </option>
        </select>
        <b-form-invalid-feedback v-if="errors.roles" class="d-block">{{ errors.roles }}</b-form-invalid-feedback>
      </b-form-group>
    </b-col>
  </b-row>
  <b-row v-else>
    <b-col md="12">
      <b-form-group label="Perfis" class="mb-3">
        <div v-if="currentRoles.length" class="d-flex flex-wrap gap-1">
          <b-badge
            v-for="roleId in currentRoles"
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
        <div v-if="currentCompanyIds.length" class="d-flex flex-wrap gap-1">
          <b-badge
            v-for="companyId in currentCompanyIds"
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
        <div v-if="currentBranchIds.length" class="d-flex flex-wrap gap-1">
          <b-badge
            v-for="branchId in currentBranchIds"
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
  </b-row>
</template>
