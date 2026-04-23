<script setup lang="ts">
import { onMounted, ref } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import ListagemCard, { type ListagemColumn } from "@/components/ListagemCard.vue";
import AppAlert from "@/components/AppAlert.vue";
import { employeeDayOffsApi } from "@/api/resources";
import type { EmployeeDayOffRecord } from "@/types/api";
import { useListPageState } from "@/composables/useListPageState";

const loading = ref(false);
const error = ref("");
const rows = ref<EmployeeDayOffRecord[]>([]);
const { pagination, orderBy, orderDir, resultLabel, setPerPage, setSort } = useListPageState({
  perPage: 15,
  orderBy: "day_off_date",
  orderDir: "desc",
});

const columns: ListagemColumn[] = [
  { key: "day_off_date", label: "Data da folga", sortable: true, align: "start" },
  { key: "approved_by_user", label: "Aprovado por", sortable: false, align: "start" },
  { key: "notes", label: "Observações", sortable: false, align: "start" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = String(value).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return value;
  return `${day}/${m}/${y}`;
}

async function loadList(page = 1) {
  loading.value = true;
  error.value = "";
  try {
    const res = await employeeDayOffsApi.list({
      page,
      per_page: pagination.value.per_page,
      order_by: orderBy.value,
      order_dir: orderDir.value,
    });
    const pag = res.employeeDayOffs;
    rows.value = pag?.data ?? [];
    pagination.value = {
      current_page: pag?.current_page ?? 1,
      per_page: pag?.per_page ?? pagination.value.per_page,
      total: pag?.total ?? 0,
      last_page: pag?.last_page ?? 1,
    };
  } catch {
    error.value = "Não foi possível carregar suas folgas aprovadas.";
    rows.value = [];
    pagination.value = { current_page: 1, per_page: pagination.value.per_page, total: 0, last_page: 1 };
  } finally {
    loading.value = false;
  }
}

function onPerPageChange(value: number) {
  setPerPage(value);
  loadList(1);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  setSort({ orderBy: ob, orderDir: od });
  loadList(1);
}

onMounted(() => {
  loadList();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="mb-4">
        <h1 class="h4 mb-1">Minhas folgas</h1>
        <p class="text-muted small mb-0">Folgas aprovadas vinculadas ao seu cadastro.</p>
      </div>

      <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

      <ListagemCard
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="false"
        :empty-message="'Nenhuma folga aprovada encontrada.'"
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ formatDate((item as EmployeeDayOffRecord).day_off_date) }}</b-td>
            <b-td>{{ (item as EmployeeDayOffRecord).approved_by_user?.name || "—" }}</b-td>
            <b-td>{{ (item as EmployeeDayOffRecord).notes || "—" }}</b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>
  </DefaultLayout>
</template>
