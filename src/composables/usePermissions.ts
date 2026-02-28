import { useAuthStore } from "@/stores/auth";

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
