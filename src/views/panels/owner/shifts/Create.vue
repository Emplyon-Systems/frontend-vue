<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "./form/DataForm.vue";
import { shiftsApi, branchesApi } from "@/api/resources";
import { shiftInitialForm, validateShiftForm, type ShiftFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
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

function submit() {
  resetErrors();
  const validation = validateShiftForm(form.value, "create");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  shiftsApi
    .create(validation.data)
    .then(() => {
      notifySuccess("Turno criado com sucesso.");
      router.push({ name: shiftsListRoute() });
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
  let allBranches = (branches as { id: number; name?: string; company_id?: number; company_name?: string }[])
    .map((b) => ({
      id: b.id,
      name: b.name ?? `Filial #${b.id}`,
      company_name: (b as { company_name?: string }).company_name ?? "",
    }));
  if (companyScoped.value) {
    const companyId = Number(authStore.activeContext?.company_id ?? 0);
    if (companyId > 0) {
      allBranches = allBranches.filter(
        (b) => (branches as { id: number; company_id?: number }[]).find((x) => x.id === b.id)?.company_id === companyId
      );
    }
  }
  branchOptions.value = allBranches.sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Novo turno</h1>
          <p class="text-muted mb-0 small">
            {{
              branchScoped
                ? "Criar turno nesta filial. O slug é gerado automaticamente."
                : "Criar turno vinculado a uma filial."
            }}
          </p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="Object.keys(errors).length" variant="danger" class="mb-3">
        {{ Object.values(errors)[0] ?? "Corrija os erros antes de continuar." }}
      </AppAlert>
      <b-form @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :branch-options="branchOptions"
          :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null"
          mode="create"
          @clear-error="clearError"
        >
          <template #actions>
            <b-button type="submit" variant="primary" :disabled="loading">
              {{ loading ? "A guardar..." : "Guardar" }}
            </b-button>
            <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
          </template>
        </DataForm>
      </b-form>
    </div>
  </DefaultLayout>
</template>
