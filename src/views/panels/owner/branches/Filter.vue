<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "mobius1-selectr";

export interface BranchesFilterModel {
  name: string;
  cnpj: string;
  company_ids: number[];
  created_at_from: string;
  created_at_until: string;
  per_page: number;
}

const props = defineProps<{
  modelValue: BranchesFilterModel;
  active?: boolean;
  companyOptions?: Array<{ id: number; name: string }>;
  hideCompanySelector?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: BranchesFilterModel): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();
const companySelectRef = ref<HTMLSelectElement | null>(null);
const suppressNextReinit = ref(false);
let companySelectr: any = null;

function update<K extends keyof BranchesFilterModel>(field: K, value: BranchesFilterModel[K]) {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
}

function onCompanyChange(event: Event) {
  const target = event.target as HTMLSelectElement | null;
  if (!target) return;
  suppressNextReinit.value = true;
  const companyIds = Array.from(target.selectedOptions)
    .map((option) => Number(option.value))
    .filter((entry) => Number.isFinite(entry) && entry > 0);
  update("company_ids", companyIds);
}

function selectionLabel(count: number, singular: string, plural: string): string {
  if (!count) return "Nenhuma selecionada";
  return `${count} ${count === 1 ? singular : plural} selecionada${count === 1 ? "" : "s"}`;
}

function clearCompanySelection() {
  update("company_ids", []);
}

function parseSingleNumber(value: unknown): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

async function applyFilters() {
  if (props.hideCompanySelector) {
    emit("apply");
    return;
  }

  const listValue = companySelectr?.getValue?.() ?? companySelectRef.value?.value ?? "";
  const companyIds = Array.isArray(listValue)
    ? listValue.map((entry) => Number(String(entry).trim())).filter((entry) => Number.isFinite(entry) && entry > 0)
    : parseSingleNumber(listValue) != null
      ? [parseSingleNumber(listValue) as number]
      : [];
  emit("update:modelValue", {
    ...props.modelValue,
    company_ids: companyIds,
  });
  await nextTick();
  emit("apply");
}

function destroySelectrs() {
  companySelectr?.destroy?.();
  companySelectr = null;
}

function initSelectrs() {
  destroySelectrs();
  if (props.hideCompanySelector) return;
  if (!companySelectRef.value) return;

  companySelectr = new Selectr(companySelectRef.value, {
    searchable: true,
    multiple: true,
    placeholder: "Todas",
  });
  companySelectr.on("selectr.change", () => {
    suppressNextReinit.value = true;
    const value = companySelectr.getValue();
    const companyIds = Array.isArray(value)
      ? value.map((entry: unknown) => Number(String(entry).trim())).filter((entry: number) => Number.isFinite(entry) && entry > 0)
      : parseSingleNumber(value) != null
        ? [parseSingleNumber(value) as number]
        : [];
    update("company_ids", companyIds);
  });
}

const selectSignature = computed(() =>
  JSON.stringify({
    hideCompanySelector: props.hideCompanySelector,
    company_ids: props.modelValue.company_ids,
    companies: props.companyOptions?.map((item) => item.id) ?? [],
  })
);

watch(selectSignature, async () => {
  if (suppressNextReinit.value) {
    suppressNextReinit.value = false;
    return;
  }
  await nextTick();
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
      <b-col md="4">
        <b-form-group label="Nome da filial" label-for="filter-name">
          <b-form-input
            id="filter-name"
            :model-value="modelValue.name"
            type="text"
            placeholder="Nome da filial"
            @update:model-value="update('name', String($event ?? ''))"
          />
        </b-form-group>
      </b-col>
      <b-col md="4">
        <b-form-group label="CNPJ" label-for="filter-cnpj">
          <b-form-input
            id="filter-cnpj"
            :model-value="modelValue.cnpj"
            type="text"
            placeholder="CNPJ"
            @update:model-value="update('cnpj', String($event ?? ''))"
          />
        </b-form-group>
      </b-col>
      <b-col v-if="!hideCompanySelector" md="4">
        <b-form-group label="Empresa" label-for="filter-company">
          <select
            id="filter-company"
            ref="companySelectRef"
            class="form-select"
            multiple
            @change="onCompanyChange"
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
      <b-col md="6">
        <b-form-group label="Data de cadastro de" label-for="filter-created-from">
          <b-form-input
            id="filter-created-from"
            :model-value="modelValue.created_at_from"
            type="date"
            @update:model-value="update('created_at_from', String($event ?? ''))"
          />
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Data de cadastro até" label-for="filter-created-until">
          <b-form-input
            id="filter-created-until"
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
