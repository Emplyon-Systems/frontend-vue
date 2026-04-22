<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ListagemCard from "@/components/ListagemCard.vue";
import { employeesApi, sectorsApi } from "@/api/resources";
import type { EmployeeRecord } from "@/types/api";

type Row = {
  id: number;
  name: string;
  email: string;
  job_title: string;
  sectorName: string;
  isPrimaryInBranch: boolean;
};

const props = defineProps<{
  branchId: number;
}>();

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const employees = ref<EmployeeRecord[]>([]);
const sectorNameById = ref<Map<number, string>>(new Map());
const currentPage = ref(1);
const perPage = ref(5);

const columns = [
  { key: "id", label: "ID", sortable: false, align: "start" as const },
  { key: "name", label: "Nome", sortable: false, align: "start" as const },
  { key: "email", label: "E-mail", sortable: false, align: "start" as const },
  { key: "job_title", label: "Cargo", sortable: false, align: "start" as const },
  { key: "sector", label: "Setor", sortable: false, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
];

function pivotForBranch(emp: EmployeeRecord, bid: number) {
  const b = emp.branches?.find((x) => x.id === bid);
  if (!b?.pivot) return { sectorId: 0, isPrimary: false };
  return {
    sectorId: Number(b.pivot.sector_id ?? 0),
    isPrimary: !!b.pivot.is_primary,
  };
}

const rows = computed<Row[]>(() => {
  const bid = props.branchId;
  return employees.value.map((emp) => {
    const { sectorId, isPrimary } = pivotForBranch(emp, bid);
    const sectorName =
      sectorId > 0 ? sectorNameById.value.get(sectorId) ?? `Setor #${sectorId}` : "—";
    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      job_title: emp.job_title,
      sectorName,
      isPrimaryInBranch: isPrimary,
    };
  });
});

const total = computed(() => rows.value.length);
const lastPage = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)));

const pagination = computed(() => ({
  current_page: Math.min(currentPage.value, lastPage.value),
  per_page: perPage.value,
  total: total.value,
  last_page: lastPage.value,
}));

const pagedEmployees = computed<Row[]>(() => {
  const page = Math.min(currentPage.value, lastPage.value);
  const start = (page - 1) * perPage.value;
  return rows.value.slice(start, start + perPage.value);
});

const resultLabel = computed(() => {
  if (total.value === 0) return "Nenhum funcionário nesta filial";
  if (total.value === 1) return "1 funcionário";
  return `${total.value} funcionários`;
});

function onPerPageChange(value: number) {
  perPage.value = value;
  currentPage.value = 1;
}

function onPageChange(page: number) {
  currentPage.value = page;
}

async function loadSectorNames(bid: number) {
  try {
    const plucks = await sectorsApi.plucks({ branch_id: bid });
    const m = new Map<number, string>();
    for (const s of plucks) {
      m.set(s.id, s.name);
    }
    sectorNameById.value = m;
  } catch {
    sectorNameById.value = new Map();
  }
}

async function loadEmployees(bid: number) {
  if (!bid) {
    employees.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const merged: EmployeeRecord[] = [];
    let page = 1;
    let last = 1;
    do {
      const res = await employeesApi.list({
        page,
        per_page: 100,
        branch_ids: [bid],
        order_by: "name",
        order_dir: "asc",
      });
      const pag = res.employees;
      merged.push(...(pag?.data ?? []));
      last = pag?.last_page ?? 1;
      page++;
    } while (page <= last);
    employees.value = merged;
  } catch {
    employees.value = [];
  } finally {
    loading.value = false;
  }
}

function goView(id: number) {
  const r = String(route.name ?? "");
  const name = r.startsWith("company.")
    ? "company.employees.view"
    : r.startsWith("branch.")
      ? "branch.employees.view"
      : "owner.employees.view";
  router.push({ name, params: { id: String(id) } });
}

onMounted(() => {
  loadSectorNames(props.branchId);
  loadEmployees(props.branchId);
});

watch(
  () => props.branchId,
  (bid) => {
    currentPage.value = 1;
    loadSectorNames(bid);
    loadEmployees(bid);
  }
);
</script>

<template>
  <ListagemCard
    :columns="columns"
    :data="pagedEmployees"
    :loading="loading"
    :pagination="pagination"
    :per-page-options="[5, 10, 15, 25]"
    :result-label="resultLabel"
    :has-active-filters="false"
    empty-message="Nenhum funcionário nesta filial."
    result-badge-class="result-badge-default"
    @update:per-page="onPerPageChange"
    @update:page="onPageChange"
  >
    <template #row="{ item }">
      <b-tr>
        <b-td>{{ (item as Row).id }}</b-td>
        <b-td>
          {{ (item as Row).name }}
          <b-badge v-if="(item as Row).isPrimaryInBranch" variant="success" class="ms-2">Principal</b-badge>
        </b-td>
        <b-td>{{ (item as Row).email }}</b-td>
        <b-td>{{ (item as Row).job_title }}</b-td>
        <b-td>{{ (item as Row).sectorName }}</b-td>
        <b-td class="text-end">
          <b-button size="sm" variant="outline-primary" @click="goView((item as Row).id)">Ver funcionário</b-button>
        </b-td>
      </b-tr>
    </template>
  </ListagemCard>
</template>
