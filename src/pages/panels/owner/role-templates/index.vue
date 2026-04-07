<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import { roleTemplatesApi } from "@/api/resources";
import type { RoleTemplateRecord } from "@/types/api";
import { notifyError, notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const canCreateTemplate = computed(
  () => authStore.hasRole("superadmin") || authStore.hasPermission("role_templates.create")
);
/** Ver lista/detalhe (módulo só leitura sem update/create/delete). */
const canViewTemplate = computed(
  () =>
    authStore.hasRole("superadmin") ||
    authStore.hasPermission("role_templates.index") ||
    authStore.hasPermission("role_templates.read")
);
const canEditTemplate = computed(
  () => authStore.hasRole("superadmin") || authStore.hasPermission("role_templates.update")
);
const canDeleteTemplate = computed(
  () => authStore.hasRole("superadmin") || authStore.hasPermission("role_templates.delete")
);
const loading = ref(true);
const templates = ref<RoleTemplateRecord[]>([]);
const editRiskModalOpen = ref(false);
const pendingEditId = ref<number | null>(null);
const deleteRiskModalOpen = ref(false);
const pendingDeleteId = ref<number | null>(null);

function load() {
  loading.value = true;
  roleTemplatesApi
    .list()
    .then((res) => {
      templates.value = res.role_templates ?? [];
    })
    .catch(() => notifyError("Não foi possível carregar os templates."))
    .finally(() => {
      loading.value = false;
    });
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
    <UIComponentCard title="Templates de perfil (empresas e filiais)">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <p class="text-muted mb-0 flex-grow-1">
        Templates de <strong>filial</strong> disparam ao criar uma filial; de <strong>empresa</strong>, ao criar uma
        empresa (ex.: perfil <code>empresa-c{id}</code> para o dono). O slug é sempre
        <code>prefixo + id</code> (filial ou empresa).
        </p>
        <b-button v-if="canCreateTemplate" variant="primary" @click="goCreate">Novo template</b-button>
      </div>

      <div v-if="loading" class="text-muted">Carregando…</div>
      <div v-else class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Escopo</th>
              <th>Chave</th>
              <th>Prefixo slug</th>
              <th>Estado</th>
              <th class="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in templates" :key="t.id">
              <td>{{ t.name }}</td>
              <td>
                <span v-if="t.provision_scope === 'company'" class="badge bg-primary">Empresa</span>
                <span v-else class="badge bg-info text-dark">Filial</span>
              </td>
              <td><code>{{ t.key }}</code></td>
              <td><code>{{ t.slug_prefix }}</code></td>
              <td>
                <span v-if="isTemplateActive(t)" class="badge bg-success">Ativo</span>
                <span v-else class="badge bg-secondary">Inativo</span>
              </td>
              <td class="text-end">
                <TableActionButtons
                  :item-id="t.id"
                  :show-view="canViewTemplate"
                  :show-edit="canEditTemplate"
                  :show-delete="canDeleteTemplate && !t.is_locked"
                  view-title="Visualizar"
                  edit-title="Editar"
                  delete-title="Excluir permanentemente"
                  @view="goView"
                  @edit="openEditRiskModal"
                  @delete="openDeleteRiskModal"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UIComponentCard>

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
          Mudanças nas <strong>permissões</strong> afetam o comportamento de <strong>novos</strong> perfis criados a partir deste modelo (por exemplo ao criar filiais ou empresas), conforme a regra de negócio da sua organização.
        </li>
        <li class="mb-2">
          Perfis <strong>já existentes</strong> nas filiais ou empresas podem <strong>não</strong> ser atualizados automaticamente — pode ser necessário revisar usuários ou perfis manualmente.
        </li>
        <li>
          Permissões em excesso ou em falta podem <strong>expor dados indevidamente</strong> ou <strong>bloquear acessos legítimos</strong> a quem depende desses perfis.
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
      modal-class="role-template-edit-risk-modal"
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
          Perfis <strong>já criados</strong> a partir deste modelo <strong>mantêm-se</strong>, mas deixam de estar associados a este template (a referência é desfeita).
        </li>
        <li class="mb-2">
          Se criar novamente um template com o mesmo nome ou regras, terá de configurar permissões e chaves de novo; não é um «desfazer».
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
  </DefaultLayout>
</template>
