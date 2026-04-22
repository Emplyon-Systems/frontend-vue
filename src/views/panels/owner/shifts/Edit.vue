<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "./form/DataForm.vue";
import { shiftsApi } from "@/api/resources";
import { shiftInitialForm, validateShiftForm, type ShiftFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { usePanelScope } from "@/composables/usePanelScope";
import { useScopePlucks } from "@/composables/useScopePlucks";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { loadBranchOptionsByScope } = useScopePlucks();
const { isCompanyScoped: companyScoped, isBranchScoped: branchScoped, currentBranchId } = usePanelScope();
const shiftId = computed(() => Number(route.params.id));
const loading = ref(false);
const loadingShift = ref(true);
const loadError = ref("");
const form = ref<ShiftFormData>(shiftInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);

function shiftsListRoute() {
  return branchScoped.value ? "branch.shifts" : companyScoped.value ? "company.shifts" : "owner.shifts";
}

function cancel() {
  router.push({ name: shiftsListRoute() });
}

function toHhMm(v: string): string {
  const m = String(v ?? "").trim().match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "08:00";
}

function fillFormFromShift(data: Awaited<ReturnType<typeof shiftsApi.getById>>) {
  const shift = data.shift;
  if (!shift) return;
  form.value = {
    branch_id: shift.branch_id ?? 0,
    name: shift.name ?? "",
    slug: shift.slug ?? "",
    start_time: toHhMm(shift.start_time ?? "08:00"),
    end_time: toHhMm(shift.end_time ?? "17:00"),
  };
}

function loadShift() {
  loadError.value = "";
  loadingShift.value = true;

  if (Number.isNaN(shiftId.value)) {
    loadError.value = "Turno inválido.";
    loadingShift.value = false;
    return;
  }

  shiftsApi
    .getById(shiftId.value)
    .then(fillFormFromShift)
    .catch(() => (loadError.value = "Turno não encontrado."))
    .finally(() => (loadingShift.value = false));
}

function submit() {
  resetErrors();
  const validation = validateShiftForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  shiftsApi
    .update(shiftId.value, validation.data)
    .then(() => {
      notifySuccess("Turno atualizado com sucesso.");
      router.push({ name: shiftsListRoute() });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  branchOptions.value = await loadBranchOptionsByScope({
    branchScoped: branchScoped.value,
    currentBranchId: currentBranchId.value,
    companyIdFilter: companyScoped.value ? Number(authStore.activeContext?.company_id ?? 0) : 0,
    includeCompanyName: true,
  });
  loadShift();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar turno</h1>
          <p class="text-muted mb-0 small">Atualizar dados do turno.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingShift" class="text-muted">Carregando turno...</div>
      <template v-else>
        <AppAlert v-if="Object.keys(errors).length" variant="danger" class="mb-3">
          {{ Object.values(errors)[0] ?? "Corrija os erros antes de continuar." }}
        </AppAlert>
        <b-form @submit.prevent="submit">
        <DataForm v-model="form" :errors="errors" :branch-options="branchOptions" :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null" mode="edit" @clear-error="clearError">
          <template #actions>
            <b-button type="submit" variant="primary" :disabled="loading">
              {{ loading ? "Salvando..." : "Salvar" }}
            </b-button>
            <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
          </template>
        </DataForm>
      </b-form>
      </template>
    </div>
  </component>
</template>
