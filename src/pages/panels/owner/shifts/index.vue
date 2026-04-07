<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import FilterTriggerButton from "@/components/filters/FilterTriggerButton.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import ShiftsFilter from "@/views/panels/owner/shifts/Filter.vue";
import type { ShiftsFilterModel } from "@/views/panels/owner/shifts/Filter.vue";
import { shiftsApi, branchesApi, companiesApi } from "@/api/resources";
import type { ShiftRecord } from "@/types/api";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const routeName = computed(() => String(route.name ?? ""));
const isOwnerShifts = computed(() => routeName.value.startsWith("owner.") && !routeName.value.startsWith("owner.company.workspace"));
const isOwnerWorkspace = computed(() => routeName.value.startsWith("owner.company.workspace"));
const workspaceCompanyId = computed(() => isOwnerWorkspace.value ? Number(route.params.id ?? 0) : 0);
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));
const isCompanyFixed = computed(() => isOwnerWorkspace.value || companyScoped.value);
const currentBranchId = computed(() => {
  if (!branchScoped.value) return 0;
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.id ?? 0);
});
const loading = ref(true);
const shifts = ref<ShiftRecord[]>([]);
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const branchOptions = ref<Array<{ id: number; name: string; company_id?: number; company_name?: string }>>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const initialFilters = (): ShiftsFilterModel => ({
  name: "",
  company_ids: [] as number[],
  branch_ids: [] as number[],
  created_at_from: "",
  created_at_until: "",
  per_page: 15,
});
const filters = ref<ShiftsFilterModel>(initialFilters());
const appliedFilters = ref<ShiftsFilterModel>(initialFilters());
const orderBy = ref("id");
const orderDir = ref<"asc" | "desc">("desc");

