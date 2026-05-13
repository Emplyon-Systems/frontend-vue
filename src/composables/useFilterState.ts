import { computed, ref } from "vue";

/**
 * Estado padrão de filtros para páginas de listagem.
 * Mantém `filters` (edição), `appliedFilters` (consulta) e helpers de apply/reset.
 */
export function useFilterState<T>(initialFactory: () => T, hasActivePredicate: (filters: T) => boolean) {
  const filters = ref<T>(initialFactory());
  const appliedFilters = ref<T>(initialFactory());

  const hasActiveFilters = computed(() => hasActivePredicate(appliedFilters.value));

  function applyFilters() {
    appliedFilters.value = { ...filters.value };
  }

  function resetFilters() {
    const next = initialFactory();
    filters.value = next;
    appliedFilters.value = next;
  }

  return {
    filters,
    appliedFilters,
    hasActiveFilters,
    applyFilters,
    resetFilters,
  };
}
