<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";

export interface AuditsFilterModel {
  events: string[];
  auditable_types: string[];
  company_ids: number[];
  branch_ids: number[];
  created_at_from: string;
  created_at_until: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: AuditsFilterModel;
    active?: boolean;
    eventOptions?: Array<{ value: string; label: string }>;
    auditableTypeOptions?: Array<{ value: string; label: string }>;
    companyOptions?: Array<{ id: number; name: string }>;
    branchOptions?: Array<{ id: number; company_id?: number; name: string }>;
  }>(),
  {
    eventOptions: () => [],
    auditableTypeOptions: () => [],
    companyOptions: () => [],
    branchOptions: () => [],
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: AuditsFilterModel): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();

const eventSelectRef = ref<HTMLSelectElement | null>(null);
const typeSelectRef = ref<HTMLSelectElement | null>(null);
const companySelectRef = ref<HTMLSelectElement | null>(null);
const branchSelectRef = ref<HTMLSelectElement | null>(null);
const suppressReinitEvent = ref(false);
const suppressReinitType = ref(false);
const suppressReinitCompany = ref(false);
const suppressReinitBranch = ref(false);
let eventSelectr: any = null;
let typeSelectr: any = null;
let companySelectr: any = null;
let branchSelectr: any = null;

function update<K extends keyof AuditsFilterModel>(field: K, value: AuditsFilterModel[K]) {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
}

function parseStringList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value == null || value === "" ? [] : [value];
  return values.map((item) => String(item).trim()).filter((item) => item.length > 0);
}

