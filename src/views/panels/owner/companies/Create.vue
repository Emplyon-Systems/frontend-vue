<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "./form/DataForm.vue";
import { companiesApi } from "@/api/resources";
import { companyInitialForm, validateCompanyForm, type CompanyFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";

const router = useRouter();
const loading = ref(false);
const form = ref<CompanyFormData>(companyInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  toastFieldPriority: ["general", "error", "company", "profile"],
  fallbackMessage: "Não foi possível criar a empresa.",
});

function cancel() {
  router.push({ name: "owner.companies" });
}

function submit() {
  resetErrors();
  const validation = validateCompanyForm(form.value, "create");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  companiesApi
    .create(validation.data as companiesApi.CompanyCreatePayload)
    .then(() => {
      notifySuccess("Empresa criada com sucesso.");
      router.push({ name: "owner.companies" });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Nova empresa</h1>
          <p class="text-muted mb-0 small">Criar empresa e usuário principal.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <b-form @submit.prevent="submit">
        <DataForm v-model="form" :errors="errors" mode="create" @clear-error="clearError">
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
