<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import simplebar from "simplebar-vue";
import { getMenuItemsForUser } from "@/helpers/menu";
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
        <div class="d-flex align-items-start flex-column w-100">
          <AppMenu :menu-items="menuItems" />
        </div>
      </simplebar>
    </div>
  </div>
  <div class="startbar-overlay d-print-none"></div>
</template>
