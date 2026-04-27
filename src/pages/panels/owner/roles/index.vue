<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import FilterTriggerButton from "@/components/filters/FilterTriggerButton.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import RolesFilter from "@/views/panels/owner/roles/Filter.vue";
import { branchesApi, companiesApi, rolesApi } from "@/api/resources";
import type { RoleRecord } from "@/types/api";
import { notifySuccess, notifyError } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useModulePermissions } from "@/composables/usePermissions";
import { usePanelScope } from "@/composables/usePanelScope";
import { useFilterState } from "@/composables/useFilterState";
import { useListPageState } from "@/composables/useListPageState";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const rolePermissions = useModulePermissions("roles");
const { scopedCompanyId, currentBranchId } = usePanelScope();
const loading = ref(true);
const roles = ref<RoleRecord[]>([]);
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const branchOptions = ref<Array<{ id: number; company_id?: number; name: string }>>([]);
const { pagination, orderBy, orderDir, resultLabel, setPerPage, setSort } = useListPageState({
  perPage: 15,
  orderBy: "id",
  orderDir: "desc",
});
const initialFilters = () => ({
  search: "",
  company_ids: [] as number[],
  branch_ids: [] as number[],
  created_at_from: "",
  created_at_until: "",
});
const { filters, appliedFilters, hasActiveFilters, applyFilters, resetFilters } = useFilterState(
  initialFilters,
  (f) =>
    !!f.search.trim() ||
    (f.company_ids?.length ?? 0) > 0 ||
    (f.branch_ids?.length ?? 0) > 0 ||
    !!f.created_at_from ||
    !!f.created_at_until
);
const deleteId = ref<number | null>(null);
const deleteModal = ref(false);
const showFilters = ref(false);
const isSuperadmin = computed(() => authStore.hasRole("superadmin"));
/** Empresa pode editar perfis das suas filiais (incl. Gerente de Filial). */
const isCompanyContext = computed(
  () => !isSuperadmin.value && scopedCompanyId.value > 0 && currentBranchId.value <= 0
);
const isBranchContext = computed(
  () => !isSuperadmin.value && scopedCompanyId.value > 0 && currentBranchId.value > 0
);
/** Usuário tem opção de contexto empresa (pode editar Gerente Filial mesmo em filial). */
const hasCompanyLevelAccess = computed(() =>
  authStore.getContextOptions().some((o) => o.branch_id == null)
);
const showCompanyFilter = computed(() => isSuperadmin.value || rolePermissions.canList.value);
const showBranchFilter = computed(() => isSuperadmin.value || isCompanyContext.value || rolePermissions.canList.value);
const routeName = computed(() => String(route.name ?? ""));
const forcedCompanyId = computed(() => {
  if (routeName.value === "owner.company.workspace.roles") {
    const id = Number(route.params.id ?? 0);
    return id > 0 ? id : 0;
  }
  return 0;
});
const forcedBranchId = computed(() => {
  if (routeName.value === "company.branch.roles") {
    const id = Number(route.params.id ?? 0);
    return id > 0 ? id : 0;
  }
  return 0;
});
const hideTenantFiltersByRoute = computed(() => forcedCompanyId.value > 0 || forcedBranchId.value > 0);
const filteredBranchOptions = computed(() => {
  if (forcedBranchId.value > 0) {
    return branchOptions.value.filter((b) => b.id === forcedBranchId.value);
  }
  if (forcedCompanyId.value > 0) {
    return branchOptions.value.filter((b) => Number(b.company_id ?? 0) === forcedCompanyId.value);
  }
  if (isCompanyContext.value && authStore.activeContext?.company_id) {
    const activeCompanyId = Number(authStore.activeContext.company_id);
    return branchOptions.value.filter((b) => Number(b.company_id ?? 0) === activeCompanyId);
  }
  if (isBranchContext.value && authStore.activeContext?.branch_id) {
    const activeBranchId = Number(authStore.activeContext.branch_id);
    return branchOptions.value.filter((b) => b.id === activeBranchId);
  }
  if (!isSuperadmin.value) return [];
  if (!(filters.value.company_ids?.length ?? 0)) return branchOptions.value;
  const selected = new Set((filters.value.company_ids ?? []).map((id) => Number(id)));
  return branchOptions.value.filter((b) => selected.has(Number(b.company_id ?? 0)));
});

const listagemColumns = [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "slug", label: "Slug", sortable: true, align: "start" as const },
  { key: "branch", label: "Filial", sortable: false, align: "start" as const },
  { key: "description", label: "Descrição", sortable: false, align: "start" as const },
  { key: "permissions", label: "Permissões", sortable: false, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
];

