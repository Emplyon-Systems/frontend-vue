<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import AppAlert from "@/components/AppAlert.vue";
import { permissionsApi, roleTemplatesApi } from "@/api/resources";
import { notifySuccess, notifyError } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useModulePermissions } from "@/composables/usePermissions";
import {
  buildGroupedPermissionModules,
  collectPermissionIdsFromEmployeesSection,
  collectPermissionIdsFromGroup,
  type GroupedPermissionModule,
} from "@/helpers/permissionModuleGroups";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const roleTemplatePermissions = useModulePermissions("role_templates");
const templateId = computed(() => Number(route.params.id));

const canEdit = computed(
  () => authStore.hasRole("superadmin") || roleTemplatePermissions.canUpdate.value
);
/** Lista «Ver» abre com ?view=1: só leitura mesmo com permissão de atualizar. */
const isViewMode = computed(() => {
  const v = route.query.view;
  return v === "1" || v === "true";
});
/** Pode alterar campos e salvar (não é modo «Ver» da listagem). */
const canMutate = computed(() => canEdit.value && !isViewMode.value);

const pageTitle = computed(() => (canMutate.value ? "Editar template de perfil" : "Ver template de perfil"));

const loading = ref(false);
const loadingTemplate = ref(true);
const loadError = ref("");
const name = ref("");
const description = ref("");
const templateKey = ref("");
const slugPrefix = ref("");
const provisionScope = ref("");
const isLocked = ref(true);
/** Incluído no provisionamento automático (gravado ao clicar em Salvar). */
const isActive = ref(true);
const permissionOptions = ref<{ id: number; name: string; slug: string }[]>([]);
const selectedPermissionIds = ref<number[]>([]);
const permissionSearch = ref("");

const groupedPermissions = computed((): GroupedPermissionModule[] =>
  buildGroupedPermissionModules(
    permissionOptions.value,
    selectedPermissionIds.value,
    permissionSearch.value
  )
);

const totalVisible = computed(() =>
  groupedPermissions.value.reduce((s, g) => s + g.total, 0)
);
const totalSelectedVisible = computed(() =>
  groupedPermissions.value.reduce((s, g) => s + g.selected, 0)
);

function isSelected(id: number) {
  return selectedPermissionIds.value.includes(id);
}

function togglePermission(id: number, checked: boolean) {
  if (!canMutate.value) return;
  const s = new Set(selectedPermissionIds.value);
  if (checked) s.add(id);
  else s.delete(id);
  selectedPermissionIds.value = [...s];
}

function toggleModule(moduleName: string, checked: boolean) {
  if (!canMutate.value) return;
  const g = groupedPermissions.value.find((x) => x.moduleName === moduleName);
  if (!g) return;
  const s = new Set(selectedPermissionIds.value);
  const ids = collectPermissionIdsFromGroup(g);
  for (const id of ids) {
    if (checked) s.add(id);
    else s.delete(id);
  }
  selectedPermissionIds.value = [...s];
}

function toggleEmployeesSection(sectionKey: string, checked: boolean) {
  if (!canMutate.value) return;
  const g = groupedPermissions.value.find((x) => x.kind === "employees");
  if (!g || g.kind !== "employees") return;
  const s = new Set(selectedPermissionIds.value);
  const ids = collectPermissionIdsFromEmployeesSection(g, sectionKey);
  for (const id of ids) {
    if (checked) s.add(id);
    else s.delete(id);
  }
  selectedPermissionIds.value = [...s];
}

function toggleAllVisible(checked: boolean) {
  if (!canMutate.value) return;
  const s = new Set(selectedPermissionIds.value);
  for (const g of groupedPermissions.value) {
    const ids = collectPermissionIdsFromGroup(g);
    for (const id of ids) {
      if (checked) s.add(id);
      else s.delete(id);
    }
  }
  selectedPermissionIds.value = [...s];
}

