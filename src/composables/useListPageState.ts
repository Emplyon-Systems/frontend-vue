import { computed, ref } from "vue";

export type SortDir = "asc" | "desc";

export type PaginationState = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/**
 * Estado base reutilizável para páginas com listagem/paginação.
 */
export function useListPageState(defaults?: { perPage?: number; orderBy?: string; orderDir?: SortDir }) {
  const perPage = defaults?.perPage ?? 15;
  const orderBy = ref(defaults?.orderBy ?? "id");
  const orderDir = ref<SortDir>(defaults?.orderDir ?? "desc");
  const pagination = ref<PaginationState>({
    current_page: 1,
    per_page: perPage,
    total: 0,
    last_page: 1,
  });

  const resultLabel = computed(() => {
    const n = pagination.value.total;
    if (n === 0) return "Nenhum resultado";
    if (n === 1) return "1 resultado encontrado";
    return `${n} resultados encontrados`;
  });

  function setPerPage(value: number) {
    pagination.value.per_page = value;
  }

  function setSort(next: { orderBy: string; orderDir: SortDir }) {
    orderBy.value = next.orderBy;
    orderDir.value = next.orderDir;
  }

  return {
    pagination,
    orderBy,
    orderDir,
    resultLabel,
    setPerPage,
    setSort,
  };
}
