<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import AppAlert from "@/components/AppAlert.vue";
import ListagemCard, { type ListagemColumn } from "@/components/ListagemCard.vue";
import { employeeDayOffsApi, employeeLeaveRequestsApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";
import { notifySuccess } from "@/helpers/notify";
import type { EmployeeDayOffRecord, EmployeeLeaveRequestRecord } from "@/types/api";

const props = defineProps<{
  employeeId: number;
}>();

const authStore = useAuthStore();

const canDecide = computed(
  () =>
    authStore.hasPermission("employee_leave_requests.approve_sector") ||
    authStore.hasPermission("employee_leave_requests.approve_branch") ||
    authStore.hasPermission("employee_leave_requests.update")
);

const reasonModal = ref(false);
const reasonModalText = ref("");

function openReasonModal(reason: string) {
  reasonModalText.value = reason;
  reasonModal.value = true;
}

const leaveLoading = ref(false);
const leaveListError = ref("");
const leaveRows = ref<EmployeeLeaveRequestRecord[]>([]);
const leavePage = ref(1);
const leavePerPage = ref(10);
const leaveTotal = ref(0);
const leaveLastPage = ref(1);

const leaveColumns = computed((): ListagemColumn[] => {
  const base: ListagemColumn[] = [
    { key: "request_date", label: "Data", sortable: false, align: "start" },
    { key: "reason", label: "Motivo", sortable: false, align: "start" },
    { key: "status", label: "Status", sortable: false, align: "start" },
  ];
  if (canDecide.value) {
    base.push({ key: "actions", label: "Ações", sortable: false, align: "end" });
  }
  return base;
});

const leavePagination = computed(() => ({
  current_page: leavePage.value,
  per_page: leavePerPage.value,
  total: leaveTotal.value,
  last_page: Math.max(1, leaveLastPage.value),
}));

const leaveResultLabel = computed(() => {
  const n = leaveTotal.value;
  if (n === 0) return "0 solicitações";
  if (n === 1) return "1 solicitação";
  return `${n} solicitações`;
});

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

async function loadLeaveRequests() {
  if (!props.employeeId) return;
  leaveLoading.value = true;
  leaveListError.value = "";
  try {
    const branchId = Number(authStore.activeContext?.branch_id ?? 0) || undefined;
    const res = await employeeLeaveRequestsApi.list({
      employee_id: props.employeeId,
      branch_id: branchId,
      page: leavePage.value,
      per_page: leavePerPage.value,
      order_by: "request_date",
      order_dir: "desc",
    });
    const pag = res.employeeLeaveRequests;
    leaveRows.value = pag?.data ?? [];
    leaveTotal.value = pag?.total ?? 0;
    leaveLastPage.value = pag?.last_page ?? 1;
  } catch (e: unknown) {
    const msg =
      e && typeof e === "object" && "response" in e
        ? (e as { response?: { data?: { msg?: string; message?: string } } }).response?.data?.msg ??
          (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
    leaveListError.value = msg ? String(msg) : "Erro ao carregar solicitações.";
    leaveRows.value = [];
  } finally {
    leaveLoading.value = false;
  }
}

async function decide(row: EmployeeLeaveRequestRecord, status: "approved" | "rejected") {
  try {
    await employeeLeaveRequestsApi.update(row.id, { status });
    notifySuccess(status === "approved" ? "Solicitação aprovada com sucesso." : "Solicitação rejeitada com sucesso.");
    await loadLeaveRequests();
    await loadList();
  } catch {
    leaveListError.value = "Não foi possível atualizar a solicitação.";
  }
}

function onLeavePageChange(p: number) {
  leavePage.value = p;
  loadLeaveRequests();
}

function onLeavePerPageChange(n: number) {
  leavePerPage.value = n;
  leavePage.value = 1;
  loadLeaveRequests();
}

const loading = ref(false);
const listError = ref("");
const rows = ref<EmployeeDayOffRecord[]>([]);
const currentPage = ref(1);
const perPage = ref(10);
const total = ref(0);
const lastPage = ref(1);

const columns = computed(
  (): ListagemColumn[] => [
    { key: "day_off_date", label: "Data da folga", sortable: false, align: "start" },
    { key: "approved_by", label: "Aprovado por", sortable: false, align: "start" },
    { key: "notes", label: "Observações", sortable: false, align: "start" },
  ]
);

const pagination = computed(() => ({
  current_page: currentPage.value,
  per_page: perPage.value,
  total: total.value,
  last_page: Math.max(1, lastPage.value),
}));

const resultLabel = computed(() => {
  const n = total.value;
  if (n === 0) return "0 registros";
  if (n === 1) return "1 registro";
  return `${n} registros`;
});

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return String(iso);
  return `${day}/${m}/${y}`;
}

async function loadList() {
  if (!props.employeeId) return;
  loading.value = true;
  listError.value = "";
  try {
    const res = await employeeDayOffsApi.list({
      employee_id: props.employeeId,
      page: currentPage.value,
      per_page: perPage.value,
      order_by: "day_off_date",
      order_dir: "desc",
    });
    const pag = res.employeeDayOffs;
    rows.value = pag?.data ?? [];
    total.value = pag?.total ?? 0;
    lastPage.value = pag?.last_page ?? 1;
  } catch (e: unknown) {
    const msg =
      e && typeof e === "object" && "response" in e
        ? (e as { response?: { data?: { msg?: string; message?: string } } }).response?.data?.msg ??
          (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
    listError.value = msg ? String(msg) : "Erro ao carregar.";
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

function onPageChange(p: number) {
  currentPage.value = p;
  loadList();
}

function onPerPageChange(n: number) {
  perPage.value = n;
  currentPage.value = 1;
  loadList();
}

watch(
  () => props.employeeId,
  () => {
    currentPage.value = 1;
    leavePage.value = 1;
    loadList();
    loadLeaveRequests();
  }
);

onMounted(() => {
  loadLeaveRequests();
  loadList();
});
</script>

<template>
  <div>
    <h6 class="text-body mb-2">Solicitações de folga</h6>
    <AppAlert
      v-if="leaveListError"
      variant="danger"
      class="mb-3"
      dismissible
      @dismissed="leaveListError = ''"
    >
      {{ leaveListError }}
    </AppAlert>
    <p class="text-muted small mb-3">Solicitações deste colaborador. Enquanto estiver <strong>pendente</strong>, ainda não gera registro de folga aprovada abaixo.</p>

    <ListagemCard
      :columns="leaveColumns"
      :data="leaveRows"
      :loading="leaveLoading"
      :pagination="leavePagination"
      :per-page-options="[5, 10, 15]"
      :result-label="leaveResultLabel"
      :has-active-filters="false"
      :empty-message="'Nenhuma solicitação de folga para este colaborador.'"
      result-badge-class="result-badge-default"
      class="mb-4"
      @update:per-page="onLeavePerPageChange"
      @update:page="onLeavePageChange"
    >
      <template #row="{ item }">
        <b-tr>
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

    <h6 class="text-body mb-2">Folgas aprovadas (materializadas)</h6>
    <AppAlert v-if="listError" variant="danger" class="mb-3" dismissible @dismissed="listError = ''">
      {{ listError }}
    </AppAlert>
    <p class="text-muted small mb-3">Registros utilizados para cálculos após aprovação (tabela de folgas).</p>

    <ListagemCard
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      :per-page-options="[5, 10, 15]"
      :result-label="resultLabel"
      :has-active-filters="false"
      :empty-message="'Nenhuma folga aprovada registrada.'"
      result-badge-class="result-badge-default"
      @update:per-page="onPerPageChange"
      @update:page="onPageChange"
    >
      <template #row="{ item }">
        <b-tr>
          <b-td>{{ formatDate((item as EmployeeDayOffRecord).day_off_date) }}</b-td>
          <b-td>{{ (item as EmployeeDayOffRecord).approved_by_user?.name || "—" }}</b-td>
          <b-td>{{ (item as EmployeeDayOffRecord).notes || "—" }}</b-td>
        </b-tr>
      </template>
    </ListagemCard>

    <b-modal
      v-model="reasonModal"
      title="Motivo da solicitação"
      ok-only
      ok-title="Fechar"
      hide-header-close
    >
      <p class="mb-0 text-break">{{ reasonModalText }}</p>
    </b-modal>
  </div>
</template>

<style scoped>
.reason-ellipsis {
  max-width: 340px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
