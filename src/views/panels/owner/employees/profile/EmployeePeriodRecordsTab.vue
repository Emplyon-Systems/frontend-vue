<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppAlert from "@/components/AppAlert.vue";
import ListagemCard, { type ListagemColumn } from "@/components/ListagemCard.vue";
import {
  employeeLeavesApi,
  employeeMedicalCertificatesApi,
  employeeVacationsApi,
} from "@/api/resources";
import { useAuthStore } from "@/stores/auth";
import {
  employeesAbsencesCreateRouteName,
  employeesAbsencesEditRouteName,
  tabKindToPathKind,
} from "@/helpers/employeeAbsenceRoutes";
import type {
  EmployeeLeafRecord,
  EmployeeMedicalCertificateRecord,
  EmployeeVacationRecord,
} from "@/types/api";

type Kind = "vacation" | "medical" | "leaf";

type Row = EmployeeVacationRecord | EmployeeMedicalCertificateRecord | EmployeeLeafRecord;

const props = defineProps<{
  employeeId: number;
  kind: Kind;
}>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const canRegister = computed(() => authStore.hasPermission("employees.create"));
const canEditRows = computed(() => authStore.hasPermission("employees.update"));

const loading = ref(false);
const listError = ref("");
const rows = ref<Row[]>([]);
const currentPage = ref(1);
const perPage = ref(10);
const total = ref(0);
const lastPage = ref(1);

const showDelete = ref(false);
const deleteTargetId = ref<number | null>(null);

const description = computed(() => {
  if (props.kind === "vacation") return "Períodos de férias registrados para este funcionário.";
  if (props.kind === "medical") return "Atestados médicos registrados (apenas período).";
  return "Afastamentos registrados (apenas período).";
});

const emptyMessage = computed(() => {
  if (props.kind === "vacation") return "Nenhum período de férias registrado.";
  if (props.kind === "medical") return "Nenhum atestado registrado.";
  return "Nenhum afastamento registrado.";
});

const columns = computed((): ListagemColumn[] => {
  const base: ListagemColumn[] = [
    { key: "start", label: "Início", sortable: false, align: "start" },
    { key: "end", label: "Término", sortable: false, align: "start" },
    { key: "days", label: "Dias", sortable: false, align: "start" },
  ];
  if (canEditRows.value) {
    base.push({ key: "actions", label: "Ações", sortable: false, align: "end" });
  }
  return base;
});

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

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return iso;
  return `${day}/${m}/${y}`;
}

function goCreate() {
  router.push({
    name: employeesAbsencesCreateRouteName(String(route.name ?? "")),
    params: {
      employeeId: String(props.employeeId),
      kind: tabKindToPathKind(props.kind),
    },
  });
}

function goEdit(row: Row) {
  router.push({
    name: employeesAbsencesEditRouteName(String(route.name ?? "")),
    params: {
      employeeId: String(props.employeeId),
      kind: tabKindToPathKind(props.kind),
      recordId: String(row.id),
    },
  });
}

async function loadList() {
  if (!props.employeeId) return;
  loading.value = true;
  listError.value = "";
  try {
    const params = {
      employee_id: props.employeeId,
      page: currentPage.value,
      per_page: perPage.value,
      order_by: "start_date",
      order_dir: "desc" as const,
    };
    if (props.kind === "vacation") {
      const res = await employeeVacationsApi.list(params);
      const pag = res.employeeVacations;
      rows.value = (pag?.data ?? []) as Row[];
      total.value = pag?.total ?? 0;
      lastPage.value = pag?.last_page ?? 1;
    } else if (props.kind === "medical") {
      const res = await employeeMedicalCertificatesApi.list(params);
      const pag = res.employeeMedicalCertificates;
      rows.value = (pag?.data ?? []) as Row[];
      total.value = pag?.total ?? 0;
      lastPage.value = pag?.last_page ?? 1;
    } else {
      const res = await employeeLeavesApi.list(params);
      const pag = res.employeeLeaves;
      rows.value = (pag?.data ?? []) as Row[];
      total.value = pag?.total ?? 0;
      lastPage.value = pag?.last_page ?? 1;
    }
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

function askDelete(row: Row) {
  deleteTargetId.value = row.id;
  showDelete.value = true;
}

async function confirmDelete() {
  const id = deleteTargetId.value;
  if (!id) return;
  try {
    if (props.kind === "vacation") await employeeVacationsApi.remove(id);
    else if (props.kind === "medical") await employeeMedicalCertificatesApi.remove(id);
    else await employeeLeavesApi.remove(id);
    await loadList();
  } catch {
    listError.value = "Não foi possível excluir.";
  } finally {
    deleteTargetId.value = null;
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
    loadList();
  }
);

onMounted(() => {
  loadList();
});
</script>

<template>
  <div>
    <AppAlert v-if="listError" variant="danger" class="mb-3" dismissible @dismissed="listError = ''">
      {{ listError }}
    </AppAlert>

    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <p class="text-muted small mb-0">{{ description }}</p>
      <b-button v-if="canRegister" size="sm" variant="primary" @click="goCreate">Novo</b-button>
    </div>

    <ListagemCard
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      :per-page-options="[5, 10, 15]"
      :result-label="resultLabel"
      :has-active-filters="false"
      :empty-message="emptyMessage"
      result-badge-class="result-badge-default"
      @update:per-page="onPerPageChange"
      @update:page="onPageChange"
    >
      <template #row="{ item }">
        <b-tr>
          <b-td>{{ formatDate((item as Row).start_date) }}</b-td>
          <b-td>{{ formatDate((item as Row).end_date) }}</b-td>
          <b-td>{{ (item as Row).total_period_days }}</b-td>
          <b-td v-if="canEditRows" class="text-end text-nowrap">
            <b-button size="sm" variant="outline-primary" class="me-1" @click="goEdit(item as Row)">
              Editar
            </b-button>
            <b-button size="sm" variant="outline-danger" @click="askDelete(item as Row)">Excluir</b-button>
          </b-td>
        </b-tr>
      </template>
    </ListagemCard>

    <b-modal v-model="showDelete" title="Confirmar" ok-variant="danger" ok-title="Excluir" @ok="confirmDelete">
      <p class="mb-0">Excluir este registro? Esta ação não pode ser desfeita.</p>
    </b-modal>
  </div>
</template>
