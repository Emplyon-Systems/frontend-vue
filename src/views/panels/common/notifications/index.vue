<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ListagemCard, { type ListagemColumn } from "@/components/ListagemCard.vue";
import { employeeLeaveRequestsApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";
import { useNotificationReadState } from "@/composables/useNotificationReadState";
import { mapPendingLeaveToNotification, mapResponseLeaveToNotification } from "@/composables/notificationMappers";
import { useListPageState } from "@/composables/useListPageState";
import type { EmployeeLeaveRequestRecord } from "@/types/api";
import type { AppNotificationItem } from "@/types/notificationInbox";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isRead, markRead, markAll } = useNotificationReadState();

const feed = computed<"branch" | "employee" | null>(() => {
  if (route.name === "branch.notifications") return "branch";
  if (route.name === "employee.notifications") return "employee";
  return null;
});

const loading = ref(false);
const error = ref("");
const errorDetail = ref("");
const rows = ref<AppNotificationItem[]>([]);

const { pagination: listPagination, orderBy, orderDir, resultLabel, setPerPage, setSort } = useListPageState({
  perPage: 15,
  orderBy: "request_date",
  orderDir: "desc",
});

const title = computed(() => (feed.value === "branch" ? "Solicitações pendentes (filial)" : "Respostas às suas folgas"));
const description = computed(() =>
  feed.value === "branch"
    ? "Novas solicitações de folga pendentes no contexto desta filial (a filial ativa). A mesma origem de dados do sino, para a sua equipe / processo de aprovação."
    : "Aprovações e rejeições das suas solicitações de folga, apenas as associadas ao seu utilizador."
);

const canViewBranchFeed = computed(
  () =>
    authStore.hasPermission("employee_leave_requests.index") ||
    authStore.hasPermission("employee_leave_requests.read")
);

const orderFieldForQuery = computed(() => {
  if (feed.value === "employee") return "reviewed_at";
  if (orderBy.value === "request_date" || orderBy.value === "status") {
    return orderBy.value;
  }
  return "request_date";
});

const columns = computed((): ListagemColumn[] => [
  { key: "request_date", label: "Data", sortable: feed.value === "branch", align: "start" },
  { key: "title", label: "Título", sortable: false, align: "start" },
  { key: "message", label: "Mensagem", sortable: false, align: "start" },
  { key: "read", label: "Estado", sortable: false, align: "start" },
  { key: "actions", label: "Ações", sortable: false, align: "end" },
]);

const pagination = computed(() => ({
  current_page: listPagination.value.current_page,
  per_page: listPagination.value.per_page,
  total: listPagination.value.total,
  last_page: Math.max(1, listPagination.value.last_page),
}));

async function loadList(page = 1) {
  if (!feed.value) return;
  loading.value = true;
  error.value = "";
  errorDetail.value = "";
  try {
    if (feed.value === "branch" && !canViewBranchFeed.value) {
      rows.value = [];
      listPagination.value = {
        current_page: 1,
        per_page: listPagination.value.per_page,
        total: 0,
        last_page: 1,
      };
      return;
    }
    if (feed.value === "branch") {
      const branchId = Number(authStore.activeContext?.branch_id ?? 0);
      const res = await employeeLeaveRequestsApi.list({
        status: "pending",
        branch_id: branchId || undefined,
        order_by: orderFieldForQuery.value as "request_date" | "status",
        order_dir: orderDir.value,
        per_page: listPagination.value.per_page,
        page,
      });
      const pag = res.employeeLeaveRequests;
      const data = (pag?.data ?? []) as EmployeeLeaveRequestRecord[];
      rows.value = data.map((r) => mapPendingLeaveToNotification(r));
      listPagination.value = {
        current_page: pag?.current_page ?? 1,
        per_page: pag?.per_page ?? listPagination.value.per_page,
        total: pag?.total ?? 0,
        last_page: pag?.last_page ?? 1,
      };
    } else {
      const userId = Number(authStore.user?.id ?? 0);
      if (!userId) {
        throw new Error("Sessão inválida.");
      }
      const res = await employeeLeaveRequestsApi.list({
        requested_by_user_id: userId,
        statuses: ["approved", "rejected"],
        order_by: orderFieldForQuery.value,
        order_dir: orderDir.value,
        per_page: listPagination.value.per_page,
        page,
      });
      const pag = res.employeeLeaveRequests;
      const data = (pag?.data ?? []) as EmployeeLeaveRequestRecord[];
      rows.value = data.map((r) => mapResponseLeaveToNotification(r));
      listPagination.value = {
        current_page: pag?.current_page ?? 1,
        per_page: pag?.per_page ?? listPagination.value.per_page,
        total: pag?.total ?? 0,
        last_page: pag?.last_page ?? 1,
      };
    }
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "response" in e
      ? (e as { response?: { data?: { message?: string; msg?: string } } }).response?.data?.message ??
        (e as { response?: { data?: { msg?: string } } }).response?.data?.msg
      : e instanceof Error ? e.message : undefined;
    error.value = "Não foi possível carregar as notificações.";
    errorDetail.value = msg ? String(msg) : "";
    rows.value = [];
    listPagination.value = {
      current_page: 1,
      per_page: listPagination.value.per_page,
      total: 0,
      last_page: 1,
    };
  } finally {
    loading.value = false;
  }
}

