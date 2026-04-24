<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "./form/DataForm.vue";
import { positionsApi, branchesApi } from "@/api/resources";
import { positionInitialForm, validatePositionForm, type PositionFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { usePanelScope } from "@/composables/usePanelScope";

const route = useRoute();
const router = useRouter();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const positionId = computed(() => Number(route.params.id));
const { isCompanyScoped: companyScoped, isBranchScoped: branchScoped, currentBranchId } = usePanelScope();

function positionsListRoute() {
  return branchScoped.value ? "branch.positions" : companyScoped.value ? "company.positions" : "owner.positions";
}

const loading = ref(false);
const loadingPosition = ref(true);
const loadError = ref("");
const form = ref<PositionFormData>(positionInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});
const branchOptions = ref<Array<{ id: number; name: string }>>([]);

function cancel() {
  router.push({ name: positionsListRoute() });
}

function fillFormFromPosition(data: Awaited<ReturnType<typeof positionsApi.getById>>) {
  const position = data.position;
  if (!position) return;
  form.value = {
    branch_id: position.branch_id ?? 0,
    name: position.name ?? "",
  };
}

function loadPosition() {
  loadError.value = "";
  loadingPosition.value = true;

  if (Number.isNaN(positionId.value)) {
    loadError.value = "Cargo inválido.";
    loadingPosition.value = false;
    return;
  }

  positionsApi
    .getById(positionId.value)
    .then(fillFormFromPosition)
    .catch(() => (loadError.value = "Cargo não encontrado."))
    .finally(() => (loadingPosition.value = false));
}

function submit() {
  resetErrors();
  const validation = validatePositionForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  positionsApi
    .update(positionId.value, validation.data)
    .then(() => {
      notifySuccess("Cargo atualizado com sucesso.");
      router.push({ name: positionsListRoute() });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  const branches = await branchesApi.plucks();
  branchOptions.value = (branches as { id: number; name?: string }[])
    .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  loadPosition();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar cargo</h1>
          <p class="text-muted mb-0 small">Atualizar dados do cargo.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingPosition" class="text-muted">Carregando cargo...</div>
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
