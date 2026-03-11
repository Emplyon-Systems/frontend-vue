<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import FilterTriggerButton from "@/components/filters/FilterTriggerButton.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import AuditsFilter from "@/views/panels/owner/audits/Filter.vue";
import { auditsApi } from "@/api/resources";
import type { AuditRecord } from "@/types/api";

const router = useRouter();
const loading = ref(true);
const audits = ref<AuditRecord[]>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const initialFilters = () => ({
  event: "",
  auditable_type: "",
  created_at_from: "",
  created_at_until: "",
});
const filters = ref(initialFilters());
/** Filtros efetivamente aplicados (atualizados ao clicar em "Aplicar filtros") */
const appliedFilters = ref(initialFilters());
const orderBy = ref("created_at");
const orderDir = ref<"asc" | "desc">("desc");
const showFilters = ref(false);
const hasActiveFilters = computed(
  () =>
    !!appliedFilters.value.event.trim() ||
    !!appliedFilters.value.auditable_type.trim() ||
    !!appliedFilters.value.created_at_from ||
    !!appliedFilters.value.created_at_until
);

const listagemColumns = [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "created_at", label: "Data", sortable: true, align: "start" as const },
  { key: "event", label: "Evento", sortable: true, align: "start" as const },
  { key: "auditable_type", label: "Tipo", sortable: true, align: "start" as const },
  { key: "user", label: "Utilizador", sortable: false, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
];

const resultLabel = computed(() => {
  const n = pagination.value.total;
  if (n === 0) return "Nenhum resultado";
  if (n === 1) return "1 resultado encontrado";
  return `${n} resultados encontrados`;
});

function loadList(page = 1) {
  loading.value = true;
  const params: auditsApi.AuditsListParams = {
    page,
    per_page: pagination.value.per_page,
    order_by: orderBy.value,
    order_dir: orderDir.value,
  };
  if (appliedFilters.value.event.trim()) params.event = appliedFilters.value.event.trim();
  if (appliedFilters.value.auditable_type.trim()) params.auditable_type = appliedFilters.value.auditable_type.trim();
  if (appliedFilters.value.created_at_from) params.created_at_from = appliedFilters.value.created_at_from;
  if (appliedFilters.value.created_at_until) params.created_at_until = appliedFilters.value.created_at_until;

  auditsApi
    .list(params)
    .then((data) => {
      audits.value = data.audits?.data ?? [];
      pagination.value = {
        current_page: data.audits?.current_page ?? 1,
        per_page: data.audits?.per_page ?? 15,
        total: data.audits?.total ?? 0,
        last_page: data.audits?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

function applyFilters() {
  appliedFilters.value = { ...filters.value };
  loadList(1);
}

function resetFilters() {
  filters.value = initialFilters();
  appliedFilters.value = initialFilters();
  loadList(1);
}

function onPerPageChange(value: number) {
  pagination.value.per_page = value;
  loadList(1);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  orderBy.value = ob;
  orderDir.value = od;
  loadList(1);
}

function formatDate(value: string | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return value;
  }
}

function goView(id: number) {
  router.push({ name: "owner.audits.show", params: { id: String(id) } });
}

onMounted(() => loadList());
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Auditoria</h1>
          <p class="text-muted mb-0 small">Consultar registos de ações no sistema.</p>
        </div>
        <FilterTriggerButton v-model="showFilters" :active="hasActiveFilters" label="Filtros" />
      </div>

      <UIComponentCard v-if="showFilters" title="Filtros" class="mb-3">
        <AuditsFilter
          v-model="filters"
          @apply="applyFilters"
          @reset="resetFilters"
        />
      </UIComponentCard>

      <ListagemCard
        :columns="listagemColumns"
        :data="audits"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="hasActiveFilters"
        empty-message="Nenhum registo de auditoria."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as AuditRecord).id }}</b-td>
            <b-td>{{ formatDate((item as AuditRecord).created_at) }}</b-td>
            <b-td><b-badge variant="secondary">{{ (item as AuditRecord).event }}</b-badge></b-td>
            <b-td><code class="small">{{ (item as AuditRecord).auditable_type || "—" }}</code></b-td>
            <b-td>
              <span v-if="(item as AuditRecord).user">{{ (item as AuditRecord).user!.name }}</span>
              <span v-else class="text-muted">—</span>
              <span
                v-if="(item as AuditRecord).user?.roles?.length"
                class="d-block small text-muted mt-0"
              >
                <b-badge
                  v-for="r in (item as AuditRecord).user?.roles ?? []"
                  :key="r.id"
                  variant="light"
                  class="text-dark me-1"
                >
                  {{ r.name }}
                </b-badge>
              </span>
            </b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as AuditRecord).id"
                :show-edit="false"
                :show-delete="false"
                view-title="Visualizar detalhes"
                @view="goView"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>
  </DefaultLayout>
</template>
