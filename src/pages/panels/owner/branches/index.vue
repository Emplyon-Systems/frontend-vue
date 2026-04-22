<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import FilterTriggerButton from "@/components/filters/FilterTriggerButton.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import BranchesFilter from "@/views/panels/owner/branches/Filter.vue";
import { branchesApi, companiesApi } from "@/api/resources";
import type { BranchRecord } from "@/types/api";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const loading = ref(true);
const branches = ref<BranchRecord[]>([]);
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const initialFilters = () => ({
  name: "",
  cnpj: "",
  company_ids: [] as number[],
  created_at_from: "",
  created_at_until: "",
  per_page: 15,
});
const filters = ref(initialFilters());
const appliedFilters = ref(initialFilters());
const orderBy = ref("id");
const orderDir = ref<"asc" | "desc">("desc");

const deleteId = ref<number | null>(null);
const deleteModal = ref(false);
const showFilters = ref(false);
const companyScoped = computed(() => String(route.name ?? "").startsWith("company."));
const scopedCompanyId = computed(() => (companyScoped.value ? Number(authStore.user?.companies?.[0]?.id ?? 0) : 0));
const isOwnerWorkspace = computed(() => String(route.name ?? "").startsWith("owner.company.workspace"));
const workspaceCompanyId = computed(() => isOwnerWorkspace.value ? Number(route.params.id ?? 0) : 0);
const isCompanyFixed = computed(() => isOwnerWorkspace.value || companyScoped.value);
const effectiveCompanyId = computed(() => isOwnerWorkspace.value ? workspaceCompanyId.value : scopedCompanyId.value);

const listagemColumns = computed(() => [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "cnpj", label: "CNPJ", sortable: true, align: "start" as const },
  ...(!isCompanyFixed.value ? [{ key: "company", label: "Empresa", sortable: false, align: "start" as const }] : []),
  { key: "city", label: "Município", sortable: true, align: "start" as const },
  { key: "state", label: "Estado", sortable: true, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
]);
const hasActiveFilters = computed(
  () =>
    !!appliedFilters.value.name.trim() ||
    !!appliedFilters.value.cnpj.trim() ||
    (appliedFilters.value.company_ids?.length ?? 0) > 0 ||
    !!appliedFilters.value.created_at_from ||
    !!appliedFilters.value.created_at_until
);

const resultLabel = computed(() => {
  const n = pagination.value.total;
  if (n === 0) return "Nenhum resultado";
  if (n === 1) return "1 resultado encontrado";
  return `${n} resultados encontrados`;
});
const canCreate = computed(() => authStore.hasPermission("branches.create"));
/** Painel empresa: limite de filiais já atingido (botão desativado). */
const branchLimitReached = ref(false);
const canRead = computed(() => authStore.hasPermission("branches.read"));
const canUpdate = computed(() => authStore.hasPermission("branches.update"));
const canDelete = computed(() => authStore.hasPermission("branches.delete"));

async function loadCompanyBranchQuota() {
  if (!isCompanyFixed.value || effectiveCompanyId.value <= 0) {
    branchLimitReached.value = false;
    return;
  }
  try {
    const res = await companiesApi.getById(effectiveCompanyId.value);
    const c = res.company;
    if (!c) {
      branchLimitReached.value = false;
      return;
    }
    const used = c.branches_used ?? c.branches?.length ?? 0;
    const limit = c.branch_limit ?? 0;
    branchLimitReached.value = limit > 0 && used >= limit;
  } catch {
    branchLimitReached.value = false;
  }
}

