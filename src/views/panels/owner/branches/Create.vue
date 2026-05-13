<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "./form/DataForm.vue";
import { branchesApi, companiesApi } from "@/api/resources";
import type { BranchCreatePayload } from "@/api/resources/branches";
import {
  branchInitialForm,
  validateBranchForm,
  type BranchFormData,
} from "@/core/schemas";
import { notifySuccess, notifyError } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();

/** Contexto workspace do superadmin: ?company_id=X na query */
const workspaceCompanyId = computed(() => {
  const id = Number(route.query.company_id ?? 0);
  return id > 0 ? id : 0;
});
const isWorkspaceContext = computed(() => workspaceCompanyId.value > 0);

/** Contexto painel da própria empresa */
const companyScoped = computed(() => String(route.name ?? "").startsWith("company."));
const scopedCompanyId = computed(() => (companyScoped.value ? Number(authStore.user?.companies?.[0]?.id ?? 0) : 0));

/** ID de empresa travado (workspace ou company-scoped) */
const lockCompanyId = computed<number | null>(() => {
  if (isWorkspaceContext.value) return workspaceCompanyId.value;
  if (companyScoped.value && scopedCompanyId.value > 0) return scopedCompanyId.value;
  return null;
});

const loading = ref(false);
const form = ref<BranchFormData>(branchInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  toastFieldPriority: ["branch", "company_id", "general"],
});
const companyOptions = ref<Array<{ id: number; name: string }>>([]);

function cancel() {
  if (isWorkspaceContext.value) {
    router.push({ name: "owner.company.workspace.branches", params: { id: String(workspaceCompanyId.value) } });
    return;
  }
  router.push({ name: companyScoped.value ? "company.branches" : "owner.branches" });
}

function submit() {
  resetErrors();
  const validation = validateBranchForm(form.value, "create");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  branchesApi
    .create(validation.data as BranchCreatePayload)
    .then(() => {
      notifySuccess("Filial criada com sucesso.");
      cancel();
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  /** Workspace do superadmin: empresa fixa via query param */
  if (isWorkspaceContext.value) {
    form.value.company_id = workspaceCompanyId.value;
    try {
      const res = await companiesApi.getById(workspaceCompanyId.value);
      const c = res.company;
      companyOptions.value = [{ id: workspaceCompanyId.value, name: c?.name ?? `Empresa #${workspaceCompanyId.value}` }];
      const used = c?.branches_used ?? c?.branches?.length ?? 0;
      const limit = c?.branch_limit ?? 0;
      if (limit > 0 && used >= limit) {
        notifyError("Limite de filiais atingido.");
        cancel();
      }
    } catch {
      companyOptions.value = [{ id: workspaceCompanyId.value, name: `Empresa #${workspaceCompanyId.value}` }];
    }
    return;
  }

  /** Painel da própria empresa */
  if (companyScoped.value && scopedCompanyId.value > 0) {
    form.value.company_id = scopedCompanyId.value;
    const companyName = authStore.user?.companies?.[0]?.name ?? "Minha empresa";
    companyOptions.value = [{ id: scopedCompanyId.value, name: companyName }];
    try {
      const res = await companiesApi.getById(scopedCompanyId.value);
      const c = res.company;
      const used = c?.branches_used ?? c?.branches?.length ?? 0;
      const limit = c?.branch_limit ?? 0;
      if (limit > 0 && used >= limit) {
        notifyError("Limite de filiais atingido.");
        router.replace({ name: "company.branches" });
      }
    } catch {
      /* guard de rota e API validam na mesma */
    }
    return;
  }

  /** Superadmin sem contexto fixo: escolha livre */
  const companies = await companiesApi.plucks();
  companyOptions.value = companies
    .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Nova filial</h1>
          <p class="text-muted mb-0 small">Criar filial vinculada obrigatoriamente a uma empresa.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <b-form @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :company-options="companyOptions"
          :lock-company-id="lockCompanyId"
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
