<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import FilterTriggerButton from "@/components/filters/FilterTriggerButton.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import PositionsFilter from "@/views/panels/owner/positions/Filter.vue";
import type { PositionsFilterModel } from "@/views/panels/owner/positions/Filter.vue";
import { positionsApi, branchesApi } from "@/api/resources";
import type { PositionRecord } from "@/types/api";
import { notifySuccess } from "@/helpers/notify";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { useModulePermissions } from "@/composables/usePermissions";
import { usePanelScope } from "@/composables/usePanelScope";
import { useFilterState } from "@/composables/useFilterState";
import { useListPageState } from "@/composables/useListPageState";
import { useScopePlucks } from "@/composables/useScopePlucks";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { loadBranchOptionsByScope, loadCompanyOptionsByScope } = useScopePlucks();
const positionPermissions = useModulePermissions("positions");
const {
  routeName,
  isCompanyBranchWorkspace,
  companyBranchWorkspaceId: companyBranchWsId,
  isOwnerWorkspace,
  workspaceCompanyId,
  isCompanyScoped: companyScoped,
  isBranchScoped: branchScoped,
  isCompanyFixed,
  currentBranchId,
} = usePanelScope();

const loading = ref(true);
const positions = ref<PositionRecord[]>([]);
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const branchOptions = ref<Array<{ id: number; name: string; company_id?: number }>>([]);
const { pagination, orderBy, orderDir, resultLabel, setPerPage, setSort } = useListPageState({
  perPage: 15,
  orderBy: "id",
  orderDir: "desc",
});

const initialFilters = (): PositionsFilterModel => ({
  name: "",
  company_ids: [] as number[],
  branch_ids: [] as number[],
  created_at_from: "",
  created_at_until: "",
  per_page: 15,
});

const { filters, appliedFilters, hasActiveFilters, applyFilters, resetFilters } = useFilterState(
  initialFilters,
  (f) =>
    !!f.name.trim() ||
    (f.company_ids?.length ?? 0) > 0 ||
    (f.branch_ids?.length ?? 0) > 0 ||
    !!f.created_at_from ||
    !!f.created_at_until
);

const isOwnerPositions = computed(() => routeName.value.startsWith("owner.") && !routeName.value.startsWith("owner.company.workspace"));

const listagemColumns = computed(() => [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "slug", label: "Slug", sortable: true, align: "start" as const },
  ...((isOwnerPositions.value && !isCompanyFixed.value)
    ? [{ key: "company", label: "Empresa", sortable: false, align: "start" as const }]
    : []),
  ...(branchScoped.value || isCompanyBranchWorkspace.value
    ? []
    : [{ key: "branch", label: "Filial", sortable: false, align: "start" as const }]),
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
]);

const deleteId = ref<number | null>(null);
const deleteModal = ref(false);
const showFilters = ref(false);
const canCreate = positionPermissions.canCreate;
const canRead = positionPermissions.canRead;
const canUpdate = positionPermissions.canUpdate;
const canDelete = positionPermissions.canDelete;
const canReadByRoleProfile = computed(
  () =>
    (companyScoped.value || isCompanyBranchWorkspace.value || isOwnerWorkspace.value) &&
    authStore.hasPermission("roles.read")
);
const canCreateByRoleProfile = computed(
  () =>
    (companyScoped.value || isCompanyBranchWorkspace.value || isOwnerWorkspace.value) &&
    authStore.hasPermission("roles.create")
);
const canUpdateByRoleProfile = computed(
  () =>
    (companyScoped.value || isCompanyBranchWorkspace.value || isOwnerWorkspace.value) &&
    authStore.hasPermission("roles.update")
);
const canDeleteByRoleProfile = computed(
  () =>
    (companyScoped.value || isCompanyBranchWorkspace.value || isOwnerWorkspace.value) &&
    authStore.hasPermission("roles.delete")
);
const canReadPosition = computed(() => canRead.value || canReadByRoleProfile.value);
const canCreatePosition = computed(() => canCreate.value || canCreateByRoleProfile.value);
const canUpdatePosition = computed(() => canUpdate.value || canUpdateByRoleProfile.value);
const canDeletePosition = computed(() => canDelete.value || canDeleteByRoleProfile.value);

async function loadPlucks() {
  if (isCompanyBranchWorkspace.value && companyBranchWsId.value > 0) {
    try {
      const res = await branchesApi.getById(companyBranchWsId.value);
      const nm = res.branch?.name?.trim() || `Filial #${companyBranchWsId.value}`;
      branchOptions.value = [{ id: companyBranchWsId.value, name: nm, company_id: res.branch?.company_id }];
    } catch {
      branchOptions.value = [{ id: companyBranchWsId.value, name: `Filial #${companyBranchWsId.value}`, company_id: undefined }];
    }
    return;
  }
  branchOptions.value = await loadBranchOptionsByScope({
    branchScoped: branchScoped.value,
    currentBranchId: currentBranchId.value,
    workspaceCompanyId: workspaceCompanyId.value,
  });
  if (isOwnerPositions.value) {
    companyOptions.value = await loadCompanyOptionsByScope({ companyScoped: false, scopedCompanyId: 0 });
  }
}

