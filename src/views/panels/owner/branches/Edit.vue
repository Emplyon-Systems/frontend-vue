<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "./form/DataForm.vue";
import { branchesApi, companiesApi } from "@/api/resources";
import { branchInitialForm, validateBranchForm, type BranchFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const branchId = computed(() => Number(route.params.id));
const companyScoped = computed(() => String(route.name ?? "").startsWith("company."));
const scopedCompanyId = computed(() => (companyScoped.value ? Number(authStore.user?.companies?.[0]?.id ?? 0) : 0));

const loading = ref(false);
const loadingBranch = ref(true);
const loadError = ref("");
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

function fillFormFromBranch(data: Awaited<ReturnType<typeof branchesApi.getById>>) {
  const branch = data.branch;
  if (!branch) return;
  form.value = {
    company_id: branch.company_id ?? 0,
    name: branch.name ?? "",
    cnpj: branch.cnpj ?? "",
    zip_code: branch.zip_code ?? "",
    street: branch.street ?? "",
    street_number: branch.street_number ?? "",
    neighborhood: branch.neighborhood ?? "",
    city: branch.city ?? "",
    state: branch.state ?? "",
  };
}

function loadBranch() {
  loadError.value = "";
  loadingBranch.value = true;

  if (Number.isNaN(branchId.value)) {
    loadError.value = "Filial inválida.";
    loadingBranch.value = false;
    return;
  }

  branchesApi
    .getById(branchId.value)
    .then(fillFormFromBranch)
    .catch(() => (loadError.value = "Filial não encontrada."))
    .finally(() => (loadingBranch.value = false));
}

function submit() {
  errors.value = {};
  const validation = validateBranchForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  branchesApi
    .update(branchId.value, validation.data)
    .then(() => {
      notifySuccess("Filial atualizada com sucesso.");
      router.push({ name: companyScoped.value ? "company.branches" : "owner.branches" });
    })
    .catch(mapApiErrors)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  if (companyScoped.value && scopedCompanyId.value > 0) {
    const companyName = authStore.user?.companies?.[0]?.name ?? "Minha empresa";
    companyOptions.value = [{ id: scopedCompanyId.value, name: companyName }];
  } else {
    const companies = await companiesApi.plucks();
    companyOptions.value = companies
      .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  loadBranch();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar filial</h1>
          <p class="text-muted mb-0 small">Atualizar dados da filial.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingBranch" class="text-muted">A carregar filial...</div>
      <b-form v-else @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :company-options="companyOptions"
          :lock-company-id="companyScoped ? scopedCompanyId : null"
          mode="edit"
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
