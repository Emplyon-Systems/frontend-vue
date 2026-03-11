<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "@/views/panels/owner/companies/form/DataForm.vue";
import { companiesApi } from "@/api/resources";
import { companyInitialForm, validateCompanyForm, type CompanyFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const loadingCompany = ref(true);
const loadError = ref("");
const form = ref<CompanyFormData>(companyInitialForm());
const errors = ref<Record<string, string>>({});

const companyId = computed(() => {
  const fromContext = Number(authStore.activeContext?.company_id ?? 0);
  if (fromContext > 0) return fromContext;
  const fromCompanies = Number(authStore.user?.companies?.[0]?.id ?? 0);
  if (fromCompanies > 0) return fromCompanies;
  const fromBranches = Number(authStore.user?.branches?.[0]?.company_id ?? 0);
  return fromBranches > 0 ? fromBranches : 0;
});

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
  router.push({ name: "panels.company.dashboard" });
}

function fillFormFromCompany(data: Awaited<ReturnType<typeof companiesApi.getById>>) {
  const company = data.company;
  if (!company) return;
  const base = companyInitialForm();
  const next: CompanyFormData = {
    ...base,
    name: company.name ?? "",
    cnpj: company.cnpj ?? "",
    zip_code: company.zip_code ?? "",
    street: company.street ?? "",
    neighborhood: company.neighborhood ?? "",
    city: company.city ?? "",
    state: company.state ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
  };
  next.street_number = company.street_number ?? "";
  form.value = next;
}

function loadCompany() {
  loadError.value = "";
  loadingCompany.value = true;

  if (!companyId.value) {
    loadError.value = "Empresa não identificada no contexto atual.";
    loadingCompany.value = false;
    return;
  }

  companiesApi
    .getById(companyId.value)
    .then(fillFormFromCompany)
    .catch(() => (loadError.value = "Empresa não encontrada."))
    .finally(() => (loadingCompany.value = false));
}

function submit() {
  errors.value = {};
  const validation = validateCompanyForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  if (!companyId.value) {
    loadError.value = "Empresa não identificada no contexto atual.";
    return;
  }

  loading.value = true;
  companiesApi
    .update(companyId.value, validation.data)
    .then(() => {
      notifySuccess("Empresa atualizada com sucesso.");
      router.push({ name: "panels.company.dashboard" });
    })
    .catch(mapApiErrors)
    .finally(() => (loading.value = false));
}

onMounted(loadCompany);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Minha empresa</h1>
          <p class="text-muted mb-0 small">Atualizar dados da empresa do seu contexto.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingCompany" class="text-muted">A carregar empresa...</div>
      <b-form v-else @submit.prevent="submit">
        <DataForm v-model="form" :errors="errors" mode="edit" @clear-error="clearError">
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
