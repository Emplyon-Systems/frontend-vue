<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import FilterTriggerButton from "@/components/filters/FilterTriggerButton.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import EmployeesFilter from "@/views/panels/owner/employees/Filter.vue";
import type { EmployeesFilterModel } from "@/views/panels/owner/employees/Filter.vue";
import { employeesApi, branchesApi, companiesApi } from "@/api/resources";
import type { EmployeeRecord } from "@/types/api";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const loading = ref(true);
const employees = ref<EmployeeRecord[]>([]);
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const branchOptions = ref<Array<{ id: number; name: string; company_id?: number }>>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const initialFilters = (): EmployeesFilterModel => ({
  search: "",
  company_ids: [] as number[],
  branch_ids: [] as number[],
  created_at_from: "",
  created_at_until: "",
  per_page: 15,
});
const filters = ref<EmployeesFilterModel>(initialFilters());
const appliedFilters = ref<EmployeesFilterModel>(initialFilters());
const orderBy = ref("id");
const orderDir = ref<"asc" | "desc">("desc");
const routeName = computed(() => String(route.name ?? ""));
const isOwnerEmployees = computed(() => routeName.value.startsWith("owner.") && !routeName.value.startsWith("owner.company.workspace"));
const isOwnerWorkspace = computed(() => routeName.value.startsWith("owner.company.workspace"));
const workspaceCompanyId = computed(() => (isOwnerWorkspace.value ? Number(route.params.id ?? 0) : 0));
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));
const isCompanyFixed = computed(() => isOwnerWorkspace.value || companyScoped.value);
const currentBranchId = computed(() => {
  if (!branchScoped.value) return 0;
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.id ?? 0);
});

const listagemColumns = computed(() => [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "email", label: "E-mail", sortable: true, align: "start" as const },
  { key: "job_title", label: "Cargo", sortable: true, align: "start" as const },
  ...(isOwnerEmployees.value && !isCompanyFixed.value
    ? [{ key: "company", label: "Empresa", sortable: false, align: "start" as const }]
    : []),
  { key: "branches", label: "Filiais", sortable: false, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
]);
const deleteId = ref<number | null>(null);
const deleteModal = ref(false);
const showFilters = ref(false);
const hasActiveFilters = computed(
  () =>
    !!appliedFilters.value.search.trim() ||
    (appliedFilters.value.company_ids?.length ?? 0) > 0 ||
    (appliedFilters.value.branch_ids?.length ?? 0) > 0 ||
    !!appliedFilters.value.created_at_from ||
    !!appliedFilters.value.created_at_until
);

const resultLabel = computed(() => {
  const n = pagination.value.total;
  if (n === 0) return "Nenhum resultado";
  if (n === 1) return "1 resultado encontrado";
  return `${n} resultados encontrados`;
});
const canCreate = computed(() => authStore.hasPermission("employees.create"));
const canRead = computed(() => authStore.hasPermission("employees.read"));
const canUpdate = computed(() => authStore.hasPermission("employees.update"));
const canDelete = computed(() => authStore.hasPermission("employees.delete"));

