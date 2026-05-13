import { useAuthStore } from "@/stores/auth";
import { computed } from "vue";

/**
 * Composable para verificar roles e permissões na UI.
 * Delega no auth store: hasRole, hasPermission, can.
 */
export function usePermissions() {
  const auth = useAuthStore();
  return {
    hasRole: auth.hasRole,
    hasPermission: auth.hasPermission,
    can: auth.can,
  };
}

type CrudAction = "index" | "read" | "create" | "update" | "delete" | "plucks";

/**
 * Padroniza verificações de permissão por módulo.
 * Ex.: useModulePermissions("branches") -> canRead/canCreate/canUpdate/canDelete/canPlucks.
 */
export function useModulePermissions(moduleSlug: string) {
  const auth = useAuthStore();
  const has = (action: CrudAction) => auth.hasPermission(`${moduleSlug}.${action}`);

  const canList = computed(() => has("index"));
  const canRead = computed(() => has("read"));
  const canCreate = computed(() => has("create"));
  const canUpdate = computed(() => has("update"));
  const canDelete = computed(() => has("delete"));
  const canPlucks = computed(() => has("plucks"));

  return {
    has,
    canList,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canPlucks,
  };
}
