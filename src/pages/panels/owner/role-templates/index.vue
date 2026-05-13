<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import { roleTemplatesApi } from "@/api/resources";
import type { RoleTemplateRecord } from "@/types/api";
import { notifyError, notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useModulePermissions } from "@/composables/usePermissions";
import { useListPageState } from "@/composables/useListPageState";

const router = useRouter();
const authStore = useAuthStore();
const roleTemplatePermissions = useModulePermissions("role_templates");

const canCreateTemplate = computed(
  () => authStore.hasRole("superadmin") || roleTemplatePermissions.canCreate.value,
);
const canViewTemplate = computed(
  () =>
    authStore.hasRole("superadmin") ||
    roleTemplatePermissions.canList.value ||
    roleTemplatePermissions.canRead.value,
);
const canEditTemplate = computed(
  () => authStore.hasRole("superadmin") || roleTemplatePermissions.canUpdate.value,
);
const canDeleteTemplate = computed(
  () => authStore.hasRole("superadmin") || roleTemplatePermissions.canDelete.value,
);

const loading = ref(true);
const allTemplates = ref<RoleTemplateRecord[]>([]);
const { pagination, orderBy, orderDir, resultLabel, setPerPage, setSort } = useListPageState({
  perPage: 15,
  orderBy: "id",
  orderDir: "desc",
});

const editRiskModalOpen = ref(false);
const pendingEditId = ref<number | null>(null);
const deleteRiskModalOpen = ref(false);
const pendingDeleteId = ref<number | null>(null);

const listagemColumns = computed(() => [
  { key: "id", label: "ID", sortable: true, align: "start" as const },
  { key: "name", label: "Nome", sortable: true, align: "start" as const },
  { key: "provision_scope", label: "Escopo", sortable: true, align: "start" as const },
  { key: "key", label: "Chave", sortable: true, align: "start" as const },
  { key: "slug_prefix", label: "Prefixo slug", sortable: true, align: "start" as const },
  { key: "is_active", label: "Estado", sortable: true, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
]);

const sortedTemplates = computed(() => {
  const rows = [...allTemplates.value];
  const key = orderBy.value;
  const dir = orderDir.value === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "id":
        cmp = a.id - b.id;
        break;
      case "name":
        cmp = (a.name ?? "").localeCompare(b.name ?? "", "pt");
        break;
      case "provision_scope":
        cmp = (a.provision_scope ?? "").localeCompare(b.provision_scope ?? "", "pt");
        break;
      case "key":
        cmp = (a.key ?? "").localeCompare(b.key ?? "", "pt");
        break;
      case "slug_prefix":
        cmp = (a.slug_prefix ?? "").localeCompare(b.slug_prefix ?? "", "pt");
        break;
      case "is_active": {
        const av = a.is_active !== false ? 1 : 0;
        const bv = b.is_active !== false ? 1 : 0;
        cmp = av - bv;
        break;
      }
      default:
        cmp = a.id - b.id;
    }
    if (cmp !== 0) return cmp * dir;
    return (b.id - a.id) * dir;
  });
  return rows;
});

const pagedTemplates = computed(() => {
  const sorted = sortedTemplates.value;
  const total = sorted.length;
  const per = pagination.value.per_page;
  const last = Math.max(1, Math.ceil(total / per) || 1);
  const page = Math.min(pagination.value.current_page, last);
  const start = (page - 1) * per;
  return sorted.slice(start, start + per);
});

watch(
  [sortedTemplates, () => pagination.value.per_page, () => pagination.value.current_page],
  () => {
    const total = sortedTemplates.value.length;
    const per = pagination.value.per_page;
    const last = Math.max(1, Math.ceil(total / per) || 1);
    pagination.value.total = total;
    pagination.value.last_page = last;
    if (pagination.value.current_page > last) {
      pagination.value.current_page = last;
    }
  },
  { immediate: true },
);

function load() {
  loading.value = true;
  roleTemplatesApi
    .list()
    .then((res) => {
      allTemplates.value = res.role_templates ?? [];
    })
    .catch(() => notifyError("Não foi possível carregar os templates."))
    .finally(() => {
      loading.value = false;
    });
}

function onPerPageChange(value: number) {
  setPerPage(value);
  pagination.value.current_page = 1;
}

function onSortChange(next: { orderBy: string; orderDir: "asc" | "desc" }) {
  setSort(next);
  pagination.value.current_page = 1;
}

function goView(id: number) {
  router.push({
    name: "owner.role-templates.edit",
    params: { id: String(id) },
    query: { view: "1" },
  });
}

function openEditRiskModal(id: number) {
  pendingEditId.value = id;
  editRiskModalOpen.value = true;
}

function confirmEditAfterRisk() {
  const id = pendingEditId.value;
  editRiskModalOpen.value = false;
  pendingEditId.value = null;
  if (id != null) {
    router.push({
      name: "owner.role-templates.edit",
      params: { id: String(id) },
      query: {},
    });
  }
}

function cancelEditRisk() {
  editRiskModalOpen.value = false;
  pendingEditId.value = null;
}

function openDeleteRiskModal(id: number) {
  pendingDeleteId.value = id;
  deleteRiskModalOpen.value = true;
}

