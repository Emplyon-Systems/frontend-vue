<script setup lang="ts">
import { onMounted, ref } from "vue";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "./form/DataForm.vue";
import { branchesApi, companiesApi } from "@/api/resources";
import { branchInitialForm, validateBranchForm, type BranchFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const companyScoped = computed(() => String(route.name ?? "").startsWith("company."));
const scopedCompanyId = computed(() => (companyScoped.value ? Number(authStore.user?.companies?.[0]?.id ?? 0) : 0));
const loading = ref(false);
const form = ref<BranchFormData>(branchInitialForm());
const errors = ref<Record<string, string>>({});
const companyOptions = ref<Array<{ id: number; name: string }>>([]);

function mapApiErrors(err: { response?: { data?: { errors?: Record<string, string[]> } } }) {
  const data = err.response?.data?.errors;
  if (!data) return;
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) map[k] = Array.isArray(v) ? v[0] : String(v);
  errors.value = map;
}

function clearError(field: string) {
  if (!errors.value[field]) return;
  delete errors.value[field];
}

function cancel() {
  router.push({ name: companyScoped.value ? "company.branches" : "owner.branches" });
}

function submit() {
  errors.value = {};
  const validation = validateBranchForm(form.value, "create");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  branchesApi
    .create(validation.data as branchesApi.BranchCreatePayload)
    .then(() => {
      notifySuccess("Filial criada com sucesso.");
      router.push({ name: companyScoped.value ? "company.branches" : "owner.branches" });
    })
    .catch(mapApiErrors)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  if (companyScoped.value && scopedCompanyId.value > 0) {
    form.value.company_id = scopedCompanyId.value;
  }

  if (companyScoped.value && scopedCompanyId.value > 0) {
    const companyName = authStore.user?.companies?.[0]?.name ?? "Minha empresa";
    companyOptions.value = [{ id: scopedCompanyId.value, name: companyName }];
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
