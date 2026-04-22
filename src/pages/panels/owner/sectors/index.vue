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
import { sectorsApi, branchesApi, companiesApi } from "@/api/resources";
import type { SectorRecord } from "@/types/api";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const loading = ref(true);
const sectors = ref<SectorRecord[]>([]);
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const branchOptions = ref<Array<{ id: number; name: string; company_id?: number }>>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const initialFilters = (): SectorsFilterModel => ({
  name: "",
  company_ids: [] as number[],
  branch_ids: [] as number[],
  created_at_from: "",
  created_at_until: "",
  per_page: 15,
});
const filters = ref<SectorsFilterModel>(initialFilters());
const appliedFilters = ref<SectorsFilterModel>(initialFilters());
const orderBy = ref("id");
const orderDir = ref<"asc" | "desc">("desc");
const routeName = computed(() => String(route.name ?? ""));
const isCompanyBranchWorkspace = computed(() => routeName.value.startsWith("company.branch."));
const companyBranchWsId = computed(() =>
  isCompanyBranchWorkspace.value ? Number(route.params.id ?? 0) : 0,
);
const isOwnerSectors = computed(() => routeName.value.startsWith("owner.") && !routeName.value.startsWith("owner.company.workspace"));
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

const listagemColumns = computed(() => [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "slug", label: "Slug", sortable: true, align: "start" as const },
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
const canCreate = computed(() => authStore.hasPermission("sectors.create"));
const canRead = computed(() => authStore.hasPermission("sectors.read"));
const canUpdate = computed(() => authStore.hasPermission("sectors.update"));
const canDelete = computed(() => authStore.hasPermission("sectors.delete"));

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
  if (isOwnerSectors.value) {
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

function applyFilters() {
  appliedFilters.value = { ...filters.value };
  loadList(1);
}

function resetFilters() {
  filters.value = initialFilters();
  appliedFilters.value = initialFilters();
  loadList(1);
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
  pagination.value.per_page = value;
  loadList(1);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  orderBy.value = ob;
  orderDir.value = od;
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
          @apply="applyFilters"
          @reset="resetFilters"
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
            <b-td v-if="isOwnerSectors && !isCompanyFixed">
              {{ companyOptions.find((c) => c.id === (item as SectorRecord).branch?.company_id)?.name ?? "—" }}
            </b-td>
            <b-td v-if="!branchScoped">{{ (item as SectorRecord).branch?.name ?? "—" }}</b-td>
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