function confirmDeleteAfterRisk() {
  const id = pendingDeleteId.value;
  deleteRiskModalOpen.value = false;
  pendingDeleteId.value = null;
  if (id == null) return;
  roleTemplatesApi
    .remove(id)
    .then(() => {
      notifySuccess("Template eliminado permanentemente.");
      load();
    })
    .catch((err: unknown) => {
      const e = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.errors?.role_template?.[0];
      notifyError(msg ?? "Não foi possível excluir.");
    });
}

function cancelDeleteRisk() {
  deleteRiskModalOpen.value = false;
  pendingDeleteId.value = null;
}

function goCreate() {
  router.push({ name: "owner.role-templates.create" });
}

function isTemplateActive(t: RoleTemplateRecord) {
  return t.is_active !== false;
}

onMounted(load);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Templates de perfil</h1>
          <p class="text-muted mb-0 small">
            Templates de <strong>filial</strong> disparam ao criar uma filial; de <strong>empresa</strong>, ao criar uma empresa.
          </p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <b-button v-if="canCreateTemplate" variant="primary" @click="goCreate">
            <i class="iconoir-plus me-1" />
            Novo template
          </b-button>
        </div>
      </div>

      <ListagemCard
        :columns="listagemColumns"
        :data="pagedTemplates"
        :loading="loading"
        :pagination="pagination"
        :per-page-options="[10, 15, 25, 50, 100]"
        :order-by="orderBy"
        :order-dir="orderDir"
        :result-label="resultLabel"
        :has-active-filters="false"
        empty-message="Nenhum template encontrado."
        result-badge-class="result-badge-default"
        @update:per-page="onPerPageChange"
        @update:sort="onSortChange"
        @update:page="(p) => { pagination.current_page = p; }"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as RoleTemplateRecord).id }}</b-td>
            <b-td>{{ (item as RoleTemplateRecord).name }}</b-td>
            <b-td>
              <span v-if="(item as RoleTemplateRecord).provision_scope === 'company'" class="badge bg-primary"
                >Empresa</span
              >
              <span v-else class="badge bg-info text-dark">Filial</span>
            </b-td>
            <b-td><code>{{ (item as RoleTemplateRecord).key }}</code></b-td>
            <b-td><code>{{ (item as RoleTemplateRecord).slug_prefix }}</code></b-td>
            <b-td>
              <span v-if="isTemplateActive(item as RoleTemplateRecord)" class="badge bg-success">Ativo</span>
              <span v-else class="badge bg-secondary">Inativo</span>
            </b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as RoleTemplateRecord).id"
                :show-view="canViewTemplate"
                :show-edit="canEditTemplate"
                :show-delete="canDeleteTemplate && !(item as RoleTemplateRecord).is_locked"
                view-title="Visualizar"
                edit-title="Editar"
                delete-title="Excluir permanentemente"
                @view="goView"
                @edit="openEditRiskModal"
                @delete="openDeleteRiskModal"
              />
            </b-td>
          </b-tr>
        </template>
      </ListagemCard>

      <b-modal
        :model-value="editRiskModalOpen"
        title="Editar template de perfil"
        modal-class="role-template-edit-risk-modal"
        header-class="border-bottom"
        body-class="pt-3"
        centered
        @update:model-value="(v: boolean) => { if (!v) cancelEditRisk(); }"
      >
        <p class="fw-semibold text-body mb-2">
          Você está prestes a alterar um template que define permissões copiadas para perfis automáticos.
        </p>
        <ul class="small text-muted mb-0 ps-3">
          <li class="mb-2">
            Mudanças nas <strong>permissões</strong> afetam o comportamento de <strong>novos</strong> perfis criados a partir deste modelo, conforme a regra de negócio da sua organização.
          </li>
          <li class="mb-2">
            Perfis <strong>já existentes</strong> nas filiais ou empresas podem <strong>não</strong> ser atualizados automaticamente — pode ser necessário revisar manualmente.
          </li>
          <li>
            Permissões em excesso ou em falta podem <strong>expor dados indevidamente</strong> ou <strong>bloquear acessos legítimos</strong>.
          </li>
        </ul>
        <template #footer>
          <div class="d-flex justify-content-start gap-2 w-100">
            <b-button variant="primary" @click="confirmEditAfterRisk">Continuar para editar</b-button>
            <b-button variant="outline-secondary" @click="cancelEditRisk">Cancelar</b-button>
          </div>
        </template>
      </b-modal>

      <b-modal
        :model-value="deleteRiskModalOpen"
        title="Excluir template de perfil"
        modal-class="role-template-delete-risk-modal"
        header-class="border-bottom"
        body-class="pt-3"
        centered
        @update:model-value="(v: boolean) => { if (!v) cancelDeleteRisk(); }"
      >
        <p class="fw-semibold text-body mb-2">
          Esta ação remove o registro do template na base de dados. Não é possível recuperar.
        </p>
        <ul class="small text-muted mb-0 ps-3">
          <li class="mb-2">
            Perfis <strong>já criados</strong> a partir deste modelo <strong>mantêm-se</strong>, mas deixam de estar associados a este template.
          </li>
          <li>
            Só elimine se tiver a certeza de que este modelo já não é necessário para a sua organização.
          </li>
        </ul>
        <template #footer>
          <div class="d-flex justify-content-start gap-2 w-100">
            <b-button variant="outline-secondary" @click="cancelDeleteRisk">Cancelar</b-button>
            <b-button variant="danger" @click="confirmDeleteAfterRisk">Excluir permanentemente</b-button>
          </div>
        </template>
      </b-modal>
    </div>
  </DefaultLayout>
</template>