function loadTemplate() {
  loadError.value = "";
  loadingTemplate.value = true;
  return roleTemplatesApi
    .getById(templateId.value)
    .then((res) => {
      const t = res.role_template;
      if (!t) return;
      name.value = t.name ?? "";
      description.value = t.description ?? "";
      templateKey.value = t.key ?? "";
      slugPrefix.value = t.slug_prefix ?? "";
      provisionScope.value = t.provision_scope ?? "";
      isLocked.value = !!t.is_locked;
      isActive.value = t.is_active !== false;
      selectedPermissionIds.value = (t.permissions ?? []).map((p) => p.id);
      if (!canEdit.value || isViewMode.value) {
        permissionOptions.value = (t.permissions ?? []).map((p) => ({
          id: p.id,
          name: p.name ?? "",
          slug: p.slug ?? "",
        }));
      }
    })
    .catch(() => {
      loadError.value = "Template não encontrado.";
    })
    .finally(() => {
      loadingTemplate.value = false;
    });
}

function submit() {
  if (!canMutate.value) return;
  loading.value = true;
  roleTemplatesApi
    .update(templateId.value, {
      name: name.value.trim(),
      description: description.value.trim() || null,
      auto_provision: true,
      is_active: isActive.value,
      permissions: selectedPermissionIds.value,
    })
    .then(() => {
      notifySuccess("Template atualizado.");
      router.push({ name: "owner.role-templates" });
    })
    .catch(() => notifyError("Não foi possível salvar."))
    .finally(() => {
      loading.value = false;
    });
}

function cancel() {
  router.push({ name: "owner.role-templates" });
}

async function initPage() {
  if (canEdit.value && !isViewMode.value) {
    const opts = await permissionsApi.plucks();
    permissionOptions.value = opts;
  } else {
    permissionOptions.value = [];
  }
  await loadTemplate();
}

onMounted(() => {
  void initPage();
});

watch(
  () => [route.params.id, route.query.view] as const,
  () => {
    void initPage();
  }
);
</script>