function parseNumberList(value: unknown): number[] {
  return parseStringList(value)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function selectionLabel(count: number, singular: string, plural: string): string {
  if (!count) return "Nenhuma seleção";
  return `${count} ${count === 1 ? singular : plural} selecionada${count === 1 ? "" : "s"}`;
}

const filteredBranchOptions = computed(() => {
  const companyIds = props.modelValue.company_ids ?? [];
  if (!companyIds.length) return props.branchOptions;
  return props.branchOptions.filter((b) => companyIds.includes(Number(b.company_id ?? 0)));
});

function destroySelectrs() {
  eventSelectr?.destroy?.();
  typeSelectr?.destroy?.();
  companySelectr?.destroy?.();
  branchSelectr?.destroy?.();
  eventSelectr = null;
  typeSelectr = null;
  companySelectr = null;
  branchSelectr = null;
}

function initEventSelectr() {
  if (!eventSelectRef.value || !props.eventOptions.length) return;
  eventSelectr = new Selectr(eventSelectRef.value, { searchable: true, multiple: true, placeholder: "Todos" });
  eventSelectr.on("selectr.change", () => {
    suppressReinitEvent.value = true;
    update("events", parseStringList(eventSelectr.getValue()));
  });
  if (props.modelValue.events?.length) eventSelectr.setValue(props.modelValue.events);
}

function initTypeSelectr() {
  if (!typeSelectRef.value || !props.auditableTypeOptions.length) return;
  typeSelectr = new Selectr(typeSelectRef.value, { searchable: true, multiple: true, placeholder: "Todos" });
  typeSelectr.on("selectr.change", () => {
    suppressReinitType.value = true;
    update("auditable_types", parseStringList(typeSelectr.getValue()));
  });
  if (props.modelValue.auditable_types?.length) typeSelectr.setValue(props.modelValue.auditable_types);
}

function initCompanySelectr() {
  if (!companySelectRef.value || !props.companyOptions.length) return;
  companySelectr = new Selectr(companySelectRef.value, { searchable: true, multiple: true, placeholder: "Todas" });
  companySelectr.on("selectr.change", () => {
    suppressReinitCompany.value = true;
    const companyIds = parseNumberList(companySelectr.getValue());
    const nextBranchIds = (props.modelValue.branch_ids ?? []).filter((id) =>
      filteredBranchOptions.value.some((b) => b.id === id)
    );
    emit("update:modelValue", {
      ...props.modelValue,
      company_ids: companyIds,
      branch_ids: nextBranchIds,
    });
  });
  if (props.modelValue.company_ids?.length) companySelectr.setValue(props.modelValue.company_ids);
}

function initBranchSelectr() {
  if (!branchSelectRef.value || !filteredBranchOptions.value.length) return;
  branchSelectr = new Selectr(branchSelectRef.value, { searchable: true, multiple: true, placeholder: "Todas" });
  branchSelectr.on("selectr.change", () => {
    suppressReinitBranch.value = true;
    update("branch_ids", parseNumberList(branchSelectr.getValue()));
  });
  if (props.modelValue.branch_ids?.length) branchSelectr.setValue(props.modelValue.branch_ids);
}

const selectSignature = computed(() =>
  JSON.stringify({
    events: props.eventOptions.map((o) => o.value),
    types: props.auditableTypeOptions.map((o) => o.value),
    companies: props.companyOptions.map((o) => o.id),
    branches: filteredBranchOptions.value.map((o) => o.id),
  })
);

watch(selectSignature, async () => {
  if (suppressReinitEvent.value || suppressReinitType.value || suppressReinitCompany.value || suppressReinitBranch.value) {
    suppressReinitEvent.value = false;
    suppressReinitType.value = false;
    suppressReinitCompany.value = false;
    suppressReinitBranch.value = false;
    return;
  }
  await nextTick();
  destroySelectrs();
  initEventSelectr();
  initTypeSelectr();
  initCompanySelectr();
  initBranchSelectr();
});

onMounted(async () => {
  await nextTick();
  await nextTick();
  initEventSelectr();
  initTypeSelectr();
  initCompanySelectr();
  initBranchSelectr();
});

onBeforeUnmount(() => destroySelectrs());
</script>

<template>
  <div class="p-0">
    <b-row class="g-3">
      <b-col md="6">
        <b-form-group label="Evento" label-for="filter-audits-events">
          <select id="filter-audits-events" ref="eventSelectRef" class="form-select" multiple>
            <option
              v-for="opt in eventOptions"
              :key="opt.value"
              :value="opt.value"
              :selected="modelValue.events.includes(opt.value)"
            >
              {{ opt.label }}
            </option>
          </select>
          <small class="text-muted d-block mt-1">{{ selectionLabel(modelValue.events.length, "evento", "eventos") }}</small>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Tipo (modelo)" label-for="filter-audits-types">
          <select id="filter-audits-types" ref="typeSelectRef" class="form-select" multiple>
            <option
              v-for="opt in auditableTypeOptions"
              :key="opt.value"
              :value="opt.value"
              :selected="modelValue.auditable_types.includes(opt.value)"
            >
              {{ opt.label }}
            </option>
          </select>
          <small class="text-muted d-block mt-1">{{ selectionLabel(modelValue.auditable_types.length, "tipo", "tipos") }}</small>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Empresa" label-for="filter-audits-companies">
          <select id="filter-audits-companies" ref="companySelectRef" class="form-select" multiple>
            <option
              v-for="company in companyOptions"
              :key="company.id"
              :value="company.id"
              :selected="modelValue.company_ids.includes(company.id)"
            >
              {{ company.name }}
            </option>
          </select>
          <small class="text-muted d-block mt-1">{{ selectionLabel(modelValue.company_ids.length, "empresa", "empresas") }}</small>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Filial" label-for="filter-audits-branches">
          <select id="filter-audits-branches" ref="branchSelectRef" class="form-select" multiple>
            <option
              v-for="branch in filteredBranchOptions"
              :key="branch.id"
              :value="branch.id"
              :selected="modelValue.branch_ids.includes(branch.id)"
            >
              {{ branch.name }}
            </option>
          </select>
          <small class="text-muted d-block mt-1">{{ selectionLabel(modelValue.branch_ids.length, "filial", "filiais") }}</small>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Data de cadastro de" label-for="filter-audits-created-from">
          <b-form-input
            id="filter-audits-created-from"
            :model-value="modelValue.created_at_from"
            type="date"
            @update:model-value="update('created_at_from', $event)"
          />
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Data de cadastro até" label-for="filter-audits-created-until">
          <b-form-input
            id="filter-audits-created-until"
            :model-value="modelValue.created_at_until"
            type="date"
            @update:model-value="update('created_at_until', $event)"
          />
        </b-form-group>
      </b-col>
    </b-row>

    <div class="d-flex justify-content-end gap-2 mt-3">
      <b-button variant="outline-secondary" @click="$emit('reset')">Limpar</b-button>
      <b-button variant="primary" @click="$emit('apply')">Aplicar filtros</b-button>
    </div>
  </div>
</template>
