<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ImageUploadCard from "@/components/ImageUploadCard.vue";
import DataForm from "@/views/panels/owner/branches/form/DataForm.vue";
import { branchesApi, companiesApi } from "@/api/resources";
import {
  branchInitialForm,
  validateBranchForm,
  type BranchFormData,
} from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const loadingBranch = ref(true);
const loadError = ref("");
const form = ref<BranchFormData>(branchInitialForm());
const branchLogoUrl = ref<string | null>(null);
const branchLogoUploading = ref(false);
const { errors, clearError, resetErrors, onApiError, onClientValidationFailed } = useFormValidationErrors({
  notifyOnApiFieldErrors: true,
  notifyOnGenericApiMessage: true,
  notifyOnEmptyResponse: true,
  fallbackMessage: "Não foi possível salvar a filial. Verifique a ligação ou tente novamente.",
});
const companyOptions = ref<Array<{ id: number; name: string }>>([]);

const branchId = computed(() => {
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  const fromUser = Number(authStore.user?.branches?.[0]?.id ?? 0);
  return fromUser > 0 ? fromUser : 0;
});

const companyId = computed(() => {
  const fromContext = Number(authStore.activeContext?.company_id ?? 0);
  if (fromContext > 0) return fromContext;
  const fromBranch = Number(authStore.user?.branches?.[0]?.company_id ?? 0);
  return fromBranch > 0 ? fromBranch : 0;
});

const companyName = computed(() => {
  if (authStore.activeContext?.company_name) return authStore.activeContext.company_name;
  return authStore.user?.branches?.[0]?.company?.name ?? "Minha empresa";
});

function cancel() {
  router.push({ name: "panels.branch.dashboard" });
}

function toHhMm(v: string): string {
  const m = String(v ?? "").trim().match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "08:00";
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
    expedient_start_time: toHhMm(branch.expedient_start_time ?? "08:00"),
    expedient_end_time: toHhMm(branch.expedient_end_time ?? "18:00"),
    store_open_time: toHhMm(branch.store_open_time ?? "09:00"),
    store_close_time: toHhMm(branch.store_close_time ?? "18:00"),
  };
  branchLogoUrl.value = branch.logo_url ?? null;
}

async function onBranchLogoSelect(file: File) {
  if (!branchId.value) return;
  branchLogoUploading.value = true;
  try {
    const res = await branchesApi.uploadLogo(branchId.value, file);
    branchLogoUrl.value = res.branch?.logo_url ?? null;
    notifySuccess("Logo da filial atualizado.");
  } catch (e) {
    onApiError(e);
  } finally {
    branchLogoUploading.value = false;
  }
}

function loadBranch() {
  loadError.value = "";
  loadingBranch.value = true;

  if (!branchId.value) {
    loadError.value = "Filial não identificada no contexto atual.";
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
  resetErrors();
  const validation = validateBranchForm(form.value, "edit");
  if (!validation.success) {
    onClientValidationFailed(validation.errors);
    return;
  }

  if (!branchId.value) {
    loadError.value = "Filial não identificada no contexto atual.";
    return;
  }

  loading.value = true;
  branchesApi
    .update(branchId.value, validation.data)
    .then(() => {
      notifySuccess("Filial atualizada com sucesso.");
      router.push({ name: "panels.branch.dashboard" });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(() => {
  if (companyId.value > 0) {
    companyOptions.value = [{ id: companyId.value, name: companyName.value }];
  }
  loadBranch();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Minha filial</h1>
          <p class="text-muted mb-0 small">Atualizar dados da filial do seu contexto.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingBranch" class="text-muted">Carregando filial...</div>
      <b-form v-else @submit.prevent="submit">
        <ImageUploadCard
          class="mb-3"
          title="Logo da filial"
          description="Imagem da filial (armazenada na pasta da empresa e filial no object storage)."
          :preview-url="branchLogoUrl"
          :uploading="branchLogoUploading"
          @select="onBranchLogoSelect"
        />
        <DataForm
          v-model="form"
          :errors="errors"
          :company-options="companyOptions"
          :lock-company-id="companyId || null"
          mode="edit"
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
