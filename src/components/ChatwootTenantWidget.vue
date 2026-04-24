<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import type { User } from "@/types/auth";
import type { AuthContext } from "@/stores/auth";
import {
  chatwootApplyTenantSession,
  chatwootReset,
  chatwootSetBubbleVisible,
  isChatwootConfigured,
} from "@/lib/chatwoot";

const route = useRoute();
const auth = useAuthStore();
const { user, activeContext, isAuthenticated } = storeToRefs(auth);

/** Painéis com contexto empresa / filial (Website inbox no Chatwoot). */
function isTenantPanelRoute(path: string, name: unknown): boolean {
  const n = String(name ?? "");
  if (
    n.startsWith("company.") ||
    n.startsWith("branch.") ||
    n.startsWith("panels.company.") ||
    n.startsWith("panels.branch.")
  ) {
    return true;
  }
  // Fallback por URL (ex.: novas rotas com nome fora do padrão)
  if (path === "/company" || path.startsWith("/company/")) return true;
  if (path === "/branch" || path.startsWith("/branch/")) return true;
  return false;
}

function resolveBranchIdForSupport(
  routeName: string,
  params: Record<string, string | string[]>,
  ctx: AuthContext | null,
  u: User | null
): number {
  if (routeName.startsWith("company.branch.")) {
    const id = Number(params.id ?? 0);
    if (Number.isFinite(id) && id > 0) return id;
  }
  const fromCtx = Number(ctx?.branch_id ?? 0);
  if (fromCtx > 0) return fromCtx;
  if (routeName.startsWith("branch.") || routeName.startsWith("panels.branch.")) {
    const fb = Number(u?.branches?.[0]?.id ?? 0);
    if (Number.isFinite(fb) && fb > 0) return fb;
  }
  return 0;
}

function resolveCompanyIdForSupport(
  routeName: string,
  branchId: number,
  ctx: AuthContext | null,
  u: User | null
): number {
  let companyId = Number(ctx?.company_id ?? 0);
  if (companyId > 0) return companyId;
  if (branchId > 0 && u?.branches?.length) {
    const br = u.branches.find((b) => Number(b.id) === branchId);
    const fromBranch = Number(br?.company_id ?? br?.company?.id ?? 0);
    if (fromBranch > 0) return fromBranch;
  }
  if ((routeName.startsWith("company.") || routeName.startsWith("panels.company.")) && u?.companies?.[0]?.id) {
    return Number(u.companies[0].id);
  }
  return 0;
}

const tenantPayload = computed(() => {
  if (!isAuthenticated.value || !user.value || !isTenantPanelRoute(route.path, route.name)) return null;
  const routeName = String(route.name ?? "");
  const params = route.params as Record<string, string | string[]>;
  const u = user.value;
  const ctx = activeContext.value;
  const branchId = resolveBranchIdForSupport(routeName, params, ctx, u);
  const companyId = resolveCompanyIdForSupport(routeName, branchId, ctx, u);

  const companyName = (ctx?.company_name ?? "").trim();
  const branchName = (ctx?.branch_name ?? "").trim();
  const contexto = branchId > 0 ? "filial" : "empresa";

  return {
    user: { id: u.id, email: u.email, name: u.name },
    customAttributes: {
      empresa_id: companyId,
      filial_id: branchId > 0 ? branchId : 0,
      empresa_nome: companyName || `Empresa #${companyId}`,
      filial_nome: branchId > 0 ? branchName || `Filial #${branchId}` : "",
      contexto_painel: contexto,
      rota: routeName,
    } satisfies Record<string, string | number | boolean>,
  };
});

watch(
  () => ({
    configured: isChatwootConfigured(),
    payload: tenantPayload.value,
    authed: isAuthenticated.value,
    path: route.fullPath,
    routeName: route.name,
  }),
  async ({ configured, payload, authed }) => {
    if (!configured) return;

    if (!authed) {
      chatwootSetBubbleVisible(false);
      chatwootReset();
      return;
    }

    if (!payload) {
      chatwootSetBubbleVisible(false);
      return;
    }

    await chatwootApplyTenantSession({
      user: payload.user,
      customAttributes: payload.customAttributes,
    });
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <!-- Widget do Chatwoot é injectado no DOM pelo SDK; este ficheiro só sincroniza estado. -->
</template>