<template>
  <DefaultLayout>
    <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>

    <UIComponentCard v-else :title="pageTitle">
      <p class="text-muted small mb-3">
        <span v-if="!canMutate" class="badge bg-light text-dark border me-2">Apenas visualização</span>
        Chave: <code>{{ templateKey }}</code> · Prefixo slug: <code>{{ slugPrefix }}</code> · Escopo:
        <code>{{ provisionScope }}</code>
        <span v-if="isLocked" class="ms-2 badge bg-secondary">Sistema</span>
      </p>

      <b-form v-if="!loadingTemplate" @submit.prevent="submit">
        <b-row class="g-3">
          <b-col cols="12" md="6">
            <b-form-group label="Nome exibido no perfil criado" label-for="rt-name">
              <b-form-input id="rt-name" v-model="name" type="text" required :disabled="!canMutate" />
            </b-form-group>
          </b-col>
          <b-col cols="12" md="6">
            <b-form-group label="Status" label-for="rt-active">
              <template v-if="canMutate">
                <b-form-checkbox
                  id="rt-active"
                  v-model="isActive"
                  switch
                  :disabled="!canMutate"
                >
                  <span v-if="isActive">Ativo — entra no provisionamento ao criar filiais ou empresas</span>
                  <span v-else>Inativo — não entra no provisionamento automático</span>
                </b-form-checkbox>
                <small class="text-muted d-block mt-1">O status só é gravado quando clicar em Salvar.</small>
                <small v-if="isLocked" class="text-muted d-block mt-1">
                  Template do sistema: inativar só interrompe novos perfis automáticos; o registro e a chave permanecem.
                </small>
              </template>
              <template v-else>
                <span class="badge" :class="isActive ? 'bg-success' : 'bg-secondary'">
                  {{ isActive ? "Ativo" : "Inativo" }}
                </span>
              </template>
            </b-form-group>
          </b-col>
          <b-col cols="12">
            <b-form-group label="Descrição (use {branch_name} para o nome da filial)" label-for="rt-desc">
              <b-form-textarea id="rt-desc" v-model="description" rows="2" :disabled="!canMutate" />
            </b-form-group>
          </b-col>
        </b-row>

        <h6 class="mt-4 mb-2">Permissões copiadas para o perfil na filial</h6>
        <div class="d-flex align-items-center justify-content-between mb-2">
          <b-form-input
            v-model="permissionSearch"
            type="text"
            placeholder="Pesquisar permissões..."
            style="max-width: 360px;"
            :disabled="!canMutate"
          />
          <b-form-checkbox
            v-if="canMutate"
            :model-value="totalVisible > 0 && totalSelectedVisible === totalVisible"
            @update:model-value="toggleAllVisible(Boolean($event))"
          >
            Selecionar todas visíveis
          </b-form-checkbox>
        </div>

        <div v-if="groupedPermissions.length" class="border rounded mb-4">
          <details
            v-for="group in groupedPermissions"
            :key="group.moduleName"
            :open="group.selected > 0"
            class="border-bottom"
          >
            <summary class="d-flex align-items-center justify-content-between px-3 py-2 cursor-pointer">
              <strong>{{ group.moduleLabel }}</strong>
              <span class="badge bg-light text-dark border">{{ group.selected }}/{{ group.total }}</span>
            </summary>
            <div class="px-3 pb-3">
              <template v-if="group.kind === 'employees'">
                <b-form-checkbox
                  v-if="canMutate"
                  class="mb-3"
                  :model-value="group.selected > 0 && group.selected === group.total"
                  @update:model-value="toggleModule('employees', Boolean($event))"
                >
                  Marcar todo o bloco Funcionários
                </b-form-checkbox>
                <div
                  v-for="section in group.sections"
                  :key="section.sectionKey"
                  class="border rounded p-3 mb-3 bg-light bg-opacity-50"
                >
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <span class="fw-semibold text-body">{{ section.sectionLabel }}</span>
                    <span class="badge bg-white text-dark border small"
                      >{{ section.selected }}/{{ section.total }}</span
                    >
                  </div>
                  <b-form-checkbox
                    v-if="canMutate"
                    class="mb-2"
                    :model-value="section.total > 0 && section.selected === section.total"
                    @update:model-value="toggleEmployeesSection(section.sectionKey, Boolean($event))"
                  >
                    Marcar {{ section.sectionLabel.toLowerCase() }}
                  </b-form-checkbox>
                  <b-row>
                    <b-col
                      v-for="opt in section.options"
                      :key="opt.id"
                      cols="12"
                      md="6"
                      lg="4"
                      class="mb-1"
                    >
                      <b-form-checkbox
                        :model-value="isSelected(opt.id)"
                        :disabled="!canMutate"
                        @update:model-value="togglePermission(opt.id, Boolean($event))"
                      >
                        {{ opt.label }}
                      </b-form-checkbox>
                    </b-col>
                  </b-row>
                </div>
              </template>
              <template v-else>
                <b-form-checkbox
                  v-if="canMutate"
                  class="mb-2"
                  :model-value="group.selected > 0 && group.selected === group.total"
                  @update:model-value="toggleModule(group.moduleName, Boolean($event))"
                >
                  Marcar todo o módulo
                </b-form-checkbox>
                <b-row>
                  <b-col
                    v-for="opt in group.options"
                    :key="opt.id"
                    cols="12"
                    md="6"
                    lg="4"
                    class="mb-1"
                  >
                    <b-form-checkbox
                      :model-value="isSelected(opt.id)"
                      :disabled="!canMutate"
                      @update:model-value="togglePermission(opt.id, Boolean($event))"
                    >
                      {{ opt.label }}
                    </b-form-checkbox>
                  </b-col>
                </b-row>
              </template>
            </div>
          </details>
        </div>

        <div class="d-flex gap-2">
          <b-button v-if="canMutate" type="submit" variant="primary" :disabled="loading">
            {{ loading ? "Salvando…" : "Salvar" }}
          </b-button>
          <b-button type="button" variant="outline-secondary" @click="cancel">
            {{ canMutate ? "Cancelar" : "Voltar" }}
          </b-button>
        </div>
      </b-form>
    </UIComponentCard>
  </DefaultLayout>
</template>
