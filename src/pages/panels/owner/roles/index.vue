<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
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

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const roles = ref<RoleRecord[]>([]);
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const branchOptions = ref<Array<{ id: number; company_id?: number; name: string }>>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const initialFilters = () => ({
  search: "",
  company_ids: [] as number[],
  branch_ids: [] as number[],
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
const hasActiveFilters = computed(
  () =>
    !!appliedFilters.value.search.trim() ||
    (appliedFilters.value.company_ids?.length ?? 0) > 0 ||
    (appliedFilters.value.branch_ids?.length ?? 0) > 0 ||
    !!appliedFilters.value.created_at_from ||
    !!appliedFilters.value.created_at_until
);
const isSuperadmin = computed(() => authStore.hasRole("superadmin"));
/** Empresa pode editar perfis das suas filiais (incl. Gerente de Filial). */
const isCompanyContext = computed(
  () => !!authStore.activeContext?.company_id && authStore.activeContext?.branch_id == null
);
const isBranchContext = computed(
  () => !!authStore.activeContext?.company_id && authStore.activeContext?.branch_id != null
);
/** Utilizador tem opção de contexto empresa (pode editar Gerente Filial mesmo em filial). */
const hasCompanyLevelAccess = computed(() =>
  authStore.getContextOptions().some((o) => o.branch_id == null)
);
const showCompanyFilter = computed(() => isSuperadmin.value);
const showBranchFilter = computed(() => isSuperadmin.value || isCompanyContext.value);
const filteredBranchOptions = computed(() => {
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

const resultLabel = computed(() => {
  const n = pagination.value.total;
  if (n === 0) return "Nenhum resultado";
  if (n === 1) return "1 resultado encontrado";
  return `${n} resultados encontrados`;
});

function loadList(page = 1) {
  loading.value = true;
  rolesApi
    .list({
      page,
      per_page: pagination.value.per_page,
      search: appliedFilters.value.search.trim() || undefined,
      company_ids: showCompanyFilter.value && (appliedFilters.value.company_ids?.length ?? 0)
        ? appliedFilters.value.company_ids
        : undefined,
      branch_ids:
        showBranchFilter.value &&
        (appliedFilters.value.branch_ids?.length ?? 0)
          ? appliedFilters.value.branch_ids
          : undefined,
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
      const msg = err.response?.data?.errors?.role?.[0] ?? "Não foi possível eliminar o perfil.";
      notifyError(msg);
    });
}

function goCreate() {
  router.push({ name: "owner.roles.form", params: { id: "new" } });
}

function goEdit(id: number) {
  router.push({ name: "owner.roles.form", params: { id: String(id) } });
}

/** Perfil criado automaticamente pela filial (filial-b{id}). Só a empresa (contexto empresa) ou owner/superadmin pode editar. */
function isSystemBranchRole(role: RoleRecord): boolean {
  return (role.slug ?? "").startsWith("filial-b");
}
function canEditRole(role: RoleRecord): boolean {
  if (!isSystemBranchRole(role)) return true;
  return isSuperadmin.value || isCompanyContext.value || hasCompanyLevelAccess.value;
}

onMounted(() => loadList());

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
          <FilterTriggerButton v-model="showFilters" :active="hasActiveFilters" label="Filtros" />
          <b-button variant="primary" @click="goCreate">
            <i class="iconoir-plus me-1"></i>
            Novo perfil
          </b-button>
        </div>
      </div>

      <UIComponentCard v-if="showFilters" title="Filtros" class="mb-3">
        <RolesFilter
          v-model="filters"
          :show-tenant-filters="showCompanyFilter || showBranchFilter"
          :show-company-filter="showCompanyFilter"
          :show-branch-filter="showBranchFilter"
          :company-options="companyOptions"
          :branch-options="filteredBranchOptions"
          @apply="applyFilters"
          @reset="resetFilters"
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
              <span v-if="(item as RoleRecord).permissions?.length">
                <b-badge
                  v-for="p in (item as RoleRecord).permissions"
                  :key="p.id"
                  variant="info"
                  class="me-1"
                >
                  {{ p.slug }}
                </b-badge>
              </span>
              <span v-else class="text-muted">—</span>
            </b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as RoleRecord).id"
                :show-view="false"
                :show-edit="canEditRole(item as RoleRecord)"
                :show-delete="canEditRole(item as RoleRecord)"
                edit-title="Editar"
                delete-title="Eliminar"
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
      title="Eliminar perfil"
      message="Tem a certeza que deseja eliminar este perfil?"
      @confirm="doDelete"
    />
  </DefaultLayout>
</template>