async function loadPlucks() {
  if (branchScoped.value && currentBranchId.value > 0) {
    branchOptions.value = [{ id: currentBranchId.value, name: `Filial #${currentBranchId.value}`, company_id: undefined }];
    return;
  }
  if (isOwnerWorkspace.value && workspaceCompanyId.value > 0) {
    const branches = await branchesApi.plucks();
    branchOptions.value = (branches as { id: number; name?: string; company_id?: number }[])
      .filter((b) => b.company_id === workspaceCompanyId.value)
      .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}`, company_id: b.company_id }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return;
  }
  if (isOwnerEmployees.value) {
    const [companies, branches] = await Promise.all([companiesApi.plucks(), branchesApi.plucks()]);
    companyOptions.value = (companies as { id: number; name?: string }[])
      .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
    branchOptions.value = (branches as { id: number; name?: string; company_id?: number }[])
      .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}`, company_id: b.company_id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const branches = await branchesApi.plucks();
    branchOptions.value = (branches as { id: number; name?: string; company_id?: number }[])
      .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}`, company_id: b.company_id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

function getEffectiveBranchIds(): number[] | undefined {
  if (branchScoped.value && currentBranchId.value > 0) return [currentBranchId.value];
  if (isOwnerWorkspace.value && branchOptions.value.length > 0) {
    const af = appliedFilters.value;
    if ((af.branch_ids?.length ?? 0) > 0) return af.branch_ids;
    return branchOptions.value.map((b) => b.id);
  }
  const af = appliedFilters.value;
  const branchIds = af.branch_ids ?? [];
  const companyIds = af.company_ids ?? [];
  if (branchIds.length > 0) return branchIds;
  if (companyIds.length > 0 && branchOptions.value.length > 0) {
    return branchOptions.value
      .filter((b) => b.company_id != null && companyIds.includes(b.company_id))
      .map((b) => b.id);
  }
  return undefined;
}

function loadList(page = 1) {
  loading.value = true;
  const branchIds = getEffectiveBranchIds();
  employeesApi
    .list({
      page,
      per_page: appliedFilters.value.per_page,
      search: appliedFilters.value.search.trim() || undefined,
      branch_ids: branchIds,
      created_at_from: appliedFilters.value.created_at_from || undefined,
      created_at_until: appliedFilters.value.created_at_until || undefined,
      order_by: orderBy.value,
      order_dir: orderDir.value,
    })
    .then((data) => {
      employees.value = data.employees?.data ?? [];
      pagination.value = {
        current_page: data.employees?.current_page ?? 1,
        per_page: data.employees?.per_page ?? appliedFilters.value.per_page,
        total: data.employees?.total ?? 0,
        last_page: data.employees?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

function applyFilters() {
  appliedFilters.value = { ...filters.value };
  loadList(1);
}

function resetFilters() {
  filters.value = initialFilters();
  appliedFilters.value = initialFilters();
  loadList(1);
}

function confirmDelete(emp: EmployeeRecord) {
  deleteId.value = emp.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  employeesApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    notifySuccess("Funcionário eliminado com sucesso.");
    loadList(pagination.value.current_page);
  });
}

function routeNameFor(op: "list" | "create" | "view" | "edit"): string {
  if (branchScoped.value) return `branch.employees.${op}`;
  if (companyScoped.value) return `company.employees.${op}`;
  return `owner.employees.${op}`;
}

function goCreate() {
  if (!canCreate.value) return;
  router.push({ name: routeNameFor("create") });
}

function goView(id: number) {
  if (!canRead.value) return;
  router.push({ name: routeNameFor("view"), params: { id: String(id) } });
}

function goEdit(id: number) {
  if (!canUpdate.value) return;
  router.push({ name: routeNameFor("edit"), params: { id: String(id) } });
}

function onPerPageChange(value: number) {
  appliedFilters.value.per_page = value;
  filters.value.per_page = value;
  pagination.value.per_page = value;
  loadList(1);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  orderBy.value = ob;
  orderDir.value = od;
  loadList(1);
}

function branchesLabel(item: EmployeeRecord): string {
  const list = item.branches ?? [];
  if (!list.length) return "—";
  return list.map((b) => b.name ?? `#${b.id}`).join(", ");
}

function companyLabel(item: EmployeeRecord): string {
  if (item.company?.name) return item.company.name;
  return companyOptions.value.find((c) => c.id === item.company_id)?.name ?? "—";
}

onMounted(async () => {
  if (branchScoped.value && currentBranchId.value > 0) {
    filters.value.branch_ids = [currentBranchId.value];
    appliedFilters.value.branch_ids = [currentBranchId.value];
  }
  await loadPlucks();
  loadList();
});
</script>

<template>
  <component :is="isOwnerWorkspace || isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div :class="isOwnerWorkspace ? '' : 'py-4'">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Funcionários</h1>
          <p class="text-muted mb-0 small">
            {{
              branchScoped
                ? "Funcionários vinculados à sua filial."
                : isCompanyFixed
                  ? "Listar e criar funcionários das filiais desta empresa."
                  : "Listar e criar funcionários por empresa e filial."
            }}
          </p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <FilterTriggerButton v-model="showFilters" :active="hasActiveFilters" />
          <b-button v-if="canCreate" variant="primary" @click="goCreate">
            <i class="iconoir-plus me-1"></i>
            Novo funcionário
          </b-button>
        </div>
      </div>

      <UIComponentCard v-if="showFilters" title="Filtros" class="mb-3">
        <EmployeesFilter
          v-model="filters"
          :active="hasActiveFilters"
          :company-options="companyOptions"
          :branch-options="branchOptions"
          :show-company-filter="isOwnerEmployees && !isCompanyFixed"
          :hide-branch-selector="branchScoped"
          @apply="applyFilters"
          @reset="resetFilters"
        />
      </UIComponentCard>

      <ListagemCard
        :columns="listagemColumns"
        :data="employees"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="hasActiveFilters"
        empty-message="Nenhum funcionário encontrado."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as EmployeeRecord).id }}</b-td>
            <b-td>{{ (item as EmployeeRecord).name }}</b-td>
            <b-td>{{ (item as EmployeeRecord).email }}</b-td>
            <b-td>{{ (item as EmployeeRecord).job_title }}</b-td>
            <b-td v-if="isOwnerEmployees && !isCompanyFixed">
              {{ companyLabel(item as EmployeeRecord) }}
            </b-td>
            <b-td>{{ branchesLabel(item as EmployeeRecord) }}</b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as EmployeeRecord).id"
                :show-view="canRead"
                :show-edit="canUpdate"
                :show-delete="canDelete"
                view-title="Visualizar"
                edit-title="Editar"
                delete-title="Excluir"
                @view="goView"
                @edit="goEdit"
                @delete="(id) => { const e = employees.find((x) => x.id === id); if (e) confirmDelete(e); }"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>

    <ConfirmDeleteModal
      v-model="deleteModal"
      title="Excluir funcionário"
      message="Tem certeza de que deseja excluir este funcionário?"
      @confirm="doDelete"
    />
  </component>
</template>
