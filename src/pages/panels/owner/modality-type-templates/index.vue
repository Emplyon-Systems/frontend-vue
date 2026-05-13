<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import ListagemCard from "@/components/ListagemCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import { modalityTypeTemplatesApi } from "@/api/resources";
import type { ModalityTypeTemplateRecord } from "@/types/api";
import { notifyError, notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useModulePermissions } from "@/composables/usePermissions";
import { useListPageState } from "@/composables/useListPageState";

const router = useRouter();
const authStore = useAuthStore();
const templatePerms = useModulePermissions("modality_type_templates");

const canCreateTemplate = computed(
  () => authStore.hasRole("superadmin") || templatePerms.canCreate.value,
);
const canViewTemplate = computed(
  () =>
    authStore.hasRole("superadmin") ||
    templatePerms.canList.value ||
    templatePerms.canRead.value,
);
const canEditTemplate = computed(
  () => authStore.hasRole("superadmin") || templatePerms.canUpdate.value,
);
const canDeleteTemplate = computed(
  () => authStore.hasRole("superadmin") || templatePerms.canDelete.value,
);

const loading = ref(true);
const templates = ref<ModalityTypeTemplateRecord[]>([]);
const { pagination, orderBy, orderDir, resultLabel, setPerPage, setSort } = useListPageState({
  perPage: 15,
  orderBy: "sort_order",
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
  { key: "is_active", label: "Estado", sortable: true, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
]);

function loadList(page = 1) {
  loading.value = true;
  modalityTypeTemplatesApi
    .list({
      page,
      per_page: pagination.value.per_page,
      order_by: orderBy.value,
      order_dir: orderDir.value,
    })
    .then((res) => {
      const p = res.modalityTypeTemplates;
      templates.value = p?.data ?? [];
      pagination.value = {
        current_page: p?.current_page ?? 1,
        per_page: p?.per_page ?? pagination.value.per_page,
        total: p?.total ?? 0,
        last_page: p?.last_page ?? 1,
      };
    })
    .catch(() => notifyError("Não foi possível carregar os templates."))
    .finally(() => {
      loading.value = false;
    });
}

function onPerPageChange(value: number) {
  setPerPage(value);
  loadList(1);
}

function onSortChange(next: { orderBy: string; orderDir: "asc" | "desc" }) {
  setSort(next);
  loadList(1);
}

function goView(id: number) {
  router.push({
    name: "owner.modality-type-templates.edit",
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
      name: "owner.modality-type-templates.edit",
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
  modalityTypeTemplatesApi
    .remove(id)
    .then(() => {
      notifySuccess("Template eliminado permanentemente.");
      loadList(pagination.value.current_page);
    })
    .catch((err: unknown) => {
      const e = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.errors?.modalityTypeTemplate?.[0];
      notifyError(msg ?? "Não foi possível excluir.");
    });
}

function cancelDeleteRisk() {
  deleteRiskModalOpen.value = false;
  pendingDeleteId.value = null;
}

function goCreate() {
  router.push({ name: "owner.modality-type-templates.create" });
}

function isTemplateActive(t: ModalityTypeTemplateRecord) {
  return t.is_active !== false;
}

onMounted(() => loadList(1));
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Templates de modalidades de domingo</h1>
          <p class="text-muted mb-0 small">
            Templates de <strong>filial</strong> disparam ao criar uma filial; de <strong>empresa</strong>, ao criar uma empresa.
            A chave é gerada automaticamente a partir do nome.
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
        :data="templates"
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
        @update:page="loadList"
      >
        <template #row="{ item }">
          <b-tr>
            <b-td>{{ (item as ModalityTypeTemplateRecord).id }}</b-td>
            <b-td>{{ (item as ModalityTypeTemplateRecord).name }}</b-td>
            <b-td>
              <span v-if="(item as ModalityTypeTemplateRecord).provision_scope === 'company'" class="badge bg-primary"
                >Empresa</span
              >
              <span v-else class="badge bg-info text-dark">Filial</span>
            </b-td>
            <b-td><code>{{ (item as ModalityTypeTemplateRecord).key }}</code></b-td>
            <b-td>
              <span v-if="isTemplateActive(item as ModalityTypeTemplateRecord)" class="badge bg-success">Ativo</span>
              <span v-else class="badge bg-secondary">Inativo</span>
            </b-td>
            <b-td class="text-end">
              <TableActionButtons
                :item-id="(item as ModalityTypeTemplateRecord).id"
                :show-view="canViewTemplate"
                :show-edit="canEditTemplate"
                :show-delete="canDeleteTemplate && !(item as ModalityTypeTemplateRecord).is_locked"
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
        title="Editar template de modalidade de domingo"
        modal-class="modality-template-edit-risk-modal"
        header-class="border-bottom"
        body-class="pt-3"
        centered
        @update:model-value="(v: boolean) => { if (!v) cancelEditRisk(); }"
      >
        <p class="fw-semibold text-body mb-2">
          Você está prestes a alterar um template que define modalidades copiadas para filiais ou empresas automaticamente.
        </p>
        <ul class="small text-muted mb-0 ps-3">
          <li class="mb-2">
            Mudanças afetam o comportamento de <strong>novas</strong> filiais ou empresas criadas a partir deste modelo, conforme a regra de negócio da sua organização.
          </li>
          <li>
            Modalidades <strong>já existentes</strong> nas filiais podem <strong>não</strong> ser atualizadas automaticamente — pode ser necessário revisar manualmente.
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
        title="Excluir template de modalidade de domingo"
        modal-class="modality-template-delete-risk-modal"
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
            Modalidades <strong>já criadas</strong> nas filiais a partir deste modelo <strong>mantêm-se</strong>, mas deixam de estar associadas a este template.
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
