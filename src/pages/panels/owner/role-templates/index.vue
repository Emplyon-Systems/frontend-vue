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
const loading = ref(true);
const templates = ref<RoleTemplateRecord[]>([]);
const editRiskModalOpen = ref(false);
const pendingEditId = ref<number | null>(null);

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

function goCreate() {
  router.push({ name: "owner.role-templates.create" });
}

function isTemplateActive(t: RoleTemplateRecord) {
  return t.is_active !== false;
}

function confirmInactivate(t: RoleTemplateRecord) {
  if (
    !window.confirm(
      `Inativar o template «${t.name}»? Ele deixa de ser usado ao criar novas filiais ou empresas; o registro permanece no banco de dados e pode ser reativado.`
    )
  ) {
    return;
  }
  roleTemplatesApi
    .update(t.id, { is_active: false })
    .then(() => {
      notifySuccess("Template inativado.");
      load();
    })
    .catch((err: unknown) => {
      const e = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.errors?.role_template?.[0];
      notifyError(msg ?? "Não foi possível inativar.");
    });
}

function templateById(id: number) {
  return templates.value.find((x) => x.id === id);
}

function onActionInactivate(id: number) {
  const t = templateById(id);
  if (t) confirmInactivate(t);
}

function onActionReactivate(id: number) {
  const t = templateById(id);
  if (t) confirmReactivate(t);
}

function confirmReactivate(t: RoleTemplateRecord) {
  roleTemplatesApi
    .update(t.id, { is_active: true })
    .then(() => {
      notifySuccess("Template reativado.");
      load();
    })
    .catch((err: unknown) => {
      const e = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.errors?.role_template?.[0];
      notifyError(msg ?? "Não foi possível reativar.");
    });
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
                  :show-delete="canEditTemplate && isTemplateActive(t)"
                  :show-restore="canEditTemplate && !isTemplateActive(t)"
                  view-title="Visualizar"
                  edit-title="Editar"
                  delete-title="Inativar"
                  restore-title="Reativar"
                  @view="goView"
                  @edit="openEditRiskModal"
                  @delete="onActionInactivate"
                  @restore="onActionReactivate"
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
        <div class="d-flex justify-content-end gap-2 w-100">
          <b-button variant="outline-secondary" @click="cancelEditRisk">Cancelar</b-button>
          <b-button variant="primary" @click="confirmEditAfterRisk">Continuar para editar</b-button>
        </div>
      </template>
    </b-modal>
  </DefaultLayout>
</template>
