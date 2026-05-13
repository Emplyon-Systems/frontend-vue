<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import AppAlert from "@/components/AppAlert.vue";
import { modalityTypeTemplatesApi } from "@/api/resources";
import { notifySuccess, notifyError } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useModulePermissions } from "@/composables/usePermissions";
import type { ModalityTypeTemplateRecord } from "@/types/api";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const tplPerms = useModulePermissions("modality_type_templates");

const templateId = computed(() => Number(route.params.id));

const canEditTemplate = computed(
  () => authStore.hasRole("superadmin") || tplPerms.canUpdate.value,
);
const isViewMode = computed(() => {
  const v = route.query.view;
  return v === "1" || v === "true";
});
const canMutateTemplate = computed(() => canEditTemplate.value && !isViewMode.value);

const pageTitle = computed(() =>
  canMutateTemplate.value
    ? "Editar template de modalidade de domingo"
    : "Ver template de modalidade de domingo",
);

const loading = ref(false);
const loadingTpl = ref(true);
const loadError = ref("");

const templateRow = ref<ModalityTypeTemplateRecord | null>(null);
const name = ref("");
const description = ref("");
const provisionScope = ref<"branch" | "company">("branch");
const isLocked = ref(false);
const isActive = ref(true);
const keyDisplay = ref("");

async function loadTemplate() {
  loadError.value = "";
  loadingTpl.value = true;
  try {
    const res = await modalityTypeTemplatesApi.getById(templateId.value);
    const t = res.modalityTypeTemplate ?? null;
    templateRow.value = t;
    if (!t) {
      loadError.value = "Template não encontrado.";
      return;
    }
    name.value = t.name ?? "";
    description.value = t.description ?? "";
    keyDisplay.value = t.key ?? "";
    provisionScope.value = (t.provision_scope as "branch" | "company") || "branch";
    isLocked.value = !!t.is_locked;
    isActive.value = t.is_active !== false;
  } catch {
    loadError.value = "Template não encontrado.";
  } finally {
    loadingTpl.value = false;
  }
}

function submitTemplate() {
  if (!canMutateTemplate.value) return;
  loading.value = true;
  modalityTypeTemplatesApi
    .update(templateId.value, {
      name: name.value.trim(),
      description: description.value.trim() || null,
      provision_scope: isLocked.value ? undefined : provisionScope.value,
      is_active: isActive.value,
    })
    .then(() => {
      notifySuccess("Template atualizado.");
      router.push({ name: "owner.modality-type-templates" });
    })
    .catch(() => notifyError("Não foi possível guardar o template."))
    .finally(() => {
      loading.value = false;
    });
}

function cancel() {
  router.push({ name: "owner.modality-type-templates" });
}

onMounted(() => {
  void loadTemplate();
});

watch(
  () => [route.params.id, route.query.view] as const,
  () => {
    void loadTemplate();
  },
);
</script>

<template>
  <DefaultLayout>
    <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>

    <UIComponentCard v-else :title="pageTitle">
      <p class="text-muted small mb-3">
        <span v-if="!canMutateTemplate" class="badge bg-light text-dark border me-2">Apenas visualização</span>
        <template v-if="templateRow && keyDisplay">
          Chave: <code>{{ keyDisplay }}</code>
        </template>
        <span v-if="isLocked" class="ms-2 badge bg-secondary">Bloqueado (sistema)</span>
      </p>

      <p v-if="loadingTpl" class="text-muted">Carregando…</p>

      <b-form v-else @submit.prevent="submitTemplate">
        <b-row class="g-3">
          <b-col cols="12">
            <b-form-group label="Nome" label-for="mtt-edit-name">
              <b-form-input
                id="mtt-edit-name"
                v-model="name"
                type="text"
                required
                :disabled="!canMutateTemplate"
              />
            </b-form-group>
          </b-col>
          <b-col cols="12" md="6">
            <b-form-group label="Aplica-se a" label-for="mtt-edit-scope">
              <b-form-radio-group
                id="mtt-edit-scope"
                v-model="provisionScope"
                stacked
                :disabled="!canMutateTemplate || isLocked"
                class="mb-0"
              >
                <b-form-radio value="branch">Filial (repete em cada nova filial)</b-form-radio>
                <b-form-radio value="company">Empresa (repete em cada nova empresa)</b-form-radio>
              </b-form-radio-group>
            </b-form-group>
          </b-col>
          <b-col cols="12" md="6">
            <b-form-group label="Status" label-for="mtt-edit-active">
              <template v-if="canMutateTemplate">
                <b-form-checkbox id="mtt-edit-active" v-model="isActive" switch>
                  <span v-if="isActive">Ativo — entra no provisionamento ao criar filiais ou empresas</span>
                  <span v-else>Inativo — não entra no provisionamento automático</span>
                </b-form-checkbox>
                <small class="text-muted d-block mt-1">O status só é gravado ao clicar em Guardar.</small>
              </template>
              <template v-else>
                <span class="badge" :class="isActive ? 'bg-success' : 'bg-secondary'">
                  {{ isActive ? "Ativo" : "Inativo" }}
                </span>
              </template>
            </b-form-group>
          </b-col>
          <b-col cols="12">
            <b-form-group label="Descrição" label-for="mtt-edit-desc">
              <b-form-textarea id="mtt-edit-desc" v-model="description" rows="2" :disabled="!canMutateTemplate" />
              <small class="text-muted">Opcional.</small>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <b-button type="button" variant="outline-secondary" @click="cancel">
            {{ canMutateTemplate ? "Cancelar" : "Voltar" }}
          </b-button>
          <b-button v-if="canMutateTemplate" type="submit" variant="primary" :disabled="loading">
            {{ loading ? "A guardar…" : "Guardar template" }}
          </b-button>
        </div>
      </b-form>
    </UIComponentCard>
  </DefaultLayout>
</template>
