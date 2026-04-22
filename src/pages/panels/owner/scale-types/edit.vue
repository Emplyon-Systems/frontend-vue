<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "@/views/panels/owner/scale-types/form/DataForm.vue";
import { scaleTypesApi } from "@/api/resources";
import { scaleTypeInitialForm, validateScaleTypeForm, type ScaleTypeFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { usePanelScope } from "@/composables/usePanelScope";
import { useScopePlucks } from "@/composables/useScopePlucks";

const route = useRoute();
const router = useRouter();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { loadBranchOptionsByScope } = useScopePlucks();
const scaleTypeId = computed(() => Number(route.params.id));
const { isCompanyScoped: companyScoped, isBranchScoped: branchScoped, currentBranchId } = usePanelScope();

function scaleTypesListRoute() {
  return branchScoped.value
    ? "branch.scale-types"
    : companyScoped.value
      ? "company.scale-types"
      : "owner.scale-types";
}

const loading = ref(false);
const loadingScaleType = ref(true);
const loadError = ref("");
const form = ref<ScaleTypeFormData>(scaleTypeInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);

function cancel() {
  router.push({ name: scaleTypesListRoute() });
}

function fillFormFromScaleType(data: Awaited<ReturnType<typeof scaleTypesApi.getById>>) {
  const st = data.scaleType;
  if (!st) return;
  form.value = {
    branch_id: st.branch_id ?? 0,
    name: st.name ?? "",
  };
}

function loadScaleType() {
  loadError.value = "";
  loadingScaleType.value = true;

  if (Number.isNaN(scaleTypeId.value)) {
    loadError.value = "Tipo de escala inválido.";
    loadingScaleType.value = false;
    return;
  }

  scaleTypesApi
    .getById(scaleTypeId.value)
    .then(fillFormFromScaleType)
    .catch(() => (loadError.value = "Tipo de escala não encontrado."))
    .finally(() => (loadingScaleType.value = false));
}

function submit() {
  resetErrors();
  const validation = validateScaleTypeForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  scaleTypesApi
    .update(scaleTypeId.value, validation.data)
    .then(() => {
      notifySuccess("Tipo de escala atualizado com sucesso.");
      router.push({ name: scaleTypesListRoute() });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  branchOptions.value = await loadBranchOptionsByScope({
    branchScoped: branchScoped.value,
    currentBranchId: currentBranchId.value,
    includeCompanyName: true,
  });
  loadScaleType();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar tipo de escala</h1>
          <p class="text-muted mb-0 small">Atualizar dados do tipo de escala.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingScaleType" class="text-muted">Carregando tipo de escala...</div>
      <b-form v-else @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :branch-options="branchOptions"
          :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null"
          mode="edit"
          @clear-error="clearError"
        >
          <template #actions>
            <b-button type="submit" variant="primary" :disabled="loading">
              {{ loading ? "Salvando..." : "Salvar" }}
            </b-button>
            <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
          </template>
        </DataForm>
      </b-form>
    </div>
  </component>
</template>
