<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";

export interface UsersFilterModel {
  search: string;
  status: string;
  role_id: string;
  company_ids: string[];
  branch_ids: string[];
  sector_ids: string[];
  created_at_from: string;
  created_at_until: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: UsersFilterModel;
    active?: boolean;
    showCompanyFilter?: boolean;
    showBranchFilter?: boolean;
    showSectorFilter?: boolean;
    roleOptions?: { value: string; text: string }[];
    companyOptions?: { value: string; text: string }[];
    branchOptions?: { value: string; text: string; company_id?: number }[];
    sectorOptions?: { value: string; text: string; branch_id?: number }[];
  }>(),
  {
    showCompanyFilter: false,
    showBranchFilter: false,
    showSectorFilter: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: UsersFilterModel): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();
const filterColumnMd = computed(() => (props.showCompanyFilter ? 4 : 3));
const statusSelectRef = ref<HTMLSelectElement | null>(null);
const roleSelectRef = ref<HTMLSelectElement | null>(null);
const companySelectRef = ref<HTMLSelectElement | null>(null);
const branchSelectRef = ref<HTMLSelectElement | null>(null);
const sectorSelectRef = ref<HTMLSelectElement | null>(null);
const suppressReinitStatus = ref(false);
const suppressReinitRole = ref(false);
const suppressReinitCompany = ref(false);
const suppressReinitBranch = ref(false);
const suppressReinitSector = ref(false);
let statusSelectr: any = null;
let roleSelectr: any = null;
let companySelectr: any = null;
let branchSelectr: any = null;
let sectorSelectr: any = null;

function update<K extends keyof UsersFilterModel>(field: K, value: UsersFilterModel[K]) {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
}

function parseSingleString(value: unknown): string {
  const text = String(value ?? "").trim();
  return text;
}

function parseStringList(value: unknown): string[] {
  const arrayValue = Array.isArray(value) ? value : value == null || value === "" ? [] : [value];
  return arrayValue.map((entry) => String(entry ?? "").trim()).filter((entry) => !!entry);
}

function selectionLabel(count: number, singular: string, plural: string): string {
  if (!count) return "Nenhuma selecionada";
  return `${count} ${count === 1 ? singular : plural} selecionada${count === 1 ? "" : "s"}`;
}

function clearCompanySelection() {
  emit("update:modelValue", {
    ...props.modelValue,
    company_ids: [],
    branch_ids: [],
    sector_ids: [],
  });
}

function clearBranchSelection() {
  emit("update:modelValue", {
    ...props.modelValue,
    branch_ids: [],
    sector_ids: [],
  });
}

function clearSectorSelection() {
  update("sector_ids", []);
}

async function applyFilters() {
  const status = parseSingleString(statusSelectr?.getValue?.() ?? statusSelectRef.value?.value ?? "");
  const roleId = parseSingleString(roleSelectr?.getValue?.() ?? roleSelectRef.value?.value ?? "");
  const companyIds = props.showCompanyFilter
    ? parseStringList(companySelectr?.getValue?.() ?? companySelectRef.value?.value ?? "")
    : props.modelValue.company_ids ?? [];
  const branchIds = props.showBranchFilter
    ? parseStringList(branchSelectr?.getValue?.() ?? branchSelectRef.value?.value ?? "")
    : props.modelValue.branch_ids ?? [];
  const sectorIds = props.showSectorFilter
    ? parseStringList(sectorSelectr?.getValue?.() ?? sectorSelectRef.value?.value ?? "")
    : props.modelValue.sector_ids ?? [];
  emit("update:modelValue", {
    ...props.modelValue,
    status,
    role_id: roleId,
    company_ids: companyIds,
    branch_ids: branchIds,
    sector_ids: sectorIds,
  });
  await nextTick();
  emit("apply");
}

function destroySelectrs() {
  statusSelectr?.destroy?.();
  statusSelectr = null;
  roleSelectr?.destroy?.();
  roleSelectr = null;
  companySelectr?.destroy?.();
  companySelectr = null;
  branchSelectr?.destroy?.();
  branchSelectr = null;
  sectorSelectr?.destroy?.();
  sectorSelectr = null;
}

