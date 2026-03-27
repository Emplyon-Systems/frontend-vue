<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "./form/DataForm.vue";
import { sectorsApi, branchesApi } from "@/api/resources";
import { sectorInitialForm, validateSectorForm, type SectorFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const sectorId = computed(() => Number(route.params.id));
const routeName = computed(() => String(route.name ?? ""));
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));

function sectorsListRoute() {
  return branchScoped.value ? "branch.sectors" : companyScoped.value ? "company.sectors" : "owner.sectors";
}

const loading = ref(false);
const loadingSector = ref(true);
const loadError = ref("");
const form = ref<SectorFormData>(sectorInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});
const branchOptions = ref<Array<{ id: number; name: string }>>([]);

function cancel() {
  router.push({ name: sectorsListRoute() });
}

function fillFormFromSector(data: Awaited<ReturnType<typeof sectorsApi.getById>>) {
  const sector = data.sector;
  if (!sector) return;
  form.value = {
    branch_id: sector.branch_id ?? 0,
    name: sector.name ?? "",
  };
}

function loadSector() {
  loadError.value = "";
  loadingSector.value = true;

  if (Number.isNaN(sectorId.value)) {
    loadError.value = "Setor inválido.";
    loadingSector.value = false;
    return;
  }

  sectorsApi
    .getById(sectorId.value)
    .then(fillFormFromSector)
    .catch(() => (loadError.value = "Setor não encontrado."))
    .finally(() => (loadingSector.value = false));
}

function submit() {
  resetErrors();
  const validation = validateSectorForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  sectorsApi
    .update(sectorId.value, validation.data)
    .then(() => {
      notifySuccess("Setor atualizado com sucesso.");
      router.push({ name: sectorsListRoute() });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  const branches = await branchesApi.plucks();
  branchOptions.value = (branches as { id: number; name?: string }[])
    .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  loadSector();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar setor</h1>
          <p class="text-muted mb-0 small">Atualizar dados do setor.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingSector" class="text-muted">A carregar setor...</div>
      <b-form v-else @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :branch-options="branchOptions"
          :lock-branch-id="null"
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
