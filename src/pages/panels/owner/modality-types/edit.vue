<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "@/views/panels/owner/modality-types/form/DataForm.vue";
import { modalityTypesApi } from "@/api/resources";
import { modalityTypeInitialForm, validateModalityTypeForm, type ModalityTypeFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { usePanelScope } from "@/composables/usePanelScope";
import { useScopePlucks } from "@/composables/useScopePlucks";

const route = useRoute();
const router = useRouter();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { loadBranchOptionsByScope } = useScopePlucks();
const modalityTypeId = computed(() => Number(route.params.id));
const { isCompanyScoped: companyScoped, isBranchScoped: branchScoped, currentBranchId } = usePanelScope();

function routeNameFor(op: "list" | "create" | "view" | "edit"): string {
  if (branchScoped.value) {
    return op === "list" ? "branch.modality-types" : `branch.modality-types.${op}`;
  }
  if (companyScoped.value) {
    return op === "list" ? "company.modality-types" : `company.modality-types.${op}`;
  }
  return op === "list" ? "owner.modality-types" : `owner.modality-types.${op}`;
}

function modalityTypesListRoute() {
  return routeNameFor("list");
}

const loading = ref(false);
const loadingModalityType = ref(true);
const loadError = ref("");
const form = ref<ModalityTypeFormData>(modalityTypeInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);

function cancel() {
  router.push({ name: modalityTypesListRoute() });
}

function fillFormFromModalityType(data: Awaited<ReturnType<typeof modalityTypesApi.getById>>) {
  const mt = data.modalityType;
  if (!mt) return;
  form.value = {
    branch_id: mt.branch_id ?? 0,
    name: mt.name ?? "",
  };
}

function loadModalityType() {
  loadError.value = "";
  loadingModalityType.value = true;

  if (Number.isNaN(modalityTypeId.value)) {
    loadError.value = "Registo de modalidade de domingo inválido.";
    loadingModalityType.value = false;
    return;
  }

  modalityTypesApi
    .getById(modalityTypeId.value)
    .then((data) => {
      const mt = data.modalityType;
      if (mt?.modality_type_template_id != null) {
        router.replace({ name: routeNameFor("view"), params: { id: String(modalityTypeId.value) } });
        return;
      }
      fillFormFromModalityType(data);
    })
    .catch(() => (loadError.value = "Modalidade de domingo não encontrada."))
    .finally(() => (loadingModalityType.value = false));
}

function submit() {
  resetErrors();
  const validation = validateModalityTypeForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  const payload = { ...validation.data };

  modalityTypesApi
    .update(modalityTypeId.value, payload)
    .then(() => {
      notifySuccess("Modalidade de domingo atualizada com sucesso.");
      router.push({ name: modalityTypesListRoute() });
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
  loadModalityType();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar modalidade de domingo</h1>
          <p class="text-muted mb-0 small">Atualizar dados do tipo de modalidade de domingo.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingModalityType" class="text-muted">A carregar modalidade de domingo…</div>
      <b-form v-else @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :branch-options="branchOptions"
          :show-branch-company-name="!companyScoped && !branchScoped"
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