function loadList(page = 1) {
  loading.value = true;
  const effectiveCompanyIds = forcedCompanyId.value > 0
    ? [forcedCompanyId.value]
    : (showCompanyFilter.value && (appliedFilters.value.company_ids?.length ?? 0) ? appliedFilters.value.company_ids : undefined);
  const effectiveBranchIds = forcedBranchId.value > 0
    ? [forcedBranchId.value]
    : (showBranchFilter.value && (appliedFilters.value.branch_ids?.length ?? 0) ? appliedFilters.value.branch_ids : undefined);
  rolesApi
    .list({
      page,
      per_page: pagination.value.per_page,
      search: appliedFilters.value.search.trim() || undefined,
      company_ids: effectiveCompanyIds,
      branch_ids: effectiveBranchIds,
      created_at_from: appliedFilters.value.created_at_from || undefined,
      created_at_until: appliedFilters.value.created_at_until || undefined,
      order_by: orderBy.value,
      order_dir: orderDir.value,
    })
    .then((data) => {
      roles.value = data.roles?.data ?? [];
      pagination.value = {
        current_page: data.roles?.current_page ?? 1,
        per_page: data.roles?.per_page ?? 15,
        total: data.roles?.total ?? 0,
        last_page: data.roles?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

function onPerPageChange(value: number) {
  setPerPage(value);
  loadList(1);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  setSort({ orderBy: ob, orderDir: od });
  loadList(1);
}

function confirmDelete(role: RoleRecord) {
  deleteId.value = role.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  rolesApi
    .remove(deleteId.value)
    .then(() => {
      deleteModal.value = false;
      deleteId.value = null;
      notifySuccess("Perfil eliminado com sucesso.");
      loadList(pagination.value.current_page);
    })
    .catch((err: { response?: { data?: { errors?: { role?: string[] } } } }) => {
      const msg = err.response?.data?.errors?.role?.[0] ?? "Não foi possível excluir o perfil.";
      notifyError(msg);
    });
}

function goCreate() {
  if (!rolePermissions.canCreate.value) return;
  router.push({ name: "owner.roles.form", params: { id: "new" } });
}

function goEdit(id: number) {
  if (!rolePermissions.canUpdate.value) return;
  router.push({ name: "owner.roles.form", params: { id: String(id) } });
}

/** Perfil criado automaticamente pela filial (filial-b{id}, setor-b{id}). Só a empresa (contexto empresa) ou owner/superadmin pode editar. */
function isSystemBranchRole(role: RoleRecord): boolean {
  const s = role.slug ?? "";
  return s.startsWith("filial-b") || s.startsWith("setor-b");
}
function canEditRole(role: RoleRecord): boolean {
  if (!rolePermissions.canUpdate.value) return false;
  if (!isSystemBranchRole(role)) return true;
  return isSuperadmin.value || isCompanyContext.value || hasCompanyLevelAccess.value;
}

function canDeleteRole(role: RoleRecord): boolean {
  if (!rolePermissions.canDelete.value) return false;
  return canEditRole(role);
}

onMounted(() => {
  if (forcedBranchId.value > 0) {
    filters.value.branch_ids = [forcedBranchId.value];
    appliedFilters.value.branch_ids = [forcedBranchId.value];
    loadList();
    return;
  }
  if (forcedCompanyId.value > 0) {
    filters.value.company_ids = [forcedCompanyId.value];
    appliedFilters.value.company_ids = [forcedCompanyId.value];
  }
  loadList();
});

onMounted(async () => {
  if (!showCompanyFilter.value && !showBranchFilter.value) return;
  const loadCompanies = isSuperadmin.value
    ? companiesApi.plucks()
    : Promise.resolve([] as { id: number; name?: string }[]);
  const branches = await (isSuperadmin.value || hasCompanyLevelAccess.value
    ? branchesApi.plucks()
    : Promise.resolve([]));
  const companies = await loadCompanies;
  companyOptions.value = (companies ?? [])
    .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  branchOptions.value = (branches ?? [])
    .map((b) => ({ id: b.id, company_id: b.company_id, name: b.name ?? `Filial #${b.id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Perfis</h1>
          <p class="text-muted mb-0 small">Listar, criar e editar perfis (roles) e vincular permissões.</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <FilterTriggerButton v-if="!hideTenantFiltersByRoute" v-model="showFilters" :active="hasActiveFilters" label="Filtros" />
          <b-button v-if="rolePermissions.canCreate" variant="primary" @click="goCreate">
            <i class="iconoir-plus me-1"></i>
            Novo perfil
          </b-button>
        </div>
      </div>

      <UIComponentCard v-if="showFilters && !hideTenantFiltersByRoute" title="Filtros" class="mb-3">
        <RolesFilter
          v-model="filters"
          :show-tenant-filters="showCompanyFilter || showBranchFilter"
          :show-company-filter="showCompanyFilter"
          :show-branch-filter="showBranchFilter"
          :company-options="companyOptions"
          :branch-options="filteredBranchOptions"
          @apply="() => { applyFilters(); loadList(1); }"
          @reset="() => { resetFilters(); if (forcedCompanyId > 0) { filters.company_ids = [forcedCompanyId]; appliedFilters.company_ids = [forcedCompanyId]; } if (forcedBranchId > 0) { filters.branch_ids = [forcedBranchId]; appliedFilters.branch_ids = [forcedBranchId]; } loadList(1); }"
        />
      </UIComponentCard>

      <ListagemCard
        :columns="listagemColumns"
        :data="roles"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="hasActiveFilters"
        empty-message="Nenhum perfil encontrado."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as RoleRecord).id }}</b-td>
            <b-td>{{ (item as RoleRecord).name }}</b-td>
            <b-td><code>{{ (item as RoleRecord).slug }}</code></b-td>
            <b-td>{{ (item as RoleRecord).branch?.name ?? "Nível empresa" }}</b-td>
            <b-td>{{ (item as RoleRecord).description || "—" }}</b-td>
            <b-td>
              <span v-if="(item as RoleRecord).permissions?.length" class="fw-semibold">
                {{ (item as RoleRecord).permissions?.length }}
                {{ (item as RoleRecord).permissions?.length === 1 ? "permissão" : "permissões" }}
              </span>
              <span v-else class="text-muted">—</span>
            </b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as RoleRecord).id"
                :show-view="false"
                :show-edit="canEditRole(item as RoleRecord)"
                :show-delete="canDeleteRole(item as RoleRecord)"
                edit-title="Editar"
                delete-title="Excluir"
                @edit="goEdit"
                @delete="(id) => { const role = roles.find((x) => x.id === id); if (role) confirmDelete(role); }"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>

    <ConfirmDeleteModal
      v-model="deleteModal"
      title="Excluir perfil"
      message="Tem certeza de que deseja excluir este perfil?"
      @confirm="doDelete"
    />
  </DefaultLayout>
</template>
