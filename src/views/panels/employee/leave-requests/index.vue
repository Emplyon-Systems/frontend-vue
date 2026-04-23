<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ListagemCard, { type ListagemColumn } from "@/components/ListagemCard.vue";
import { employeeLeaveRequestsApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";
import type { EmployeeLeaveRequestRecord } from "@/types/api";
import { useListPageState } from "@/composables/useListPageState";

const router = useRouter();
const authStore = useAuthStore();

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

const columns = computed(
  (): ListagemColumn[] => [
    { key: "request_date", label: "Data", sortable: true, align: "start" },
    { key: "reason", label: "Motivo", sortable: false, align: "start" },
    { key: "status", label: "Status", sortable: true, align: "start" },
    { key: "actions", label: "Ações", sortable: false, align: "end" },
  ]
);

function openReasonModal(reason: string) {
  reasonModalText.value = reason;
  reasonModal.value = true;
}

async function loadList(page = 1) {
  loading.value = true;
  error.value = "";
  try {
    const res = await employeeLeaveRequestsApi.list({
      requested_by_user_id: Number(authStore.user?.id ?? 0),
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
    error.value = "Não foi possível carregar suas solicitações.";
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

function onPerPageChange(value: number) {
  setPerPage(value);
  loadList(1);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  setSort({ orderBy: ob, orderDir: od });
  loadList(1);
}

onMounted(() => {
  loadList();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Solicitações de folga</h1>
          <p class="text-muted small mb-0">Acompanhe o status das folgas solicitadas.</p>
        </div>
        <b-button variant="primary" @click="router.push({ name: 'employee.leave-requests.create' })">Solicitar folga</b-button>
      </div>

      <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

      <ListagemCard
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="listPagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="false"
        :empty-message="'Nenhuma solicitação encontrada.'"
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
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
            <b-td class="text-end text-nowrap">
              <b-button
                size="sm"
                variant="outline-primary"
                title="Visualizar motivo"
                @click="openReasonModal((item as EmployeeLeaveRequestRecord).reason)"
              >
                <i class="iconoir-eye"></i>
              </b-button>
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
  </DefaultLayout>
</template>

<style scoped>
.reason-ellipsis {
  max-width: 340px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