async function loadPlucks() {
  if (isOwnerWorkspace.value && workspaceCompanyId.value > 0) {
    try {
      const res = await companiesApi.getById(workspaceCompanyId.value);
      const name = res.company?.name ?? `Empresa #${workspaceCompanyId.value}`;
      companyOptions.value = [{ id: workspaceCompanyId.value, name }];
    } catch {
      companyOptions.value = [{ id: workspaceCompanyId.value, name: `Empresa #${workspaceCompanyId.value}` }];
    }
    return;
  }
  if (companyScoped.value && scopedCompanyId.value > 0) {
    const companyName = authStore.user?.companies?.[0]?.name ?? "Minha empresa";
    companyOptions.value = [{ id: scopedCompanyId.value, name: companyName }];
    return;
  }
  const companies = await companiesApi.plucks();
  companyOptions.value = companies
    .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function loadList(page = 1) {
  loading.value = true;
  branchesApi
    .list({
      page,
      per_page: appliedFilters.value.per_page,
      name: appliedFilters.value.name.trim() || undefined,
      cnpj: appliedFilters.value.cnpj.trim() || undefined,
      company_id: isCompanyFixed.value ? effectiveCompanyId.value : undefined,
      company_ids: !isCompanyFixed.value && (appliedFilters.value.company_ids?.length ?? 0)
        ? appliedFilters.value.company_ids
        : undefined,
      created_at_from: appliedFilters.value.created_at_from || undefined,
      created_at_until: appliedFilters.value.created_at_until || undefined,
      order_by: orderBy.value,
      order_dir: orderDir.value,
    })
    .then((data) => {
      branches.value = data.branches?.data ?? [];
      pagination.value = {
        current_page: data.branches?.current_page ?? 1,
        per_page: data.branches?.per_page ?? appliedFilters.value.per_page,
        total: data.branches?.total ?? 0,
        last_page: data.branches?.last_page ?? 1,
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

function confirmDelete(branch: BranchRecord) {
  deleteId.value = branch.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  branchesApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    notifySuccess("Filial eliminada com sucesso.");
    void loadCompanyBranchQuota();
    loadList(pagination.value.current_page);
  });
}

function goCreate() {
  if (!canCreate.value) return;
  if (isOwnerWorkspace.value) {
    router.push({ name: "owner.branches.create", query: { company_id: String(workspaceCompanyId.value) } });
    return;
  }
  router.push({ name: companyScoped.value ? "company.branches.create" : "owner.branches.create" });
}

function goView(id: number) {
  if (!canRead.value) return;
  if (isOwnerWorkspace.value) {
    router.push({ name: "owner.branches.view", params: { id: String(id) }, query: { company_id: String(workspaceCompanyId.value) } });
    return;
  }
  router.push({
    name: companyScoped.value ? "company.branch.overview" : "owner.branches.view",
    params: { id: String(id) },
  });
}

function goEdit(id: number) {
  if (!canUpdate.value) return;
  if (isOwnerWorkspace.value) {
    router.push({ name: "owner.branches.edit", params: { id: String(id) }, query: { company_id: String(workspaceCompanyId.value) } });
    return;
  }
  router.push({ name: companyScoped.value ? "company.branches.edit" : "owner.branches.edit", params: { id: String(id) } });
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

onMounted(() => {
  if (isCompanyFixed.value && effectiveCompanyId.value > 0) {
    filters.value.company_ids = [effectiveCompanyId.value];
    appliedFilters.value.company_ids = [effectiveCompanyId.value];
  }
  void loadPlucks();
  void loadCompanyBranchQuota();
  loadList();
});
</script>

<template>
  <component :is="isOwnerWorkspace || isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div :class="isOwnerWorkspace ? '' : 'py-4'">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Filiais</h1>
          <p class="text-muted mb-0 small">
            {{ isCompanyFixed ? "Listar e criar filiais desta empresa." : "Listar e criar filiais vinculadas às empresas." }}
          </p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <FilterTriggerButton v-model="showFilters" :active="hasActiveFilters" />
          <template v-if="canCreate">
            <b-button v-if="!branchLimitReached" variant="primary" @click="goCreate">
              <i class="iconoir-plus me-1"></i>
              Nova filial
            </b-button>
            <span v-else class="text-muted small">Limite de filiais atingido</span>
          </template>
        </div>
      </div>

      <UIComponentCard v-if="showFilters" title="Filtros" class="mb-3">
        <BranchesFilter
          v-model="filters"
          :active="hasActiveFilters"
          :company-options="companyOptions"
          :hide-company-selector="isCompanyFixed"
          @apply="applyFilters"
          @reset="resetFilters"
        />
      </UIComponentCard>

      <ListagemCard
        :columns="listagemColumns"
        :data="branches"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="hasActiveFilters"
        empty-message="Nenhuma filial encontrada."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as BranchRecord).id }}</b-td>
            <b-td>{{ (item as BranchRecord).name }}</b-td>
            <b-td>{{ (item as BranchRecord).cnpj }}</b-td>
            <b-td v-if="!isCompanyFixed">{{ (item as BranchRecord).company?.name ?? "—" }}</b-td>
            <b-td>{{ (item as BranchRecord).city }}</b-td>
            <b-td>{{ (item as BranchRecord).state }}</b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as BranchRecord).id"
                :show-view="canRead"
                :show-edit="canUpdate"
                :show-delete="canDelete"
                view-title="Visualizar"
                edit-title="Editar"
                delete-title="Excluir"
                @view="goView"
                @edit="goEdit"
                @delete="(id) => { const b = branches.find((x) => x.id === id); if (b) confirmDelete(b); }"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>

    <ConfirmDeleteModal
      v-model="deleteModal"
      title="Excluir filial"
      message="Tem certeza de que deseja excluir esta filial?"
      @confirm="doDelete"
    />
  </component>
</template>
