<script setup lang="ts">
import UIComponentCard from "@/components/UIComponentCard.vue";

export interface ListagemColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "start" | "end" | "center";
}

const props = withDefaults(
  defineProps<{
    columns: ListagemColumn[];
    data: unknown[];
    loading: boolean;
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
    perPageOptions?: number[];
    orderBy?: string;
    orderDir?: "asc" | "desc";
    resultLabel: string;
    hasActiveFilters?: boolean;
    emptyMessage?: string;
    resultBadgeClass?: string;
  }>(),
  {
    perPageOptions: () => [10, 25, 50, 100],
    orderBy: "id",
    orderDir: "desc",
    hasActiveFilters: false,
    emptyMessage: "Nenhum registo encontrado.",
    resultBadgeClass: "result-badge-default",
  }
);

const emit = defineEmits<{
  (e: "update:perPage", value: number): void;
  (e: "update:sort", value: { orderBy: string; orderDir: "asc" | "desc" }): void;
  (e: "update:page", page: number): void;
}>();

function setPerPage(value: number) {
  emit("update:perPage", value);
}

function toggleSort(columnKey: string) {
  if (!props.columns.find((c) => c.key === columnKey)?.sortable) return;
  const nextDir =
    props.orderBy === columnKey && props.orderDir === "desc" ? "asc" : "desc";
  emit("update:sort", { orderBy: columnKey, orderDir: nextDir });
}

function thClass(col: ListagemColumn) {
  const align = col.align === "end" ? "text-end" : col.align === "center" ? "text-center" : "";
  return [align].filter(Boolean).join(" ");
}
</script>

<template>
  <b-card no-body>
    <b-card-header class="py-2">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 w-100">
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Mostrar</span>
          <b-form-select
            :model-value="pagination.per_page"
            :options="perPageOptions.map((n) => ({ value: n, text: String(n) }))"
            size="sm"
            class="form-select-sm d-inline-block w-auto"
            @update:model-value="setPerPage"
          />
          <span class="text-muted small">por página</span>
        </div>
        <span class="d-flex align-items-center gap-2">
          <b-badge pill :class="resultBadgeClass">{{ resultLabel }}</b-badge>
          <b-badge v-if="hasActiveFilters" variant="primary" pill>Ativo</b-badge>
        </span>
      </div>
    </b-card-header>
    <b-card-body class="pt-0">
      <div v-if="loading" class="text-center py-4 text-muted">A carregar...</div>
      <div v-else class="table-responsive">
        <b-table-simple responsive striped hover class="mb-0">
          <b-thead>
            <b-tr>
              <b-th
                v-for="col in columns"
                :key="col.key"
                :class="thClass(col)"
                class="listagem-th"
              >
                <template v-if="col.sortable">
                  <a
                    href="#"
                    class="text-decoration-none text-dark d-inline-flex align-items-center gap-1"
                    @click.prevent="toggleSort(col.key)"
                  >
                    {{ col.label }}
                    <span v-if="orderBy === col.key" class="sort-icon" aria-hidden="true">
                      <!-- Iconoir: arrow-up (asc) / arrow-down (desc) -->
                      <svg v-if="orderDir === 'asc'" class="sort-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21L12 3M12 3L20.5 11.5M12 3L3.5 11.5" />
                      </svg>
                      <svg v-else class="sort-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3L12 21M12 21L20.5 12.5M12 21L3.5 12.5" />
                      </svg>
                    </span>
                    <span v-else class="sort-icon text-muted opacity-50" aria-hidden="true">
                      <!-- Iconoir: sort (up-down / não ordenado) -->
                      <svg class="sort-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 14H2" /><path d="M8 10H2" /><path d="M6 6H2" /><path d="M12 18H2" /><path d="M19 20V4M19 20L22 17M19 20L16 17M19 4L22 7M19 4L16 7" />
                      </svg>
                    </span>
                  </a>
                </template>
                <template v-else>
                  {{ col.label }}
                </template>
              </b-th>
            </b-tr>
          </b-thead>
          <b-tbody>
            <template v-for="(item, index) in data" :key="(item as { id?: number })?.id ?? index">
              <slot name="row" :item="item" :index="index"></slot>
            </template>
            <b-tr v-if="!data.length">
              <b-td :colspan="columns.length" class="text-center text-muted py-4">
                {{ emptyMessage }}
              </b-td>
            </b-tr>
          </b-tbody>
        </b-table-simple>
      </div>

      <b-row v-if="pagination.last_page > 1" class="align-items-center mt-3">
        <b-col>
          <small class="text-muted">
            A mostrar {{ (pagination.current_page - 1) * pagination.per_page + 1 }}–
            {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}
            de {{ pagination.total }}
          </small>
        </b-col>
        <b-col class="d-flex justify-content-end">
          <b-pagination
            :model-value="pagination.current_page"
            :total-rows="pagination.total"
            :per-page="pagination.per_page"
            size="sm"
            @update:model-value="(p: number) => emit('update:page', p)"
          />
        </b-col>
      </b-row>
    </b-card-body>
  </b-card>
</template>

<style scoped>
.listagem-th {
  white-space: nowrap;
}
.sort-icon {
  display: inline-flex;
  align-items: center;
}

.sort-icon-svg {
  width: 0.9rem;
  height: 0.9rem;
  color: currentColor;
}
.result-badge-default {
  background-color: coral;
  color: #fff;
}
</style>
