<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ListagemCard from "@/components/ListagemCard.vue";

type BranchSector = { id: number; name: string; slug: string };

const props = defineProps<{
  sectors?: BranchSector[];
}>();

const route = useRoute();
const router = useRouter();
const currentPage = ref(1);
const perPage = ref(5);

const columns = [
  { key: "id", label: "ID", sortable: false, align: "start" as const },
  { key: "name", label: "Nome", sortable: false, align: "start" as const },
  { key: "slug", label: "Slug", sortable: false, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
];

const allSectors = computed<BranchSector[]>(() => props.sectors ?? []);
const total = computed(() => allSectors.value.length);
const lastPage = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)));

const pagination = computed(() => ({
  current_page: Math.min(currentPage.value, lastPage.value),
  per_page: perPage.value,
  total: total.value,
  last_page: lastPage.value,
}));

const pagedSectors = computed<BranchSector[]>(() => {
  const page = Math.min(currentPage.value, lastPage.value);
  const start = (page - 1) * perPage.value;
  return allSectors.value.slice(start, start + perPage.value);
});

const resultLabel = computed(() => {
  if (total.value === 0) return "Nenhum setor nesta filial";
  if (total.value === 1) return "1 setor";
  return `${total.value} setores`;
});

function onPerPageChange(value: number) {
  perPage.value = value;
  currentPage.value = 1;
}

function onPageChange(page: number) {
  currentPage.value = page;
}

function goView(id: number) {
  const r = String(route.name ?? "");
  const name = r.startsWith("company.")
    ? "company.sectors.view"
    : r.startsWith("branch.")
      ? "branch.sectors.view"
      : "owner.sectors.view";
  router.push({ name, params: { id: String(id) } });
}
</script>

<template>
  <ListagemCard
    :columns="columns"
    :data="pagedSectors"
    :loading="false"
    :pagination="pagination"
    :per-page-options="[5, 10, 15, 25]"
    :result-label="resultLabel"
    :has-active-filters="false"
    empty-message="Nenhum setor nesta filial."
    result-badge-class="result-badge-default"
    @update:per-page="onPerPageChange"
    @update:page="onPageChange"
  >
    <template #row="{ item }">
      <b-tr>
        <b-td>{{ (item as BranchSector).id }}</b-td>
        <b-td>{{ (item as BranchSector).name }}</b-td>
        <b-td><code>{{ (item as BranchSector).slug }}</code></b-td>
        <b-td class="text-end">
          <b-button size="sm" variant="outline-primary" @click="goView((item as BranchSector).id)">
            Ver setor
          </b-button>
        </b-td>
      </b-tr>
    </template>
  </ListagemCard>
</template>
