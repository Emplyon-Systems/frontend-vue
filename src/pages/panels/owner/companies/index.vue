<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import FilterTriggerButton from "@/components/filters/FilterTriggerButton.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import CompaniesFilter from "@/views/panels/owner/companies/Filter.vue";
import { companiesApi } from "@/api/resources";
import type { CompanyRecord } from "@/types/api";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const companies = ref<CompanyRecord[]>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const initialFilters = () => ({
  name: "",
  cnpj: "",
  created_at_from: "",
  created_at_until: "",
  per_page: 15,
});
const filters = ref(initialFilters());
/** Filtros efetivamente aplicados à listagem (atualizados ao clicar em "Aplicar filtros") */
const appliedFilters = ref(initialFilters());
const orderBy = ref("id");
const orderDir = ref<"asc" | "desc">("desc");

const listagemColumns = [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "cnpj", label: "CNPJ", sortable: true, align: "start" as const },
  { key: "email", label: "E-mail", sortable: true, align: "start" as const },
  { key: "phone", label: "Telefone", sortable: true, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
];
const deleteId = ref<number | null>(null);
const deleteModal = ref(false);
const showFilters = ref(false);
/** "Ativo" apenas quando há filtros aplicados (listagem está filtrada) */
const hasActiveFilters = computed(
  () =>
    !!appliedFilters.value.name.trim() ||
    !!appliedFilters.value.cnpj.trim() ||
    !!appliedFilters.value.created_at_from ||
    !!appliedFilters.value.created_at_until
);

const resultLabel = computed(() => {
  const n = pagination.value.total;
  if (n === 0) return "Nenhum resultado";
  if (n === 1) return "1 resultado encontrado";
  return `${n} resultados encontrados`;
});
const canCreate = computed(() => authStore.hasPermission("companies.create"));
const canRead = computed(() => authStore.hasPermission("companies.read"));
const canUpdate = computed(() => authStore.hasPermission("companies.update"));
const canDelete = computed(() => authStore.hasPermission("companies.delete"));

function loadList(page = 1) {
  loading.value = true;
  companiesApi
    .list({
      page,
      per_page: appliedFilters.value.per_page,
      name: appliedFilters.value.name.trim() || undefined,
      cnpj: appliedFilters.value.cnpj.trim() || undefined,
      created_at_from: appliedFilters.value.created_at_from || undefined,
      created_at_until: appliedFilters.value.created_at_until || undefined,
      order_by: orderBy.value,
      order_dir: orderDir.value,
    })
    .then((data) => {
      companies.value = data.companies?.data ?? [];
      pagination.value = {
        current_page: data.companies?.current_page ?? 1,
        per_page: data.companies?.per_page ?? appliedFilters.value.per_page,
        total: data.companies?.total ?? 0,
        last_page: data.companies?.last_page ?? 1,
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

function confirmDelete(company: CompanyRecord) {
  deleteId.value = company.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  companiesApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    notifySuccess("Empresa eliminada com sucesso.");
    loadList(pagination.value.current_page);
  });
}

function goCreate() {
  if (!canCreate.value) return;
  router.push({ name: "owner.companies.create" });
}

function goView(id: number) {
  if (!canRead.value) return;
  router.push({ name: "owner.company.workspace.overview", params: { id: String(id) } });
}

function goEdit(id: number) {
  if (!canUpdate.value) return;
  router.push({ name: "owner.companies.edit", params: { id: String(id) } });
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

onMounted(() => loadList());
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Empresas</h1>
          <p class="text-muted mb-0 small">Listar e criar empresas do sistema.</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <FilterTriggerButton v-model="showFilters" :active="hasActiveFilters" />
          <b-button v-if="canCreate" variant="primary" @click="goCreate">
            <i class="iconoir-plus me-1"></i>
            Nova empresa
          </b-button>
        </div>
      </div>

      <UIComponentCard v-if="showFilters" title="Filtros" class="mb-3">
        <CompaniesFilter
          v-model="filters"
          :active="hasActiveFilters"
          @apply="applyFilters"
          @reset="resetFilters"
        />
      </UIComponentCard>

      <ListagemCard
        :columns="listagemColumns"
        :data="companies"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="hasActiveFilters"
        empty-message="Nenhuma empresa encontrada."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as CompanyRecord).id }}</b-td>
            <b-td>{{ (item as CompanyRecord).name }}</b-td>
            <b-td>{{ (item as CompanyRecord).cnpj }}</b-td>
            <b-td>{{ (item as CompanyRecord).email }}</b-td>
            <b-td>{{ (item as CompanyRecord).phone }}</b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as CompanyRecord).id"
                :show-view="canRead"
                :show-edit="canUpdate"
                :show-delete="canDelete"
                view-title="Visualizar"
                edit-title="Editar"
                delete-title="Eliminar"
                @view="goView"
                @edit="goEdit"
                @delete="(id) => { const c = companies.find((x) => x.id === id); if (c) confirmDelete(c); }"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>

    <ConfirmDeleteModal
      v-model="deleteModal"
      title="Eliminar empresa"
      message="Tem a certeza que deseja eliminar esta empresa?"
      @confirm="doDelete"
    />
  </DefaultLayout>
</template>