const listagemColumns = computed(() => [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "slug", label: "Slug", sortable: true, align: "start" as const },
  { key: "start_time", label: "Horário início", sortable: true, align: "start" as const },
  { key: "end_time", label: "Horário fim", sortable: true, align: "start" as const },
  ...((isOwnerShifts.value || isOwnerWorkspace.value) && !isCompanyFixed.value ? [{ key: "company", label: "Empresa", sortable: false, align: "start" as const }] : []),
  ...(branchScoped.value ? [] : [{ key: "branch", label: "Filial", sortable: false, align: "start" as const }]),
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
]);
const deleteId = ref<number | null>(null);
const deleteModal = ref(false);
const showFilters = ref(false);
const hasActiveFilters = computed(
  () =>
    !!appliedFilters.value.name.trim() ||
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
const isSuperadmin = computed(() => authStore.hasRole("superadmin"));
const hasShiftsAccess = computed(
  () => isSuperadmin.value || authStore.hasPermission("shifts.index") || authStore.hasPermission("shifts.read")
);
const canCreate = computed(() => isSuperadmin.value || authStore.hasPermission("shifts.create"));
const canRead = computed(() => hasShiftsAccess.value || authStore.hasPermission("shifts.read"));
const canUpdate = computed(() => hasShiftsAccess.value || authStore.hasPermission("shifts.update"));
const canDelete = computed(() => hasShiftsAccess.value || authStore.hasPermission("shifts.delete"));

async function loadPlucks() {
  if (branchScoped.value && currentBranchId.value > 0) {
    let branchName =
      authStore.activeContext?.branch_id === currentBranchId.value
        ? authStore.activeContext?.branch_name
        : authStore.user?.branches?.find((b) => b.id === currentBranchId.value)?.name;
    if (!branchName) {
      try {
        const res = await branchesApi.getById(currentBranchId.value);
        branchName = res.branch?.name ?? `Filial #${currentBranchId.value}`;
      } catch {
        branchName = `Filial #${currentBranchId.value}`;
      }
    }
    branchOptions.value = [{
      id: currentBranchId.value,
      name: branchName ?? `Filial #${currentBranchId.value}`,
      company_id: undefined,
      company_name: "",
    }];
    return;
  }
  if (isOwnerWorkspace.value && workspaceCompanyId.value > 0) {
    const branches = await branchesApi.plucks();
    branchOptions.value = (branches as { id: number; name?: string; company_id?: number; company_name?: string }[])
      .filter((b) => b.company_id === workspaceCompanyId.value)
      .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}`, company_id: b.company_id, company_name: "" }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return;
  }
  if (isOwnerShifts.value) {
    const [companies, branches] = await Promise.all([
      companiesApi.plucks(),
      branchesApi.plucks(),
    ]);
    companyOptions.value = (companies as { id: number; name?: string }[])
      .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
    branchOptions.value = (branches as { id: number; name?: string; company_id?: number; company_name?: string }[])
      .map((b) => ({
        id: b.id,
        name: b.name ?? `Filial #${b.id}`,
        company_id: b.company_id,
        company_name: (b as { company_name?: string }).company_name ?? "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const branches = await branchesApi.plucks();
    let allBranches = (branches as { id: number; name?: string; company_id?: number; company_name?: string }[])
      .map((b) => ({
        id: b.id,
        name: b.name ?? `Filial #${b.id}`,
        company_id: b.company_id,
        company_name: (b as { company_name?: string }).company_name ?? "",
      }));
    const companyId = Number(authStore.activeContext?.company_id ?? 0);
    if (companyId > 0) {
      allBranches = allBranches.filter((b) => b.company_id != null && b.company_id === companyId);
    }
    branchOptions.value = allBranches.sort((a, b) => a.name.localeCompare(b.name));
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
  if (companyScoped.value && branchOptions.value.length > 0) {
    return branchOptions.value.map((b) => b.id);
  }
  return undefined;
}

function loadList(page = 1) {
  loading.value = true;
  const branchIds = getEffectiveBranchIds();
  shiftsApi
    .list({
      page,
      per_page: appliedFilters.value.per_page,
      name: appliedFilters.value.name.trim() || undefined,
      branch_ids: branchIds,
      created_at_from: appliedFilters.value.created_at_from || undefined,
      created_at_until: appliedFilters.value.created_at_until || undefined,
      order_by: orderBy.value,
      order_dir: orderDir.value,
    })
    .then((data) => {
      shifts.value = data.shifts?.data ?? [];
      pagination.value = {
        current_page: data.shifts?.current_page ?? 1,
        per_page: data.shifts?.per_page ?? appliedFilters.value.per_page,
        total: data.shifts?.total ?? 0,
        last_page: data.shifts?.last_page ?? 1,
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

function confirmDelete(shift: ShiftRecord) {
  deleteId.value = shift.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  shiftsApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    notifySuccess("Turno eliminado com sucesso.");
    loadList(pagination.value.current_page);
  });
}

function routeNameFor(op: "list" | "create" | "view" | "edit"): string {
  if (branchScoped.value) return `branch.shifts.${op}`;
  if (companyScoped.value) return `company.shifts.${op}`;
  return `owner.shifts.${op}`;
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

function formatTime(t?: string | null): string {
  if (!t) return "—";
  const [h, m] = String(t).split(":");
  return `${h ?? "00"}:${m ?? "00"}`;
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
  <component :is="isOwnerWorkspace ? 'div' : DefaultLayout">
    <div :class="isOwnerWorkspace ? '' : 'py-4'">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Turnos</h1>
          <p class="text-muted mb-0 small">
            {{ branchScoped ? "Turnos da sua filial." : isCompanyFixed ? "Listar e criar turnos das filiais desta empresa." : "Listar e criar turnos vinculados às filiais." }}
          </p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <FilterTriggerButton v-model="showFilters" :active="hasActiveFilters" />
          <b-button v-if="canCreate" variant="primary" @click="goCreate">
            <i class="iconoir-plus me-1"></i>
            Novo turno
          </b-button>
        </div>
      </div>

      <UIComponentCard v-if="showFilters" title="Filtros" class="mb-3">
        <ShiftsFilter
          v-model="filters"
          :active="hasActiveFilters"
          :company-options="companyOptions"
          :branch-options="branchOptions"
          :show-company-filter="isOwnerShifts && !isCompanyFixed"
          :hide-branch-selector="branchScoped"
          @apply="applyFilters"
          @reset="resetFilters"
        />
      </UIComponentCard>

      <ListagemCard
        :columns="listagemColumns"
        :data="shifts"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="hasActiveFilters"
        empty-message="Nenhum turno encontrado."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as ShiftRecord).id }}</b-td>
            <b-td>{{ (item as ShiftRecord).name }}</b-td>
            <b-td><code>{{ (item as ShiftRecord).slug }}</code></b-td>
            <b-td>{{ formatTime((item as ShiftRecord).start_time) }}</b-td>
            <b-td>{{ formatTime((item as ShiftRecord).end_time) }}</b-td>
            <b-td v-if="(isOwnerShifts || isOwnerWorkspace) && !isCompanyFixed">
              {{ companyOptions.find((c) => c.id === (item as ShiftRecord).branch?.company_id)?.name ?? (item as ShiftRecord).branch?.company?.name ?? "—" }}
            </b-td>
            <b-td v-if="!branchScoped">{{ (item as ShiftRecord).branch?.name ?? "—" }}</b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as ShiftRecord).id"
                :show-view="canRead"
                :show-edit="canUpdate"
                :show-delete="canDelete"
                view-title="Visualizar"
                edit-title="Editar"
                delete-title="Excluir"
                @view="goView"
                @edit="goEdit"
                @delete="(id) => { const s = shifts.find((x) => x.id === id); if (s) confirmDelete(s); }"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>

    <ConfirmDeleteModal
      v-model="deleteModal"
      title="Excluir turno"
      message="Tem certeza de que deseja excluir este turno?"
      @confirm="doDelete"
    />
  </component>
</template>
