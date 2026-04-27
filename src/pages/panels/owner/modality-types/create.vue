<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "@/views/panels/owner/modality-types/form/DataForm.vue";
import { modalityTypesApi, branchesApi } from "@/api/resources";
import { modalityTypeInitialForm, validateModalityTypeForm, type ModalityTypeFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const routeName = computed(() => String(route.name ?? ""));
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));
const currentBranchId = computed(() => {
  if (!branchScoped.value) return 0;
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.id ?? 0);
});
const loading = ref(false);
const form = ref<ModalityTypeFormData>(modalityTypeInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);

function modalityTypesListRoute() {
  return branchScoped.value
    ? "branch.modality-types"
    : companyScoped.value
      ? "company.modality-types"
      : "owner.modality-types";
}

function cancel() {
  router.push({ name: modalityTypesListRoute() });
}

function submit() {
  resetErrors();
  const validation = validateModalityTypeForm(form.value, "create");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  const payload = { ...validation.data };

  modalityTypesApi
    .create(payload)
    .then(() => {
      notifySuccess("Modalidade de domingo criada com sucesso.");
      router.push({ name: modalityTypesListRoute() });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  if (branchScoped.value && currentBranchId.value > 0) {
    let branchName =
      authStore.activeContext?.branch_id === currentBranchId.value
        ? authStore.activeContext?.branch_name
        : authStore.user?.branches?.find((b) => b.id === currentBranchId.value)?.name;
    if (!branchName) {
      try {
        const res = await branchesApi.getById(currentBranchId.value);
        branchName = res.branch?.name ?? `Filial #${currentBranchId.value}`;
      } catch {
        branchName = `Filial #${currentBranchId.value}`;
      }
    }
    branchOptions.value = [
      {
        id: currentBranchId.value,
        name: branchName ?? `Filial #${currentBranchId.value}`,
        company_name: "",
      },
    ];
    form.value.branch_id = currentBranchId.value;
    return;
  }
  const branches = await branchesApi.plucks();
  branchOptions.value = (
    branches as { id: number; name?: string; company_name?: string }[]
  )
    .map((b) => ({
      id: b.id,
      name: b.name ?? `Filial #${b.id}`,
      company_name: (b as { company_name?: string }).company_name ?? "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Nova modalidade de domingo</h1>
          <p class="text-muted mb-0 small">
            {{
              branchScoped
                ? "Criar um tipo de modalidade de domingo nesta filial. O slug é gerado automaticamente."
                : "Criar um tipo de modalidade de domingo vinculado a uma filial. O slug é gerado automaticamente."
            }}
          </p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <b-form @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :branch-options="branchOptions"
          :show-branch-company-name="!companyScoped && !branchScoped"
          :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null"
          mode="create"
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
