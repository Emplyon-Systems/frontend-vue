<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ListagemCard, { type ListagemColumn } from "@/components/ListagemCard.vue";
import { employeeLeaveRequestsApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";
import type { EmployeeLeaveRequestRecord } from "@/types/api";
import { notifySuccess } from "@/helpers/notify";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { useListPageState } from "@/composables/useListPageState";
import { usePanelScope } from "@/composables/usePanelScope";

const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { isOwnerWorkspace } = usePanelScope();

const loading = ref(false);
const error = ref("");
const rows = ref<EmployeeLeaveRequestRecord[]>([]);
const reasonModal = ref(false);
const reasonModalText = ref("");
const { pagination: listPagination, orderBy, orderDir, resultLabel, setPerPage, setSort } = useListPageState({
  perPage: 15,
  orderBy: "request_date",
  orderDir: "desc",
});

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = String(value).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return value;
  return `${day}/${m}/${y}`;
}

function statusLabel(status: EmployeeLeaveRequestRecord["status"]) {
  if (status === "approved") return "Aprovada";
  if (status === "rejected") return "Rejeitada";
  if (status === "cancelled") return "Cancelada";
  return "Pendente";
}

function statusVariant(status: EmployeeLeaveRequestRecord["status"]) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "cancelled") return "secondary";
  return "warning";
}

const canDecide = computed(
  () =>
    authStore.hasPermission("employee_leave_requests.approve_sector") ||
    authStore.hasPermission("employee_leave_requests.approve_branch") ||
    authStore.hasPermission("employee_leave_requests.update")
);

const columns = computed(
  (): ListagemColumn[] => [
    { key: "employee", label: "Colaborador", sortable: false, align: "start" },
    { key: "request_date", label: "Data", sortable: false, align: "start" },
    { key: "reason", label: "Motivo", sortable: false, align: "start" },
    { key: "status", label: "Status", sortable: false, align: "start" },
    ...(canDecide.value ? [{ key: "actions", label: "Ações", sortable: false, align: "end" as const }] : []),
  ]
);

const pagination = computed(() => ({
  current_page: listPagination.value.current_page,
  per_page: listPagination.value.per_page,
  total: listPagination.value.total,
  last_page: Math.max(1, listPagination.value.last_page),
}));

async function loadList(page = 1) {
  loading.value = true;
  error.value = "";
  try {
    const res = await employeeLeaveRequestsApi.list({
      branch_id: Number(authStore.activeContext?.branch_id ?? 0) || undefined,
      order_by: orderBy.value,
      order_dir: orderDir.value,
      per_page: listPagination.value.per_page,
      page,
    });
    const pag = res.employeeLeaveRequests;
    rows.value = pag?.data ?? [];
    listPagination.value = {
      current_page: pag?.current_page ?? 1,
      per_page: pag?.per_page ?? listPagination.value.per_page,
      total: pag?.total ?? 0,
      last_page: pag?.last_page ?? 1,
    };
  } catch {
    error.value = "Não foi possível carregar as solicitações de folga.";
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

async function decide(row: EmployeeLeaveRequestRecord, status: "approved" | "rejected") {
  try {
    await employeeLeaveRequestsApi.update(row.id, { status });
    notifySuccess(status === "approved" ? "Solicitação aprovada com sucesso." : "Solicitação rejeitada com sucesso.");
    await loadList(listPagination.value.current_page);
  } catch {
    error.value = "Não foi possível atualizar a solicitação.";
  }
}

function onPerPageChange(n: number) {
  setPerPage(n);
  loadList(1);
}

function onPageChange(p: number) {
  loadList(p);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  setSort({ orderBy: ob, orderDir: od });
  loadList(1);
}

function openReasonModal(reason: string) {
  reasonModalText.value = reason;
  reasonModal.value = true;
}

onMounted(() => {
  loadList();
});
</script>

<template>
  <component :is="isOwnerWorkspace || isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div :class="isOwnerWorkspace ? '' : 'py-4'">
      <div class="mb-4">
        <h1 class="h4 mb-1">Solicitações de folgas</h1>
        <p class="text-muted small mb-0">Solicitações enviadas pelos colaboradores da filial.</p>
      </div>

      <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

      <ListagemCard
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="false"
        :empty-message="'Nenhuma solicitação encontrada.'"
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="onPageChange"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as EmployeeLeaveRequestRecord).employee?.name || "—" }}</b-td>
            <b-td>{{ formatDate((item as EmployeeLeaveRequestRecord).request_date) }}</b-td>
            <b-td>
              <span
                class="reason-ellipsis d-inline-block align-middle"
                :title="(item as EmployeeLeaveRequestRecord).reason"
              >
                {{ (item as EmployeeLeaveRequestRecord).reason }}
              </span>
            </b-td>
            <b-td>
              <b-badge :variant="statusVariant((item as EmployeeLeaveRequestRecord).status)">
                {{ statusLabel((item as EmployeeLeaveRequestRecord).status) }}
              </b-badge>
            </b-td>
            <b-td v-if="canDecide" class="text-end text-nowrap">
              <b-button
                size="sm"
                variant="outline-primary"
                class="me-1"
                title="Visualizar motivo"
                @click="openReasonModal((item as EmployeeLeaveRequestRecord).reason)"
              >
                <i class="iconoir-eye"></i>
              </b-button>
              <template v-if="(item as EmployeeLeaveRequestRecord).status === 'pending'">
                <b-button
                  size="sm"
                  variant="outline-success"
                  class="me-1"
                  @click="decide(item as EmployeeLeaveRequestRecord, 'approved')"
                >
                  Aprovar
                </b-button>
                <b-button
                  size="sm"
                  variant="outline-danger"
                  @click="decide(item as EmployeeLeaveRequestRecord, 'rejected')"
                >
                  Rejeitar
                </b-button>
              </template>
              <span v-else class="text-muted small">—</span>
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>

    <b-modal
      v-model="reasonModal"
      title="Motivo da solicitação"
      ok-only
      ok-title="Fechar"
      hide-header-close
    >
      <p class="mb-0">{{ reasonModalText }}</p>
    </b-modal>
  </component>
</template>

<style scoped>
.reason-ellipsis {
  max-width: 340px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