function initSelectrs() {
  destroySelectrs();

  if (statusSelectRef.value) {
    statusSelectr = new Selectr(statusSelectRef.value, {
      searchable: false,
      multiple: false,
      placeholder: "Todos",
    });
    statusSelectr.on("selectr.change", () => {
      suppressReinitStatus.value = true;
      update("status", parseSingleString(statusSelectr.getValue()));
    });
    if (props.modelValue.status) statusSelectr.setValue(props.modelValue.status);
  }
  if (roleSelectRef.value) {
    roleSelectr = new Selectr(roleSelectRef.value, {
      searchable: true,
      multiple: false,
      placeholder: "Todos",
    });
    roleSelectr.on("selectr.change", () => {
      suppressReinitRole.value = true;
      update("role_id", parseSingleString(roleSelectr.getValue()));
    });
    if (props.modelValue.role_id) roleSelectr.setValue(props.modelValue.role_id);
  }
  if (props.showCompanyFilter && companySelectRef.value && (props.companyOptions?.length ?? 0) > 0) {
    companySelectr = new Selectr(companySelectRef.value, {
      searchable: true,
      multiple: true,
      placeholder: "Todas",
    });
    companySelectr.on("selectr.change", () => {
      suppressReinitCompany.value = true;
      emit("update:modelValue", {
        ...props.modelValue,
        company_ids: parseStringList(companySelectr.getValue()),
        branch_ids: [],
        sector_ids: [],
      });
    });
    if (props.modelValue.company_ids?.length) companySelectr.setValue(props.modelValue.company_ids);
  }
  if (props.showBranchFilter && branchSelectRef.value && (props.branchOptions?.length ?? 0) > 0) {
    branchSelectr = new Selectr(branchSelectRef.value, {
      searchable: true,
      multiple: true,
      placeholder: "Todas",
    });
    branchSelectr.on("selectr.change", () => {
      suppressReinitBranch.value = true;
      emit("update:modelValue", {
        ...props.modelValue,
        branch_ids: parseStringList(branchSelectr.getValue()),
        sector_ids: [],
      });
    });
    if (props.modelValue.branch_ids?.length) branchSelectr.setValue(props.modelValue.branch_ids);
  }
  if (props.showSectorFilter && sectorSelectRef.value && (props.sectorOptions?.length ?? 0) > 0) {
    sectorSelectr = new Selectr(sectorSelectRef.value, {
      searchable: true,
      multiple: true,
      placeholder: "Todos",
    });
    sectorSelectr.on("selectr.change", () => {
      suppressReinitSector.value = true;
      update("sector_ids", parseStringList(sectorSelectr.getValue()));
    });
    if (props.modelValue.sector_ids?.length) sectorSelectr.setValue(props.modelValue.sector_ids);
  }
}

const statusSelectSignature = computed(() =>
  JSON.stringify({
    status: props.modelValue.status,
  })
);

const roleSelectSignature = computed(() =>
  JSON.stringify({
    role_id: props.modelValue.role_id,
    role_options: props.roleOptions?.map((o) => o.value) ?? [],
  })
);

const companySelectSignature = computed(() =>
  JSON.stringify({
    showCompany: props.showCompanyFilter,
    company_ids: props.modelValue.company_ids,
    company_options: props.companyOptions?.map((o) => o.value) ?? [],
  })
);

const branchSelectSignature = computed(() =>
  JSON.stringify({
    showBranch: props.showBranchFilter,
    branch_ids: props.modelValue.branch_ids,
    branch_options: props.branchOptions?.map((o) => o.value) ?? [],
  })
);

const sectorSelectSignature = computed(() =>
  JSON.stringify({
    showSector: props.showSectorFilter,
    sector_ids: props.modelValue.sector_ids,
    sector_options: props.sectorOptions?.map((o) => o.value) ?? [],
  })
);

watch(statusSelectSignature, async () => {
  if (suppressReinitStatus.value) {
    suppressReinitStatus.value = false;
    return;
  }
  await nextTick();
  statusSelectr?.destroy?.();
  statusSelectr = null;
  initSelectrs();
});

watch(roleSelectSignature, async () => {
  if (suppressReinitRole.value) {
    suppressReinitRole.value = false;
    return;
  }
  await nextTick();
  roleSelectr?.destroy?.();
  roleSelectr = null;
  initSelectrs();
});

watch(companySelectSignature, async () => {
  if (suppressReinitCompany.value) {
    suppressReinitCompany.value = false;
    return;
  }
  await nextTick();
  companySelectr?.destroy?.();
  companySelectr = null;
  initSelectrs();
});

watch(branchSelectSignature, async () => {
  if (suppressReinitBranch.value) {
    suppressReinitBranch.value = false;
    return;
  }
  await nextTick();
  branchSelectr?.destroy?.();
  branchSelectr = null;
  initSelectrs();
});

watch(sectorSelectSignature, async () => {
  if (suppressReinitSector.value) {
    suppressReinitSector.value = false;
    return;
  }
  await nextTick();
  sectorSelectr?.destroy?.();
  sectorSelectr = null;
  initSelectrs();
});

onMounted(async () => {
  await nextTick();
  initSelectrs();
});

onBeforeUnmount(() => {
  destroySelectrs();
});
</script>