function goToDetail(item: AppNotificationItem) {
  markRead(item.id);
  if (item.routeName) {
    router.push({ name: item.routeName });
  }
}

function markPageAsRead() {
  markAll(rows.value.map((r) => r.id));
}

onMounted(() => {
  if (feed.value === "branch") {
    setSort({ orderBy: "request_date", orderDir: "desc" });
  }
  loadList(1);
});

watch(
  () => route.name,
  () => {
    if (feed.value) loadList(1);
  }
);

watch(
  () => [authStore.activeContext?.branch_id, authStore.user?.id],
  () => {
    if (feed.value) loadList(1);
  }
);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h1 class="h4 mb-1">Notificações</h1>
          <p class="text-muted small mb-0">Lista completa, com paginação. Só o que aplica a si; em filial, só a filial ativa.</p>
        </div>
        <b-button
          v-if="rows.length && (feed === 'branch' || feed === 'employee')"
          variant="outline-secondary"
          size="sm"
          @click="markPageAsRead"
        >
          Marcar página como lida
        </b-button>
      </div>

      <p class="text-muted small mb-3 mb-md-2">{{ description }}</p>
      <p v-if="feed" class="small text-body-secondary mb-3">
        <strong>Secção:</strong> {{ title }}.
        <span v-if="feed === 'branch' && !canViewBranchFeed" class="text-warning">
          Não tem permissão para listar solicitações de folga.
        </span>
      </p>

      <AppAlert
        v-if="error"
        variant="danger"
        class="mb-3"
        dismissible
        @dismissed="() => { error = ''; errorDetail = ''; }"
      >
        <span>{{ error }} {{ errorDetail ? `— ${errorDetail}` : "" }}</span>
      </AppAlert>

      <ListagemCard
        v-if="feed"
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="false"
        :empty-message="feed === 'branch' && !canViewBranchFeed ? 'Sem permissão para ver esta lista.' : 'Não há notificações para mostrar.'"
        result-badge-class="result-badge-default"
        @update:per-page="(n) => { setPerPage(n); loadList(1); }"
        @update:page="(p) => loadList(p)"
        @update:sort="(s) => { if (feed === 'branch') { setSort(s); loadList(1); } }"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as AppNotificationItem).dateLabel || "—" }}</b-td>
            <b-td class="text-nowrap">{{ (item as AppNotificationItem).title }}</b-td>
            <b-td>
              <span
                class="d-inline-block text-truncate notif-message-cell"
                :title="(item as AppNotificationItem).message"
              >{{ (item as AppNotificationItem).message }}</span>
            </b-td>
            <b-td>
              <b-badge :variant="isRead((item as AppNotificationItem).id) ? 'secondary' : 'warning'">
                {{ isRead((item as AppNotificationItem).id) ? "Lida" : "Não lida" }}
              </b-badge>
            </b-td>
            <b-td class="text-end text-nowrap">
              <b-button
                size="sm"
                variant="outline-primary"
                class="me-1"
                @click="goToDetail(item as AppNotificationItem)"
              >
                Ir
              </b-button>
              <b-button
                v-if="!isRead((item as AppNotificationItem).id)"
                size="sm"
                variant="outline-secondary"
                @click="markRead((item as AppNotificationItem).id)"
              >
                Lida
              </b-button>
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>
  </DefaultLayout>
</template>

<style scoped>
.notif-message-cell {
  max-width: min(42vw, 28rem);
  vertical-align: middle;
}
</style>
