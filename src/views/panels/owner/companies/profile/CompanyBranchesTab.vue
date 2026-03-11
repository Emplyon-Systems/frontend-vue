<template>
  <ListagemCard
    :columns="columns"
    :data="pagedBranches"
    :loading="false"
    :pagination="pagination"
    :per-page-options="[5, 10, 15, 25]"
    :result-label="resultLabel"
    :has-active-filters="false"
    empty-message="Nenhuma filial vinculada."
    result-badge-class="result-badge-default"
    @update:per-page="onPerPageChange"
    @update:page="onPageChange"
  >
    <template #row="{ item }">
      <b-tr>
        <b-td>{{ (item as CompanyBranch).id }}</b-td>
        <b-td>{{ (item as CompanyBranch).name }}</b-td>
        <b-td>{{ (item as CompanyBranch).cnpj || "—" }}</b-td>
        <b-td>{{ formatCityState(item as CompanyBranch) }}</b-td>
        <b-td class="text-end">
          <b-button size="sm" variant="outline-primary" @click="goView((item as CompanyBranch).id)">
            Ver filial
          </b-button>
        </b-td>
      </b-tr>
    </template>
  </ListagemCard>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import ListagemCard from "@/components/ListagemCard.vue";
import type { CompanyRecord } from "@/types/api";

type CompanyBranch = NonNullable<CompanyRecord["branches"]>[number];

const props = defineProps<{
  branches?: CompanyRecord["branches"];
}>();

const router = useRouter();
const currentPage = ref(1);
const perPage = ref(5);

const columns = [
  { key: "id", label: "ID", sortable: false, align: "start" as const },
  { key: "name", label: "Nome", sortable: false, align: "start" as const },
  { key: "cnpj", label: "CNPJ", sortable: false, align: "start" as const },
  { key: "city_state", label: "Cidade/UF", sortable: false, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
];

const allBranches = computed<CompanyBranch[]>(() => props.branches ?? []);
const total = computed(() => allBranches.value.length);
const lastPage = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)));

const pagination = computed(() => ({
  current_page: Math.min(currentPage.value, lastPage.value),
  per_page: perPage.value,
  total: total.value,
  last_page: lastPage.value,
}));

const pagedBranches = computed<CompanyBranch[]>(() => {
  const page = Math.min(currentPage.value, lastPage.value);
  const start = (page - 1) * perPage.value;
  return allBranches.value.slice(start, start + perPage.value);
});

const resultLabel = computed(() => {
  if (total.value === 0) return "Nenhuma filial vinculada";
  if (total.value === 1) return "1 filial vinculada";
  return `${total.value} filiais vinculadas`;
});

function formatCityState(branch: CompanyBranch): string {
  const city = branch.city?.trim() ?? "";
  const state = branch.state?.trim() ?? "";
  if (!city && !state) return "—";
  if (!city) return state;
  if (!state) return city;
  return `${city}/${state}`;
}

function onPerPageChange(value: number) {
  perPage.value = value;
  currentPage.value = 1;
}

function onPageChange(page: number) {
  currentPage.value = page;
}

function goView(id: number) {
  router.push({ name: "owner.branches.view", params: { id: String(id) } });
}
</script>
