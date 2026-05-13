<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import simplebar from "simplebar-vue";
import { getMenuItemsForUser } from "@/helpers/menu";
import { getPanelHomeForUser } from "@/config/panels";
import { useAuthStore } from "@/stores/auth";
import { employeeLeaveRequestsApi } from "@/api/resources";
import type { MenuItemType } from "@/types/menu";
import LogoBox from "@/components/LogoBox.vue";

const authStore = useAuthStore();
const pendingLeaveRequests = ref(0);
const canApproveLeaveRequests = computed(
  () =>
    authStore.hasPermission("employee_leave_requests.approve_sector") ||
    authStore.hasPermission("employee_leave_requests.approve_branch")
);

async function loadPendingLeaveRequestsCount() {
  const branchId = Number(authStore.activeContext?.branch_id ?? 0);

  if (!canApproveLeaveRequests.value || !branchId) {
    pendingLeaveRequests.value = 0;
    return;
  }

  try {
    const res = await employeeLeaveRequestsApi.list({
      status: "pending",
      branch_id: branchId || undefined,
      per_page: 1,
    });
    pendingLeaveRequests.value = Number(res.employeeLeaveRequests?.total ?? 0);
  } catch {
    pendingLeaveRequests.value = 0;
  }
}

function withLeaveRequestBadge(items: MenuItemType[]): MenuItemType[] {
  return items.map((item) => {
    const children = item.children ? withLeaveRequestBadge(item.children) : undefined;
    const isBranchLeaveRequestItem = item.key === "branch-leave-requests";
    const badge = isBranchLeaveRequestItem && canApproveLeaveRequests.value && pendingLeaveRequests.value > 0
      ? { variant: "warning", text: String(pendingLeaveRequests.value) }
      : undefined;

    return {
      ...item,
      ...(children ? { children } : {}),
      ...(badge ? { badge } : {}),
    };
  });
}

const menuItems = computed(() => {
  const base = getMenuItemsForUser(authStore.user ?? undefined, authStore.activeContext);
  return withLeaveRequestBadge(base);
});

/** CTA de tutoriais para painéis de visualização (empresa, filial, colaborador). */
const tutorialsHelpRoute = computed<{ name: string } | null>(() => {
  const user = authStore.user;
  if (!user) return null;
  const isOwner = (user.roles ?? []).some((r) => r.slug === "superadmin");
  if (isOwner) return null;
  const canView =
    authStore.hasPermission("tutorials.index") ||
    authStore.hasPermission("tutorials.read");
  if (!canView) return null;
  const path = getPanelHomeForUser(user, authStore.activeContext);
  if (path === "/branch") return { name: "branch.tutorials" };
  if (path === "/company") return { name: "company.tutorials" };
  if (path === "/employee") return { name: "employee.tutorials" };
  return null;
});

watch(
  () => [authStore.activeContext?.branch_id, authStore.user?.id],
  () => {
    loadPendingLeaveRequestsCount();
  },
  { immediate: true }
);

onMounted(() => {
  loadPendingLeaveRequestsCount();
});
</script>

<template>
  <div class="startbar d-print-none" id="startbar">
    <div class="brand">
      <LogoBox />
    </div>
    <div class="startbar-menu">
      <simplebar class="startbar-collapse" id="startbarCollapse" data-simplebar>
        <div class="startbar-inner d-flex align-items-stretch flex-column w-100">
          <AppMenu :menu-items="menuItems" />
          <router-link
            v-if="tutorialsHelpRoute"
            :to="tutorialsHelpRoute"
            class="sidebar-help-card mt-auto"
            aria-label="Tutoriais de uso do sistema"
            title="Tutoriais de uso do sistema"
          >
            <span class="sidebar-help-card-icon" aria-hidden="true">
              <i class="iconoir-play"></i>
            </span>
            <span class="sidebar-help-card-body">
              <span class="sidebar-help-card-title">Precisa de ajuda?</span>
              <span class="sidebar-help-card-text">
                Veja nossos tutoriais de uso do sistema.
              </span>
            </span>
          </router-link>
        </div>
      </simplebar>
    </div>
  </div>
  <div class="startbar-overlay d-print-none"></div>
</template>