<template>
  <div class="p-0">
    <b-row class="g-3">
      <b-col :md="filterColumnMd">
        <b-form-group label="Pesquisar" label-for="filter-users-search">
          <b-form-input
            id="filter-users-search"
            :model-value="modelValue.search"
            type="text"
            placeholder="Nome ou e-mail..."
            @update:model-value="update('search', $event)"
          />
        </b-form-group>
      </b-col>
      <b-col :md="filterColumnMd">
        <b-form-group label="Status" label-for="filter-users-status">
          <select
            id="filter-users-status"
            ref="statusSelectRef"
            class="form-select"
          >
            <option value="" :selected="modelValue.status === ''">Todos</option>
            <option value="active" :selected="modelValue.status === 'active'">Ativo</option>
            <option value="inactive" :selected="modelValue.status === 'inactive'">Inativo</option>
          </select>
        </b-form-group>
      </b-col>
      <b-col :md="filterColumnMd">
        <b-form-group label="Perfil" label-for="filter-users-role">
          <select
            id="filter-users-role"
            ref="roleSelectRef"
            class="form-select"
          >
            <option value="" :selected="modelValue.role_id === ''">Todos</option>
            <option
              v-for="role in (roleOptions ?? [])"
              :key="role.value"
              :value="role.value"
              :selected="modelValue.role_id === role.value"
            >
              {{ role.text }}
            </option>
          </select>
        </b-form-group>
      </b-col>
      <b-col v-if="showCompanyFilter" :md="filterColumnMd">
        <b-form-group label="Empresa" label-for="filter-users-company">
          <select
            v-if="(companyOptions?.length ?? 0) > 0"
            id="filter-users-company"
            ref="companySelectRef"
            class="form-select"
            multiple
          >
            <option
              v-for="company in (companyOptions ?? [])"
              :key="company.value"
              :value="company.value"
              :selected="modelValue.company_ids.includes(company.value)"
            >
              {{ company.text }}
            </option>
          </select>
          <span v-else class="text-muted">Nenhuma empresa disponível.</span>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <small class="text-muted">{{ selectionLabel(modelValue.company_ids.length, "empresa", "empresas") }}</small>
            <b-button
              v-if="modelValue.company_ids.length"
              type="button"
              variant="link"
              size="sm"
              class="p-0"
              @click="clearCompanySelection"
            >
              Limpar seleção
            </b-button>
          </div>
        </b-form-group>
      </b-col>
      <b-col v-if="showBranchFilter" :md="filterColumnMd">
        <b-form-group label="Filial" label-for="filter-users-branch">
          <select
            v-if="(branchOptions?.length ?? 0) > 0"
            id="filter-users-branch"
            ref="branchSelectRef"
            class="form-select"
            multiple
          >
            <option
              v-for="branch in (branchOptions ?? [])"
              :key="branch.value"
              :value="branch.value"
              :selected="modelValue.branch_ids.includes(branch.value)"
            >
              {{ branch.text }}
            </option>
          </select>
          <span v-else class="text-muted">Nenhuma filial disponível.</span>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <small class="text-muted">{{ selectionLabel(modelValue.branch_ids.length, "filial", "filiais") }}</small>
            <b-button
              v-if="modelValue.branch_ids.length"
              type="button"
              variant="link"
              size="sm"
              class="p-0"
              @click="clearBranchSelection"
            >
              Limpar seleção
            </b-button>
          </div>
        </b-form-group>
      </b-col>
      <b-col v-if="showSectorFilter" :md="filterColumnMd">
        <b-form-group label="Setor" label-for="filter-users-sector">
          <select
            v-if="(sectorOptions?.length ?? 0) > 0"
            id="filter-users-sector"
            ref="sectorSelectRef"
            class="form-select"
            multiple
          >
            <option
              v-for="sector in (sectorOptions ?? [])"
              :key="sector.value"
              :value="sector.value"
              :selected="modelValue.sector_ids.includes(sector.value)"
            >
              {{ sector.text }}
            </option>
          </select>
          <span v-else class="text-muted">Nenhum setor disponível.</span>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <small class="text-muted">{{ selectionLabel(modelValue.sector_ids.length, "setor", "setores") }}</small>
            <b-button
              v-if="modelValue.sector_ids.length"
              type="button"
              variant="link"
              size="sm"
              class="p-0"
              @click="clearSectorSelection"
            >
              Limpar seleção
            </b-button>
          </div>
        </b-form-group>
      </b-col>
    </b-row>
    <b-row class="g-3">
      <b-col md="6">
        <b-form-group label="Data de cadastro de" label-for="filter-users-created-from">
          <b-form-input
            id="filter-users-created-from"
            :model-value="modelValue.created_at_from"
            type="date"
            @update:model-value="update('created_at_from', $event)"
          />
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Data de cadastro até" label-for="filter-users-created-until">
          <b-form-input
            id="filter-users-created-until"
            :model-value="modelValue.created_at_until"
            type="date"
            @update:model-value="update('created_at_until', $event)"
          />
        </b-form-group>
      </b-col>
    </b-row>

    <div class="d-flex justify-content-end gap-2 mt-3">
      <b-button variant="outline-secondary" @click="$emit('reset')">Limpar</b-button>
      <b-button variant="primary" @click="applyFilters">Aplicar filtros</b-button>
    </div>
  </div>
</template>
