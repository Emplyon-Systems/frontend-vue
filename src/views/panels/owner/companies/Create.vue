<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "./form/DataForm.vue";
import { companiesApi } from "@/api/resources";
import { companyInitialForm, validateCompanyForm, type CompanyFormData } from "@/core/schemas";
import { notifyError, notifySuccess } from "@/helpers/notify";

const router = useRouter();
const loading = ref(false);
const form = ref<CompanyFormData>(companyInitialForm());
const errors = ref<Record<string, string>>({});

function mapApiErrors(err: { response?: { data?: { errors?: Record<string, string[] | string> | string; msg?: string } } }) {
  const responseData = err.response?.data;
  const data = responseData?.errors;
  if (!data) {
    if (responseData?.msg && responseData.msg !== "fail") notifyError(responseData.msg);
    else notifyError("Não foi possível criar a empresa.");
    return;
  }

  if (typeof data === "string") {
    notifyError(data);
    return;
  }

  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) map[k] = Array.isArray(v) ? v[0] : String(v);
  errors.value = map;

  const nonFieldMessage = map.general ?? map.error ?? map.company ?? map.profile ?? "";
  if (nonFieldMessage) notifyError(nonFieldMessage);
}

function clearError(field: string) {
  if (!errors.value[field]) return;
  delete errors.value[field];
}

function cancel() {
  router.push({ name: "owner.companies" });
}

function submit() {
  errors.value = {};
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
    .catch(mapApiErrors)
    .finally(() => (loading.value = false));
}
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Nova empresa</h1>
          <p class="text-muted mb-0 small">Criar empresa e utilizador principal.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <b-form @submit.prevent="submit">
        <DataForm v-model="form" :errors="errors" mode="create" @clear-error="clearError">
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
