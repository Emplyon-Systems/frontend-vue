<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import { dayOffModalitiesApi } from "@/api/resources";
import type { DayOffModalityRecord } from "@/types/api";
import { usePanelScope } from "@/composables/usePanelScope";
import { useListPageState } from "@/composables/useListPageState";

const router = useRouter();
const { isOwnerWorkspace, isCompanyScoped, isBranchScoped } = usePanelScope();
const loading = ref(true);
const rows = ref<DayOffModalityRecord[]>([]);
const { pagination, orderBy, orderDir, resultLabel, setPerPage, setSort } = useListPageState({
  perPage: 15,
  orderBy: "id",
  orderDir: "desc",
});

const listagemColumns = [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "slug", label: "Slug", sortable: true, align: "start" as const },
  { key: "is_default", label: "Padrão", sortable: false, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
];

function routeNameFor(op: "create" | "view" | "edit") {
  if (isBranchScoped.value) return `branch.day-off-modalities.${op}`;
  if (isCompanyScoped.value) return `company.day-off-modalities.${op}`;
  return `owner.day-off-modalities.${op}`;
}

function loadList(page = 1) {
  loading.value = true;
  dayOffModalitiesApi
    .list({
      page,
      per_page: pagination.value.per_page,
      order_by: orderBy.value,
      order_dir: orderDir.value,
    })
    .then((data) => {
      rows.value = data.dayOffModalities?.data ?? [];
      pagination.value = {
        current_page: data.dayOffModalities?.current_page ?? 1,
        per_page: data.dayOffModalities?.per_page ?? 15,
        total: data.dayOffModalities?.total ?? 0,
        last_page: data.dayOffModalities?.last_page ?? 1,
      };
    })
    .finally(() => {
      loading.value = false;
    });
}

function goCreate() {
  router.push({ name: routeNameFor("create") });
}

function goView(id: number) {
  router.push({ name: routeNameFor("view"), params: { id: String(id) } });
}

function goEdit(id: number) {
  router.push({ name: routeNameFor("edit"), params: { id: String(id) } });
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
  <component :is="isOwnerWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Modalidades de folga</h1>
          <p class="text-muted mb-0 small">Listar e gerir modalidades de folga por filial.</p>
        </div>
        <b-button variant="primary" @click="goCreate">
          <i class="iconoir-plus me-1"></i>
          Nova modalidade
        </b-button>
      </div>

      <ListagemCard
        :columns="listagemColumns"
        :data="rows"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="false"
        empty-message="Nenhuma modalidade de folga encontrada."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as DayOffModalityRecord).id }}</b-td>
            <b-td>{{ (item as DayOffModalityRecord).name }}</b-td>
            <b-td><code>{{ (item as DayOffModalityRecord).slug }}</code></b-td>
            <b-td>
              <b-badge :variant="(item as DayOffModalityRecord).is_default ? 'success' : 'secondary'">
                {{ (item as DayOffModalityRecord).is_default ? "Sim" : "Não" }}
              </b-badge>
            </b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as DayOffModalityRecord).id"
                :show-view="true"
                :show-edit="true"
                :show-delete="false"
                view-title="Visualizar"
                edit-title="Editar"
                @view="goView"
                @edit="goEdit"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>
  </component>
</template>