function getEffectiveBranchIds(): number[] | undefined {
  if (isCompanyBranchWorkspace.value && companyBranchWsId.value > 0) return [companyBranchWsId.value];
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
  positionsApi
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
      positions.value = data.positions?.data ?? [];
      pagination.value = {
        current_page: data.positions?.current_page ?? 1,
        per_page: data.positions?.per_page ?? appliedFilters.value.per_page,
        total: data.positions?.total ?? 0,
        last_page: data.positions?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

function confirmDelete(position: PositionRecord) {
  deleteId.value = position.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  positionsApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    notifySuccess("Cargo eliminado com sucesso.");
    loadList(pagination.value.current_page);
  });
}

function routeNameFor(op: "list" | "create" | "view" | "edit"): string {
  if (branchScoped.value) return `branch.positions.${op}`;
  if (companyScoped.value) return `company.positions.${op}`;
  return `owner.positions.${op}`;
}

function goCreate() {
  if (!canCreatePosition.value) return;
  if (isCompanyBranchWorkspace.value && companyBranchWsId.value > 0) {
    router.push({ name: "company.positions.create", query: { branch_id: String(companyBranchWsId.value) } });
    return;
  }
  router.push({ name: routeNameFor("create") });
}

function goView(id: number) {
  if (!canReadPosition.value) return;
  router.push({ name: routeNameFor("view"), params: { id: String(id) } });
}

function goEdit(id: number) {
  if (!canUpdatePosition.value) return;
  router.push({ name: routeNameFor("edit"), params: { id: String(id) } });
}

function onPerPageChange(value: number) {
  appliedFilters.value.per_page = value;
  filters.value.per_page = value;
  setPerPage(value);
  loadList(1);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  setSort({ orderBy: ob, orderDir: od });
  loadList(1);
}

onMounted(async () => {
  if (isCompanyBranchWorkspace.value && companyBranchWsId.value > 0) {
    filters.value.branch_ids = [companyBranchWsId.value];
    appliedFilters.value.branch_ids = [companyBranchWsId.value];
  } else if (branchScoped.value && currentBranchId.value > 0) {
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
          <h1 class="h4 mb-1">Cargos</h1>
          <p class="text-muted mb-0 small">
            {{
              isCompanyBranchWorkspace
                ? "Cargos apenas desta filial."
                : branchScoped
                  ? "Cargos da sua filial."
                  : isCompanyFixed
                    ? "Listar e criar cargos das filiais desta empresa."
                    : "Listar e criar cargos vinculados às filiais."
            }}
          </p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <FilterTriggerButton v-model="showFilters" :active="hasActiveFilters" />
          <b-button v-if="canCreatePosition" variant="primary" @click="goCreate">
            <i class="iconoir-plus me-1"></i>
            Novo cargo
          </b-button>
        </div>
      </div>

      <UIComponentCard v-if="showFilters" title="Filtros" class="mb-3">
        <PositionsFilter
          v-model="filters"
          :active="hasActiveFilters"
          :company-options="companyOptions"
          :branch-options="branchOptions"
          :show-company-filter="isOwnerPositions && !isCompanyFixed"
          :hide-branch-selector="branchScoped || isCompanyBranchWorkspace"
          @apply="() => { applyFilters(); loadList(1); }"
          @reset="() => { resetFilters(); loadList(1); }"
        />
      </UIComponentCard>

      <ListagemCard
        :columns="listagemColumns"
        :data="positions"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="hasActiveFilters"
        empty-message="Nenhum cargo encontrado."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as PositionRecord).id }}</b-td>
            <b-td>{{ (item as PositionRecord).name }}</b-td>
            <b-td><code>{{ (item as PositionRecord).slug }}</code></b-td>
            <b-td v-if="isOwnerPositions && !isCompanyFixed">
              {{ companyOptions.find((c) => c.id === (item as PositionRecord).branch?.company_id)?.name ?? "—" }}
            </b-td>
            <b-td v-if="!branchScoped && !isCompanyBranchWorkspace">{{ (item as PositionRecord).branch?.name ?? "—" }}</b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as PositionRecord).id"
                :show-view="canReadPosition"
                :show-edit="canUpdatePosition"
                :show-delete="canDeletePosition"
                view-title="Visualizar"
                edit-title="Editar"
                delete-title="Excluir"
                @view="goView"
                @edit="goEdit"
                @delete="(id) => { const p = positions.find((x) => x.id === id); if (p) confirmDelete(p); }"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>

    <ConfirmDeleteModal
      v-model="deleteModal"
      title="Excluir cargo"
      message="Tem certeza de que deseja excluir este cargo?"
      @confirm="doDelete"
    />
  </component>
</template>
