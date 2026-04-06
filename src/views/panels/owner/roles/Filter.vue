<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";

export interface RolesFilterModel {
  search: string;
  company_ids: number[];
  branch_ids: number[];
  created_at_from: string;
  created_at_until: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: RolesFilterModel;
    active?: boolean;
    showTenantFilters?: boolean;
    showCompanyFilter?: boolean;
    showBranchFilter?: boolean;
    companyOptions?: Array<{ id: number; name: string }>;
    branchOptions?: Array<{ id: number; company_id?: number; name: string }>;
  }>(),
  {
    showCompanyFilter: undefined,
    showBranchFilter: undefined,
  }
);
const effectiveShowCompany = computed(() =>
  props.showCompanyFilter !== undefined ? props.showCompanyFilter : props.showTenantFilters
);
const effectiveShowBranch = computed(() =>
  props.showBranchFilter !== undefined ? props.showBranchFilter : props.showTenantFilters
);

const emit = defineEmits<{
  (e: "update:modelValue", value: RolesFilterModel): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();
const companySelectRef = ref<HTMLSelectElement | null>(null);
const branchSelectRef = ref<HTMLSelectElement | null>(null);
const suppressReinitCompany = ref(false);
const suppressReinitBranch = ref(false);
let companySelectr: any = null;
let branchSelectr: any = null;

function update<K extends keyof RolesFilterModel>(field: K, value: RolesFilterModel[K]) {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
}

function parseNumberList(value: unknown): number[] {
  const arrayValue = Array.isArray(value) ? value : value == null || value === "" ? [] : [value];
  return arrayValue
    .map((entry) => Number(String(entry).trim()))
    .filter((entry) => Number.isFinite(entry) && entry > 0);
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
  });
}

function clearBranchSelection() {
  update("branch_ids", []);
}

async function applyFilters() {
  if (!effectiveShowCompany.value && !effectiveShowBranch.value) {
    emit("apply");
    return;
  }

  const companyIds = effectiveShowCompany.value
    ? parseNumberList(companySelectr?.getValue?.() ?? companySelectRef.value?.value ?? "")
    : props.modelValue.company_ids ?? [];
  const branchIds = effectiveShowBranch.value
    ? parseNumberList(branchSelectr?.getValue?.() ?? branchSelectRef.value?.value ?? "")
    : props.modelValue.branch_ids ?? [];
  emit("update:modelValue", {
    ...props.modelValue,
    company_ids: companyIds,
    branch_ids: branchIds,
  });
  await nextTick();
  emit("apply");
}

function destroySelectrs() {
  companySelectr?.destroy?.();
  branchSelectr?.destroy?.();
  companySelectr = null;
  branchSelectr = null;
}

function initCompanySelectr() {
  if (effectiveShowCompany.value && companySelectRef.value && (props.companyOptions?.length ?? 0) > 0) {
    companySelectr = new Selectr(companySelectRef.value, {
      searchable: true,
      multiple: true,
      placeholder: "Todas",
    });
    companySelectr.on("selectr.change", () => {
      suppressReinitCompany.value = true;
      const companyIds = parseNumberList(companySelectr.getValue());
      emit("update:modelValue", {
        ...props.modelValue,
        company_ids: companyIds,
        branch_ids: [],
      });
    });
    if (props.modelValue.company_ids?.length) companySelectr.setValue(props.modelValue.company_ids);
  }
}

function initBranchSelectr() {
  if (effectiveShowBranch.value && branchSelectRef.value && (props.branchOptions?.length ?? 0) > 0) {
    branchSelectr = new Selectr(branchSelectRef.value, {
      searchable: true,
      multiple: true,
      placeholder: "Todas",
    });
    branchSelectr.on("selectr.change", () => {
      suppressReinitBranch.value = true;
      const branchIds = parseNumberList(branchSelectr.getValue());
      update("branch_ids", branchIds);
    });
    if (props.modelValue.branch_ids?.length) branchSelectr.setValue(props.modelValue.branch_ids);
  }
}

function initSelectrs() {
  destroySelectrs();
  if (!effectiveShowCompany.value && !effectiveShowBranch.value) return;
  initCompanySelectr();
  initBranchSelectr();
}

const companySelectSignature = computed(() =>
  JSON.stringify({
    showCompany: effectiveShowCompany.value,
    company_ids: props.modelValue.company_ids,
    companies: props.companyOptions?.map((item) => item.id) ?? [],
  })
);

const branchSelectSignature = computed(() =>
  JSON.stringify({
    showBranch: effectiveShowBranch.value,
    branch_ids: props.modelValue.branch_ids,
    branches: props.branchOptions?.map((item) => item.id) ?? [],
  })
);

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
  initBranchSelectr();
});

onMounted(async () => {
  await nextTick();
  initCompanySelectr();
  initBranchSelectr();
});

onBeforeUnmount(() => {
  destroySelectrs();
});
</script>

<template>
  <div class="p-0">
    <b-row class="g-3">
      <b-col md="6">
        <b-form-group label="Pesquisar" label-for="filter-roles-search">
          <b-form-input
            id="filter-roles-search"
            :model-value="modelValue.search"
            type="text"
            placeholder="Nome ou slug do perfil..."
            @update:model-value="update('search', $event)"
          />
        </b-form-group>
      </b-col>
      <b-col v-if="effectiveShowCompany" md="6">
        <b-form-group label="Empresa" label-for="filter-roles-company">
          <select
            id="filter-roles-company"
            ref="companySelectRef"
            class="form-select"
            multiple
          >
            <option
              v-for="company in (companyOptions ?? [])"
              :key="company.id"
              :value="company.id"
              :selected="modelValue.company_ids.includes(company.id)"
            >
              {{ company.name }}
            </option>
          </select>
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
      <b-col v-if="effectiveShowBranch" md="6">
        <b-form-group label="Filial" label-for="filter-roles-branch">
          <select
            id="filter-roles-branch"
            ref="branchSelectRef"
            class="form-select"
            multiple
          >
            <option
              v-for="branch in (branchOptions ?? [])"
              :key="branch.id"
              :value="branch.id"
              :selected="modelValue.branch_ids.includes(branch.id)"
            >
              {{ branch.name }}
            </option>
          </select>
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
      <div class="w-100" aria-hidden="true" />
      <b-col md="3">
        <b-form-group label="Data de cadastro de" label-for="filter-roles-created-from">
          <b-form-input
            id="filter-roles-created-from"
            :model-value="modelValue.created_at_from"
            type="date"
            @update:model-value="update('created_at_from', $event)"
          />
        </b-form-group>
      </b-col>
      <b-col md="3">
        <b-form-group label="Data de cadastro até" label-for="filter-roles-created-until">
          <b-form-input
            id="filter-roles-created-until"
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
