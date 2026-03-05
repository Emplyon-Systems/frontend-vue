<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import FilterTriggerButton from "@/components/filters/FilterTriggerButton.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import UsersFilter from "@/views/panels/owner/users/Filter.vue";
import { usersApi } from "@/api/resources";
import type { UserRecord } from "@/types/api";
import { notifySuccess } from "@/helpers/notify";

const router = useRouter();
const loading = ref(true);
const users = ref<UserRecord[]>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const initialFilters = () => ({
  search: "",
  role_id: "",
  company_ids: [] as string[],
  created_at_from: "",
  created_at_until: "",
});
const filters = ref(initialFilters());
/** Filtros efetivamente aplicados (atualizados ao clicar em "Aplicar filtros") */
const appliedFilters = ref(initialFilters());
const orderBy = ref("id");
const orderDir = ref<"asc" | "desc">("desc");
const deleteId = ref<number | null>(null);
const deleteModal = ref(false);
const showFilters = ref(false);
const roleOptions = ref<{ value: string; text: string }[]>([]);
const companyOptions = ref<{ value: string; text: string }[]>([]);
const hasActiveFilters = computed(
  () =>
    !!appliedFilters.value.search.trim() ||
    !!appliedFilters.value.role_id ||
    (appliedFilters.value.company_ids?.length ?? 0) > 0 ||
    !!appliedFilters.value.created_at_from ||
    !!appliedFilters.value.created_at_until
);

const listagemColumns = [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "email", label: "E-mail", sortable: true, align: "start" as const },
  { key: "company", label: "Empresa", sortable: false, align: "start" as const },
  { key: "roles", label: "Perfis", sortable: false, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
];

const resultLabel = computed(() => {
  const n = pagination.value.total;
  if (n === 0) return "Nenhum resultado";
  if (n === 1) return "1 resultado encontrado";
  return `${n} resultados encontrados`;
});

function loadList(page = 1) {
  loading.value = true;
  usersApi
    .list({
      page,
      per_page: pagination.value.per_page,
      search: appliedFilters.value.search.trim() || undefined,
      role_id: appliedFilters.value.role_id ? Number(appliedFilters.value.role_id) : undefined,
      company_ids: (appliedFilters.value.company_ids ?? []).length
        ? appliedFilters.value.company_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id))
        : undefined,
      created_at_from: appliedFilters.value.created_at_from || undefined,
      created_at_until: appliedFilters.value.created_at_until || undefined,
      order_by: orderBy.value,
      order_dir: orderDir.value,
    })
    .then((data) => {
      users.value = data.users?.data ?? [];
      pagination.value = {
        current_page: data.users?.current_page ?? 1,
        per_page: data.users?.per_page ?? 15,
        total: data.users?.total ?? 0,
        last_page: data.users?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

function loadPlucks() {
  usersApi.plucks().then((plucks) => {
    roleOptions.value = (plucks.roles ?? []).map((role) => ({
      value: String(role.id),
      text: role.name || `Perfil #${role.id}`,
    }));

    companyOptions.value = (plucks.companies ?? []).map((company) => ({
      value: String(company.id),
      text: company.name || `Empresa #${company.id}`,
    }));
  });
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

function onPerPageChange(value: number) {
  pagination.value.per_page = value;
  loadList(1);
}

function onSortChange({ orderBy: ob, orderDir: od }: { orderBy: string; orderDir: "asc" | "desc" }) {
  orderBy.value = ob;
  orderDir.value = od;
  loadList(1);
}

function confirmDelete(user: UserRecord) {
  deleteId.value = user.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  usersApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    notifySuccess("Utilizador eliminado com sucesso.");
    loadList(pagination.value.current_page);
  });
}

function goCreate() {
  router.push({ name: "owner.users.create" });
}

function goView(id: number) {
  router.push({ name: "owner.users.view", params: { id: String(id) } });
}

function goEdit(id: number) {
  router.push({ name: "owner.users.edit", params: { id: String(id) } });
}

function companiesForDisplay(user: UserRecord) {
  const directCompanies = (user.companies ?? []).map((company) => ({
    id: company.id,
    name: company.name || `Empresa #${company.id}`,
  }));
  const fromBranches = (user.branches ?? [])
    .map((branch) => branch.company)
    .filter((company): company is NonNullable<typeof company> => Boolean(company))
    .map((company) => ({
      id: company.id,
      name: company.name || `Empresa #${company.id}`,
    }));

  const unique = new Map<number, { id: number; name: string }>();
  for (const company of [...directCompanies, ...fromBranches]) {
    if (!unique.has(company.id)) unique.set(company.id, company);
  }

  return Array.from(unique.values());
}

onMounted(() => {
  loadPlucks();
  loadList();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Usuários</h1>
          <p class="text-muted mb-0 small">Listar, criar e editar usuários do sistema.</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <FilterTriggerButton v-model="showFilters" :active="hasActiveFilters" label="Filtros" />
          <b-button variant="primary" @click="goCreate">
            <i class="iconoir-plus me-1"></i>
            Novo utilizador
          </b-button>
        </div>
      </div>

      <UIComponentCard v-if="showFilters" title="Filtros" class="mb-3">
        <UsersFilter
          v-model="filters"
          :active="hasActiveFilters"
          :role-options="roleOptions"
          :company-options="companyOptions"
          @apply="applyFilters"
          @reset="resetFilters"
        />
      </UIComponentCard>

      <ListagemCard
        :columns="listagemColumns"
        :data="users"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="hasActiveFilters"
        empty-message="Nenhum utilizador encontrado."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as UserRecord).id }}</b-td>
            <b-td>{{ (item as UserRecord).name }}</b-td>
            <b-td>{{ (item as UserRecord).email }}</b-td>
            <b-td>
              <span v-if="companiesForDisplay(item as UserRecord).length">
                <b-badge
                  v-for="company in companiesForDisplay(item as UserRecord)"
                  :key="company.id"
                  variant="light"
                  class="text-dark me-1"
                >
                  {{ company.name }}
                </b-badge>
              </span>
              <span v-else class="text-muted">—</span>
            </b-td>
            <b-td>
              <span v-if="(item as UserRecord).roles?.length">
                <b-badge
                  v-for="r in (item as UserRecord).roles"
                  :key="r.id"
                  variant="light"
                  class="text-dark me-1"
                >
                  {{ r.name }}
                </b-badge>
              </span>
              <span v-else class="text-muted">—</span>
            </b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as UserRecord).id"
                view-title="Ver"
                edit-title="Editar"
                delete-title="Eliminar"
                @view="goView"
                @edit="goEdit"
                @delete="(id) => { const user = users.find((x) => x.id === id); if (user) confirmDelete(user); }"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>
    </div>

    <ConfirmDeleteModal
      v-model="deleteModal"
      title="Eliminar utilizador"
      message="Tem a certeza que deseja eliminar este utilizador?"
      @confirm="doDelete"
    />
  </DefaultLayout>
</template>
