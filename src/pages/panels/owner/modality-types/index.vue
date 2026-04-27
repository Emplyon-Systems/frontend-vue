<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import FilterTriggerButton from "@/components/filters/FilterTriggerButton.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import ModalityTypesFilter from "@/views/panels/owner/modality-types/Filter.vue";
import type { ModalityTypesFilterModel } from "@/views/panels/owner/modality-types/Filter.vue";
import { modalityTypesApi } from "@/api/resources";
import type { ModalityTypeRecord } from "@/types/api";
import { notifySuccess, notifyError } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { useModulePermissions } from "@/composables/usePermissions";
import { usePanelScope } from "@/composables/usePanelScope";
import { useFilterState } from "@/composables/useFilterState";
import { useListPageState } from "@/composables/useListPageState";
import { useScopePlucks } from "@/composables/useScopePlucks";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { loadBranchOptionsByScope, loadCompanyOptionsByScope } = useScopePlucks();
const modalityTypePermissions = useModulePermissions("modality_types");
const {
  routeName,
  isOwnerWorkspace,
  workspaceCompanyId,
  isCompanyScoped: companyScoped,
  isBranchScoped: branchScoped,
  isCompanyFixed,
  currentBranchId,
} = usePanelScope();
const isOwnerModalityTypes = computed(() => routeName.value.startsWith("owner.") && !routeName.value.startsWith("owner.company.workspace"));
const loading = ref(true);
const modalityTypes = ref<ModalityTypeRecord[]>([]);
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const branchOptions = ref<Array<{ id: number; name: string; company_id?: number; company_name?: string }>>([]);
const { pagination, orderBy, orderDir, resultLabel, setPerPage, setSort } = useListPageState({
  perPage: 15,
  orderBy: "id",
  orderDir: "desc",
});
const initialFilters = (): ModalityTypesFilterModel => ({
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

const listagemColumns = computed(() => [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "slug", label: "Slug", sortable: true, align: "start" as const },
  { key: "is_default", label: "Padrão (domingo)", sortable: false, align: "start" as const },
  ...(isOwnerModalityTypes.value && !isCompanyFixed.value ? [{ key: "company", label: "Empresa", sortable: false, align: "start" as const }] : []),
  ...(branchScoped.value ? [] : [{ key: "branch", label: "Filial", sortable: false, align: "start" as const }]),
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
]);
const deleteId = ref<number | null>(null);
const deleteModal = ref(false);
const defaultToggleBusyId = ref<number | null>(null);
const showFilters = ref(false);
const isSuperadmin = computed(() => authStore.hasRole("superadmin"));
const hasModalityTypesAccess = computed(
  () => isSuperadmin.value || modalityTypePermissions.canList.value || modalityTypePermissions.canRead.value
);
const canCreate = computed(() => isSuperadmin.value || modalityTypePermissions.canCreate.value);
const canRead = computed(() => hasModalityTypesAccess.value || modalityTypePermissions.canRead.value);
const canUpdate = computed(() => hasModalityTypesAccess.value || modalityTypePermissions.canUpdate.value);
const canDelete = computed(() => hasModalityTypesAccess.value || modalityTypePermissions.canDelete.value);

async function loadPlucks() {
  branchOptions.value = await loadBranchOptionsByScope({
    branchScoped: branchScoped.value,
    currentBranchId: currentBranchId.value,
    workspaceCompanyId: workspaceCompanyId.value,
    companyIdFilter: !isOwnerModalityTypes.value ? Number(authStore.activeContext?.company_id ?? 0) : 0,
    includeCompanyName: true,
  });
  if (isOwnerModalityTypes.value) {
    companyOptions.value = await loadCompanyOptionsByScope({
      companyScoped: false,
      scopedCompanyId: 0,
    });
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
  modalityTypesApi
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
      modalityTypes.value = data.modalityTypes?.data ?? [];
      pagination.value = {
        current_page: data.modalityTypes?.current_page ?? 1,
        per_page: data.modalityTypes?.per_page ?? appliedFilters.value.per_page,
        total: data.modalityTypes?.total ?? 0,
        last_page: data.modalityTypes?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

function confirmDelete(modalityType: ModalityTypeRecord) {
  deleteId.value = modalityType.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  modalityTypesApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    notifySuccess("Tipo de modalidade de domingo eliminado com sucesso.");
    loadList(pagination.value.current_page);
  });
}

function routeNameFor(op: "list" | "create" | "view" | "edit"): string {
  if (branchScoped.value) return `branch.modality-types.${op}`;
  if (companyScoped.value) return `company.modality-types.${op}`;
  return `owner.modality-types.${op}`;
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
  setPerPage(value);
  loadList(1);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  setSort({ orderBy: ob, orderDir: od });
  loadList(1);
}

function onToggleDefault(item: ModalityTypeRecord, value: boolean) {
  if (!canUpdate.value) return;
  const id = item.id;
  defaultToggleBusyId.value = id;
  modalityTypesApi
    .update(id, { is_default: value })
    .then(() => {
      notifySuccess(value ? "Definida como padrão (domingo)." : "Já não é a padrão (domingo).");
      loadList(pagination.value.current_page);
    })
    .catch((err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      notifyError(msg || "Não foi possível atualizar o padrão (domingo).");
    })
    .finally(() => {
      defaultToggleBusyId.value = null;
    });
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
          <h1 class="h4 mb-1">Modalidade de domingo</h1>
          <p class="text-muted mb-0 small">
            {{
              branchScoped
                ? "Tipos de modalidade de domingo desta filial."
                : isCompanyFixed
                  ? "Listar e gerir os tipos de modalidade de domingo das filiais desta empresa."
                  : "Listar e criar tipos de modalidade de domingo vinculados às filiais."
            }}
          </p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <FilterTriggerButton v-model="showFilters" :active="hasActiveFilters" />
          <b-button v-if="canCreate" variant="primary" @click="goCreate">
            <i class="iconoir-plus me-1"></i>
            Nova modalidade de domingo
          </b-button>
        </div>
      </div>

      <UIComponentCard v-if="showFilters" title="Filtros" class="mb-3">
        <ModalityTypesFilter
          v-model="filters"
          :active="hasActiveFilters"
          :company-options="companyOptions"
          :branch-options="branchOptions"
          :show-company-filter="isOwnerModalityTypes && !isCompanyFixed"
          :hide-branch-selector="branchScoped"
          @apply="() => { applyFilters(); loadList(1); }"
          @reset="() => { resetFilters(); loadList(1); }"
        />
      </UIComponentCard>

      <ListagemCard
        :columns="listagemColumns"
        :data="modalityTypes"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="hasActiveFilters"
        empty-message="Nenhum tipo de modalidade de domingo encontrado."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as ModalityTypeRecord).id }}</b-td>
            <b-td>{{ (item as ModalityTypeRecord).name }}</b-td>
            <b-td><code>{{ (item as ModalityTypeRecord).slug }}</code></b-td>
            <b-td>
              <b-form-checkbox
                switch
                class="mb-0"
                :model-value="!!(item as ModalityTypeRecord).is_default"
                :disabled="!canUpdate || defaultToggleBusyId === (item as ModalityTypeRecord).id"
                :aria-label="`Padrão (domingo): ${(item as ModalityTypeRecord).name}`"
                @update:model-value="(v: boolean | string) => onToggleDefault(item as ModalityTypeRecord, !!v)"
              />
            </b-td>
            <b-td v-if="isOwnerModalityTypes && !isCompanyFixed">
              {{ companyOptions.find((c) => c.id === (item as ModalityTypeRecord).branch?.company_id)?.name ?? (item as ModalityTypeRecord).branch?.company?.name ?? "—" }}
            </b-td>
            <b-td v-if="!branchScoped">{{ (item as ModalityTypeRecord).branch?.name ?? "—" }}</b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as ModalityTypeRecord).id"
                :show-view="canRead"
                :show-edit="canUpdate"
                :show-delete="canDelete"
                view-title="Visualizar"
                edit-title="Editar"
                delete-title="Excluir"
                @view="goView"
                @edit="goEdit"
                @delete="(id) => { const m = modalityTypes.find((x) => x.id === id); if (m) confirmDelete(m); }"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>

    <ConfirmDeleteModal
      v-model="deleteModal"
      title="Excluir modalidade de domingo"
      message="Tem certeza de que deseja excluir este tipo de modalidade de domingo?"
      @confirm="doDelete"
    />
  </component>
</template>
