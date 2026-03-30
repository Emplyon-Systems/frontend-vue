<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "./form/DataForm.vue";
import { branchesApi, companiesApi } from "@/api/resources";
import type { BranchCreatePayload } from "@/api/resources/branches";
import {
  branchInitialForm,
  validateBranchForm,
  type BranchFormData,
  type BranchUserLimitQuota,
} from "@/core/schemas";
import { notifySuccess, notifyError } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const companyScoped = computed(() => String(route.name ?? "").startsWith("company."));
const scopedCompanyId = computed(() => (companyScoped.value ? Number(authStore.user?.companies?.[0]?.id ?? 0) : 0));
const loading = ref(false);
const form = ref<BranchFormData>(branchInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  toastFieldPriority: ["company_id", "general"],
});
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const branchQuota = ref<BranchUserLimitQuota | null>(null);

function cancel() {
  router.push({ name: companyScoped.value ? "company.branches" : "owner.branches" });
}

async function refreshBranchQuota(companyId: number) {
  if (!companyId) {
    branchQuota.value = null;
    return;
  }
  try {
    const [companyRes, branchesRes] = await Promise.all([
      companiesApi.getById(companyId),
      branchesApi.list({ company_id: companyId, per_page: 500, order_by: "id", order_dir: "asc" }),
    ]);
    const cap = companyRes.company?.user_limit ?? 0;
    const used = Number(companyRes.company?.users_used ?? 0);
    const rows = branchesRes.branches?.data ?? [];
    const sum = rows.reduce((s, b) => s + (Number(b.user_limit) || 0), 0);
    branchQuota.value = {
      companyCap: cap,
      sumOtherBranches: sum,
      companyUsersUsed: used,
      usersOnThisBranch: 0,
    };
  } catch {
    branchQuota.value = null;
  }
}

watch(
  () => form.value.company_id,
  (id) => {
    void refreshBranchQuota(Number(id));
  },
  { immediate: true }
);

function submit() {
  resetErrors();
  const validation = validateBranchForm(form.value, "create", branchQuota.value);
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  branchesApi
    .create(validation.data as BranchCreatePayload)
    .then(() => {
      notifySuccess("Filial criada com sucesso.");
      router.push({ name: companyScoped.value ? "company.branches" : "owner.branches" });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  if (companyScoped.value && scopedCompanyId.value > 0) {
    form.value.company_id = scopedCompanyId.value;
  }

  if (companyScoped.value && scopedCompanyId.value > 0) {
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
        return;
      }
    } catch {
      /* guard de rota e API validam na mesma */
    }
    return;
  }

  const companies = await companiesApi.plucks();
  companyOptions.value = companies
    .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
  <DefaultLayout>
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
          :lock-company-id="companyScoped ? scopedCompanyId : null"
          :branch-quota="branchQuota"
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
