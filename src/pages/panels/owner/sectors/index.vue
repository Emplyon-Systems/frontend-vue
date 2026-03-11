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

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
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
const isOwnerSectors = computed(() => routeName.value.startsWith("owner."));
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));
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
  ...(isOwnerSectors.value
    ? [{ key: "company", label: "Empresa", sortable: false, align: "start" as const }]
    : []),
  { key: "branch", label: "Filial", sortable: false, align: "start" as const },
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
  if (branchScoped.value && currentBranchId.value > 0) {
    branchOptions.value = [{ id: currentBranchId.value, name: `Filial #${currentBranchId.value}`, company_id: undefined }];
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
  if (branchScoped.value && currentBranchId.value > 0) return [currentBranchId.value];
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
  if (branchScoped.value && currentBranchId.value > 0) {
    filters.value.branch_ids = [currentBranchId.value];
    appliedFilters.value.branch_ids = [currentBranchId.value];
  }
  await loadPlucks();
  loadList();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Setores</h1>
          <p class="text-muted mb-0 small">
            {{ branchScoped ? "Setores da sua filial." : companyScoped ? "Listar e criar setores das filiais da sua empresa." : "Listar e criar setores vinculados às filiais." }}
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
          :show-company-filter="isOwnerSectors"
          :hide-branch-selector="branchScoped"
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
            <b-td v-if="isOwnerSectors">
              {{ companyOptions.find((c) => c.id === (item as SectorRecord).branch?.company_id)?.name ?? "—" }}
            </b-td>
            <b-td>{{ (item as SectorRecord).branch?.name ?? "—" }}</b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as SectorRecord).id"
                :show-view="canRead"
                :show-edit="canUpdate"
                :show-delete="canDelete"
                view-title="Visualizar"
                edit-title="Editar"
                delete-title="Eliminar"
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
      title="Eliminar setor"
      message="Tem a certeza que deseja eliminar este setor?"
      @confirm="doDelete"
    />
  </DefaultLayout>
</template>
