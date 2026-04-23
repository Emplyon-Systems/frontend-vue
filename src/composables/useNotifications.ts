import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { employeeLeaveRequestsApi } from "@/api/resources";
import { getNotificationReadStorageKey, loadNotificationReadIdsFromStorage, saveNotificationReadIdsToStorage } from "@/helpers/notificationReadState";
import { mapPendingLeaveToNotification, mapResponseLeaveToNotification } from "@/composables/notificationMappers";
import { useAuthStore } from "@/stores/auth";
import type { EmployeeLeaveRequestRecord } from "@/types/api";
import type { AppNotificationItem } from "@/types/notificationInbox";

export type { AppNotificationItem } from "@/types/notificationInbox";

type NotificationProviderResult = {
  total: number;
  items: AppNotificationItem[];
  openAllRouteName?: string;
};

type NotificationProvider = {
  key: string;
  enabled: () => boolean;
  fetch: (limit: number) => Promise<NotificationProviderResult>;
};

const POLL_INTERVAL_MS = 15000;
const NOTIFICATION_SOUND_URL = "/sounds/mixkit-software-interface-start-2574.wav";

export function useNotifications() {
  const authStore = useAuthStore();
  const route = useRoute();
  const router = useRouter();

  const items = ref<AppNotificationItem[]>([]);
  const total = ref(0);
  const openAllRouteName = ref<string>("");
  const loading = ref(false);
  const readIds = ref<string[]>([]);
  const hasInitialized = ref(false);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  /** Rota de contexto: folgas pendentes (filial) vs respostas (colaborador). */
  const leaveRequestsRouteName = computed(() => {
    const path = route.path;
    if (path.startsWith("/branch")) return "branch.leave-requests";
    if (path.startsWith("/employee")) return "employee.leave-requests";
    return "";
  });

  const readStorageKey = computed(() => getNotificationReadStorageKey(Number(authStore.user?.id ?? 0)));

  function loadReadIdsFromStorage() {
    readIds.value = loadNotificationReadIdsFromStorage(readStorageKey.value);
  }

  function saveReadIdsToStorage() {
    saveNotificationReadIdsToStorage(readStorageKey.value, readIds.value);
  }

  const unreadItems = computed(() => items.value.filter((item) => !readIds.value.includes(item.id)));
  const readItems = computed(() => items.value.filter((item) => readIds.value.includes(item.id)));
  const unreadCount = computed(() => unreadItems.value.length);

  const providers: NotificationProvider[] = [
    {
      key: "leave_requests",
      enabled: () => {
        const r = leaveRequestsRouteName.value;
        const canApprove =
          authStore.hasPermission("employee_leave_requests.approve_sector") ||
          authStore.hasPermission("employee_leave_requests.approve_branch");
        return r === "branch.leave-requests" && canApprove;
      },
      fetch: async (limit: number) => {
        if (leaveRequestsRouteName.value !== "branch.leave-requests") {
          return { total: 0, items: [] };
        }
        const branchId = Number(authStore.activeContext?.branch_id ?? 0);
        const res = await employeeLeaveRequestsApi.list({
          status: "pending",
          branch_id: branchId || undefined,
          order_by: "request_date",
          order_dir: "desc",
          per_page: limit,
          page: 1,
        });
        const data = (res.employeeLeaveRequests?.data ?? []) as EmployeeLeaveRequestRecord[];
        return {
          total: Number(res.employeeLeaveRequests?.total ?? 0),
          items: data.map((row) => mapPendingLeaveToNotification(row)),
          openAllRouteName: "branch.notifications",
        };
      },
    },
    {
      key: "leave_request_responses",
      enabled: () => {
        if (leaveRequestsRouteName.value !== "employee.leave-requests") return false;
        return (
          authStore.hasPermission("employee_leave_requests.read") ||
          authStore.hasPermission("employee_leave_requests.index")
        );
      },
      fetch: async (limit: number) => {
        if (leaveRequestsRouteName.value !== "employee.leave-requests") {
          return { total: 0, items: [] };
        }
        const userId = Number(authStore.user?.id ?? 0);
        if (!userId) {
          return { total: 0, items: [] };
        }
        const res = await employeeLeaveRequestsApi.list({
          requested_by_user_id: userId,
          statuses: ["approved", "rejected"],
          order_by: "reviewed_at",
          order_dir: "desc",
          per_page: limit,
          page: 1,
        });
        const data = (res.employeeLeaveRequests?.data ?? []) as EmployeeLeaveRequestRecord[];
        return {
          total: Number(res.employeeLeaveRequests?.total ?? 0),
          items: data.map((row) => mapResponseLeaveToNotification(row)),
          openAllRouteName: "employee.notifications",
        };
      },
    },
  ];

  async function loadNotifications(limit = 5) {
    const previousUnreadCount = unreadCount.value;
    loading.value = true;
    try {
      const enabledProviders = providers.filter((provider) => provider.enabled());
      if (!enabledProviders.length) {
        items.value = [];
        total.value = 0;
        openAllRouteName.value = "";
        return;
      }

      const results = await Promise.all(enabledProviders.map((provider) => provider.fetch(limit)));
      items.value = results.flatMap((result) => result.items).slice(0, limit);
      total.value = results.reduce((acc, result) => acc + result.total, 0);
      openAllRouteName.value = results.find((result) => !!result.openAllRouteName)?.openAllRouteName || "";

      const nextUnreadCount = items.value.filter((item) => !readIds.value.includes(item.id)).length;
      if (hasInitialized.value && nextUnreadCount > previousUnreadCount) {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.volume = 0.8;
        audio.play().catch(() => {
          // Alguns browsers bloqueiam autoplay sem interação do usuário.
        });
      }
    } catch {
      items.value = [];
      total.value = 0;
      openAllRouteName.value = "";
    } finally {
      loading.value = false;
      hasInitialized.value = true;
    }
  }

  function openNotification(item: AppNotificationItem) {
    if (!readIds.value.includes(item.id)) {
      readIds.value = [...readIds.value, item.id];
      saveReadIdsToStorage();
    }
    if (!item.routeName) return;
    router.push({ name: item.routeName });
  }

  function openAllNotifications() {
    if (!openAllRouteName.value) return;
    router.push({ name: openAllRouteName.value });
  }

  function markAllAsRead() {
    const unreadIds = unreadItems.value.map((item) => item.id);
    if (!unreadIds.length) return;
    readIds.value = Array.from(new Set([...readIds.value, ...unreadIds]));
    saveReadIdsToStorage();
  }

  watch(
    () => authStore.user?.id,
    () => {
      loadReadIdsFromStorage();
      loadNotifications();
    },
    { immediate: true }
  );

  watch(
    () => [authStore.activeContext?.company_id, authStore.activeContext?.branch_id],
    () => {
      loadNotifications();
    }
  );

  watch(
    () => route.path,
    () => {
      loadNotifications();
    }
  );

  onMounted(() => {
    loadNotifications();
    pollTimer = setInterval(() => {
      loadNotifications();
    }, POLL_INTERVAL_MS);
  });

  onBeforeUnmount(() => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  });

  return {
    items,
    unreadItems,
    readItems,
    total,
    unreadCount,
    loading,
    loadNotifications,
    openNotification,
    openAllNotifications,
    markAllAsRead,
  };
}
