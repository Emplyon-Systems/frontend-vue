<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ImageUploadCard from "@/components/ImageUploadCard.vue";
import DataForm from "./form/DataForm.vue";
import { companiesApi } from "@/api/resources";
import { companyInitialForm, validateCompanyForm, type CompanyFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";

const route = useRoute();
const router = useRouter();
const companyId = computed(() => Number(route.params.id));

const loading = ref(false);
const loadingCompany = ref(true);
const loadError = ref("");
/** Contagem atual (API) — não pode salvar limite abaixo disto. */
const usersUsed = ref(0);
const branchesUsed = ref(0);
const form = ref<CompanyFormData>(companyInitialForm());
const logoUrl = ref<string | null>(null);
const logoUploading = ref(false);
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});

function cancel() {
  router.push({ name: "owner.companies" });
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
  next.branch_limit = Number(company.branch_limit ?? 10);
  next.user_limit = Number(company.user_limit ?? 50);
  usersUsed.value = Number(company.users_used ?? 0);
  branchesUsed.value = Number(company.branches_used ?? 0);
  logoUrl.value = company.logo_url ?? null;
  form.value = next;
}

async function onLogoSelect(file: File) {
  if (Number.isNaN(companyId.value)) return;
  logoUploading.value = true;
  try {
    const res = await companiesApi.uploadLogo(companyId.value, file);
    logoUrl.value = res.company?.logo_url ?? null;
    notifySuccess("Logo da empresa atualizado.");
  } catch (e) {
    onApiError(e);
  } finally {
    logoUploading.value = false;
  }
}

function loadCompany() {
  loadError.value = "";
  loadingCompany.value = true;

  if (Number.isNaN(companyId.value)) {
    loadError.value = "Empresa inválida.";
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
  resetErrors();
  const validation = validateCompanyForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  if (usersUsed.value > 0 && validation.data.user_limit < usersUsed.value) {
    errors.value = {
      user_limit: `Esta empresa tem ${usersUsed.value} usuário(s) cadastrado(s). Não pode definir o limite abaixo de ${usersUsed.value} para evitar conflitos.`,
    };
    return;
  }
  if (branchesUsed.value > 0 && validation.data.branch_limit < branchesUsed.value) {
    errors.value = {
      branch_limit: `Esta empresa tem ${branchesUsed.value} filial(is) cadastrada(s). Não pode definir o limite abaixo de ${branchesUsed.value} para evitar conflitos.`,
    };
    return;
  }

  loading.value = true;
  companiesApi
    .update(companyId.value, validation.data)
    .then(() => {
      notifySuccess("Empresa atualizada com sucesso.");
      router.push({ name: "owner.companies" });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(loadCompany);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar empresa</h1>
          <p class="text-muted mb-0 small">Atualizar dados da empresa.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingCompany" class="text-muted">Carregando empresa...</div>
      <b-form v-else @submit.prevent="submit">
        <ImageUploadCard
          class="mb-3"
          title="Logo da empresa"
          :preview-url="logoUrl"
          :uploading="logoUploading"
          @select="onLogoSelect"
        />
        <DataForm
          v-model="form"
          :errors="errors"
          mode="edit"
          :users-used="usersUsed"
          :branches-used="branchesUsed"
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
  </DefaultLayout>
</template>
