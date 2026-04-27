<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import FilterTriggerButton from "@/components/filters/FilterTriggerButton.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import SectorsFilter from "@/views/panels/owner/sectors/Filter.vue";
import type { SectorsFilterModel } from "@/views/panels/owner/sectors/Filter.vue";
import { sectorsApi, branchesApi } from "@/api/resources";
import type { SectorRecord } from "@/types/api";
import { notifySuccess } from "@/helpers/notify";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { useModulePermissions } from "@/composables/usePermissions";
import { usePanelScope } from "@/composables/usePanelScope";
import { useFilterState } from "@/composables/useFilterState";
import { useListPageState } from "@/composables/useListPageState";
import { useScopePlucks } from "@/composables/useScopePlucks";

const route = useRoute();
const router = useRouter();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { loadBranchOptionsByScope, loadCompanyOptionsByScope } = useScopePlucks();
const sectorPermissions = useModulePermissions("sectors");
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
const sectors = ref<SectorRecord[]>([]);
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const branchOptions = ref<Array<{ id: number; name: string; company_id?: number }>>([]);
const { pagination, orderBy, orderDir, resultLabel, setPerPage, setSort } = useListPageState({
  perPage: 15,
  orderBy: "id",
  orderDir: "desc",
});
const initialFilters = (): SectorsFilterModel => ({
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
const isOwnerSectors = computed(() => routeName.value.startsWith("owner.") && !routeName.value.startsWith("owner.company.workspace"));

const listagemColumns = computed(() => [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "slug", label: "Slug", sortable: true, align: "start" as const },
  { key: "start_time", label: "De", sortable: false, align: "start" as const },
  { key: "end_time", label: "Até", sortable: false, align: "start" as const },
  ...((isOwnerSectors.value && !isCompanyFixed.value)
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
const canCreate = sectorPermissions.canCreate;
const canRead = sectorPermissions.canRead;
const canUpdate = sectorPermissions.canUpdate;
const canDelete = sectorPermissions.canDelete;

async function loadPlucks() {
  if (isCompanyBranchWorkspace.value && companyBranchWsId.value > 0) {
    try {
      const res = await branchesApi.getById(companyBranchWsId.value);
      const nm = res.branch?.name?.trim() || `Filial #${companyBranchWsId.value}`;
      branchOptions.value = [
        {
          id: companyBranchWsId.value,
          name: nm,
          company_id: res.branch?.company_id,
        },
      ];
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
  if (isOwnerSectors.value) {
    companyOptions.value = await loadCompanyOptionsByScope({
      companyScoped: false,
      scopedCompanyId: 0,
    });
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
  sectorsApi
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
      sectors.value = data.sectors?.data ?? [];
      pagination.value = {
        current_page: data.sectors?.current_page ?? 1,
        per_page: data.sectors?.per_page ?? appliedFilters.value.per_page,
        total: data.sectors?.total ?? 0,
        last_page: data.sectors?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

function confirmDelete(sector: SectorRecord) {
  deleteId.value = sector.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  sectorsApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    notifySuccess("Setor eliminado com sucesso.");
    loadList(pagination.value.current_page);
  });
}

function routeNameFor(op: "list" | "create" | "view" | "edit"): string {
  if (branchScoped.value) return `branch.sectors.${op}`;
  if (companyScoped.value) return `company.sectors.${op}`;
  return `owner.sectors.${op}`;
}

function goCreate() {
  if (!canCreate.value) return;
  if (isCompanyBranchWorkspace.value && companyBranchWsId.value > 0) {
    router.push({
      name: "company.sectors.create",
      query: { branch_id: String(companyBranchWsId.value) },
    });
    return;
  }
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
  setPerPage(value);
  loadList(1);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  setSort({ orderBy: ob, orderDir: od });
  loadList(1);
}

function formatTime(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  return raw.slice(0, 5);
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
          <h1 class="h4 mb-1">Setores</h1>
          <p class="text-muted mb-0 small">
            {{
              isCompanyBranchWorkspace
                ? "Setores apenas desta filial."
                : branchScoped
                  ? "Setores da sua filial."
                  : isCompanyFixed
                    ? "Listar e criar setores das filiais desta empresa."
                    : "Listar e criar setores vinculados às filiais."
            }}
          </p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <FilterTriggerButton v-model="showFilters" :active="hasActiveFilters" />
          <b-button v-if="canCreate" variant="primary" @click="goCreate">
            <i class="iconoir-plus me-1"></i>
            Novo setor
          </b-button>
        </div>
      </div>

      <UIComponentCard v-if="showFilters" title="Filtros" class="mb-3">
        <SectorsFilter
          v-model="filters"
          :active="hasActiveFilters"
          :company-options="companyOptions"
          :branch-options="branchOptions"
          :show-company-filter="isOwnerSectors && !isCompanyFixed"
          :hide-branch-selector="branchScoped || isCompanyBranchWorkspace"
          @apply="() => { applyFilters(); loadList(1); }"
          @reset="() => { resetFilters(); loadList(1); }"
        />
      </UIComponentCard>

      <ListagemCard
        :columns="listagemColumns"
        :data="sectors"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="hasActiveFilters"
        empty-message="Nenhum setor encontrado."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as SectorRecord).id }}</b-td>
            <b-td>{{ (item as SectorRecord).name }}</b-td>
            <b-td><code>{{ (item as SectorRecord).slug }}</code></b-td>
            <b-td>{{ formatTime((item as SectorRecord).start_time) }}</b-td>
            <b-td>{{ formatTime((item as SectorRecord).end_time) }}</b-td>
            <b-td v-if="isOwnerSectors && !isCompanyFixed">
              {{ companyOptions.find((c) => c.id === (item as SectorRecord).branch?.company_id)?.name ?? "—" }}
            </b-td>
            <b-td v-if="!branchScoped && !isCompanyBranchWorkspace">{{ (item as SectorRecord).branch?.name ?? "—" }}</b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as SectorRecord).id"
                :show-view="canRead"
                :show-edit="canUpdate"
                :show-delete="canDelete"
                view-title="Visualizar"
                edit-title="Editar"
                delete-title="Excluir"
                @view="goView"
                @edit="goEdit"
                @delete="(id) => { const s = sectors.find((x) => x.id === id); if (s) confirmDelete(s); }"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>

    <ConfirmDeleteModal
      v-model="deleteModal"
      title="Excluir setor"
      message="Tem certeza de que deseja excluir este setor?"
      @confirm="doDelete"
    />
  </component>
</template>
