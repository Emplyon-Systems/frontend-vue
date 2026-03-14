<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";

export interface ScaleTypesFilterModel {
  name: string;
  company_ids: number[];
  branch_ids: number[];
  created_at_from: string;
  created_at_until: string;
  per_page: number;
}

export interface BranchOption {
  id: number;
  name: string;
  company_id?: number;
}

const props = defineProps<{
  modelValue: ScaleTypesFilterModel;
  active?: boolean;
  companyOptions?: Array<{ id: number; name: string }>;
  branchOptions?: BranchOption[];
  showCompanyFilter?: boolean;
  hideBranchSelector?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: ScaleTypesFilterModel): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();

const companySelectRef = ref<HTMLSelectElement | null>(null);
const branchSelectRef = ref<HTMLSelectElement | null>(null);
const suppressReinitCompany = ref(false);
const suppressReinitBranch = ref(false);
let companySelectr: any = null;
let branchSelectr: any = null;

const filteredBranchOptions = computed(() => {
  const branches = props.branchOptions ?? [];
  const companyIds = props.modelValue.company_ids;
  if (!companyIds?.length) return branches;
  return branches.filter((b) => b.company_id != null && companyIds.includes(b.company_id));
});

function update<K extends keyof ScaleTypesFilterModel>(field: K, value: ScaleTypesFilterModel[K]) {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
}

function parseIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((entry) => Number(String(entry).trim())).filter((id) => Number.isFinite(id) && id > 0);
  }
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) && n > 0 ? [n] : [];
}

function selectionLabel(count: number, singular: string, plural: string): string {
  if (!count) return "Nenhuma selecionada";
  return `${count} ${count === 1 ? singular : plural} selecionada${count === 1 ? "" : "s"}`;
}

function clearCompanySelection() {
  update("company_ids", []);
}

function clearBranchSelection() {
  update("branch_ids", []);
}

async function applyFilters() {
  const next: Partial<ScaleTypesFilterModel> = { ...props.modelValue };
  if (props.showCompanyFilter && companySelectr) {
    next.company_ids = parseIds(companySelectr.getValue());
  }
  if (!props.hideBranchSelector && branchSelectr) {
    next.branch_ids = parseIds(branchSelectr.getValue());
  }
  emit("update:modelValue", next as ScaleTypesFilterModel);
  await nextTick();
  emit("apply");
}

function destroySelectrs() {
  companySelectr?.destroy?.();
  companySelectr = null;
  branchSelectr?.destroy?.();
  branchSelectr = null;
}

function initCompanySelectr() {
  if (!props.showCompanyFilter || !companySelectRef.value || !props.companyOptions?.length) return;
  companySelectr = new Selectr(companySelectRef.value, {
    searchable: true,
    multiple: true,
    placeholder: "Todas",
  });
  companySelectr.on("selectr.change", () => {
    suppressReinitCompany.value = true;
    update("company_ids", parseIds(companySelectr?.getValue()));
  });
  const ids = props.modelValue.company_ids;
  if (ids?.length) companySelectr.setValue(ids);
}

function initBranchSelectr() {
  if (props.hideBranchSelector || !branchSelectRef.value || !filteredBranchOptions.value.length) return;
  branchSelectr = new Selectr(branchSelectRef.value, {
    searchable: true,
    multiple: true,
    placeholder: "Todas",
  });
  branchSelectr.on("selectr.change", () => {
    suppressReinitBranch.value = true;
    update("branch_ids", parseIds(branchSelectr?.getValue()));
  });
  const ids = props.modelValue.branch_ids;
  if (ids?.length) branchSelectr.setValue(ids);
}

const companySelectSignature = computed(() =>
  JSON.stringify({
    show: props.showCompanyFilter,
    company_ids: props.modelValue.company_ids,
    options: props.companyOptions?.map((c) => c.id) ?? [],
  })
);

const branchSelectSignature = computed(() =>
  JSON.stringify({
    hide: props.hideBranchSelector,
    branch_ids: props.modelValue.branch_ids,
    options: filteredBranchOptions.value.map((b) => b.id),
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
      <b-col v-if="showCompanyFilter && companyOptions?.length" md="4">
        <b-form-group label="Empresa" label-for="filter-scale-type-company">
          <select
            id="filter-scale-type-company"
            ref="companySelectRef"
            class="form-select"
            multiple
          >
            <option
              v-for="company in companyOptions ?? []"
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
      <b-col md="4">
        <b-form-group label="Nome" label-for="filter-scale-type-name">
          <b-form-input
            id="filter-scale-type-name"
            :model-value="modelValue.name"
            type="text"
            placeholder="Nome"
            @update:model-value="update('name', String($event ?? ''))"
          />
        </b-form-group>
      </b-col>
      <b-col v-if="!hideBranchSelector && (branchOptions?.length ?? 0) > 0" md="4">
        <b-form-group label="Filial" label-for="filter-scale-type-branch">
          <select
            id="filter-scale-type-branch"
            ref="branchSelectRef"
            class="form-select"
            multiple
          >
            <option
              v-for="branch in filteredBranchOptions"
              :key="branch.id"
              :value="branch.id"
              :selected="modelValue.branch_ids.includes(branch.id)"
            >
              {{ branch.name }}
            </option>
          </select>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <small class="text-muted">
              {{ showCompanyFilter && modelValue.company_ids?.length ? "Filiais das empresas selecionadas" : selectionLabel(modelValue.branch_ids.length, "filial", "filiais") }}
            </small>
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
      <b-col md="6">
        <b-form-group label="Data de cadastro de" label-for="filter-scale-type-created-from">
          <b-form-input
            id="filter-scale-type-created-from"
            :model-value="modelValue.created_at_from"
            type="date"
            @update:model-value="update('created_at_from', String($event ?? ''))"
          />
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Data de cadastro até" label-for="filter-scale-type-created-until">
          <b-form-input
            id="filter-scale-type-created-until"
            :model-value="modelValue.created_at_until"
            type="date"
            @update:model-value="update('created_at_until', String($event ?? ''))"
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
