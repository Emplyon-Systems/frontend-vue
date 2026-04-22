<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ImageUploadCard from "@/components/ImageUploadCard.vue";
import DataForm from "./form/DataForm.vue";
import { branchesApi, companiesApi } from "@/api/resources";
import {
  branchInitialForm,
  defaultOpenScheduleRuleAllWeek,
  validateBranchForm,
  type BranchFormData,
} from "@/core/schemas";
import type { BranchScheduleRuleRecord } from "@/types/api";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const branchId = computed(() => Number(route.params.id));
const companyScoped = computed(() => String(route.name ?? "").startsWith("company."));
const scopedCompanyId = computed(() => (companyScoped.value ? Number(authStore.user?.companies?.[0]?.id ?? 0) : 0));
const workspaceCompanyId = computed(() => {
  const id = Number(route.query.company_id ?? 0);
  return id > 0 ? id : 0;
});
const isWorkspaceContext = computed(() => workspaceCompanyId.value > 0);

const loading = ref(false);
const loadingBranch = ref(true);
const loadError = ref("");
const form = ref<BranchFormData>(branchInitialForm());
const branchLogoUrl = ref<string | null>(null);
const branchLogoUploading = ref(false);
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});
const companyOptions = ref<Array<{ id: number; name: string }>>();

function cancel() {
  if (isWorkspaceContext.value) {
    router.push({ name: "owner.company.workspace.branches", params: { id: String(workspaceCompanyId.value) } });
    return;
  }
  router.push({ name: companyScoped.value ? "company.branches" : "owner.branches" });
}

function toHhMm(v: string): string {
  const m = String(v ?? "").trim().match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "08:00";
}

function mapApiScheduleRule(r: BranchScheduleRuleRecord) {
  const closed = !!r.is_closed;
  return {
    id: r.id,
    weekdays: [...(r.weekdays ?? [])].sort((a, b) => a - b),
    is_closed: closed,
    expedient_start_time: closed ? "" : toHhMm(String(r.expedient_start_time ?? "08:00")),
    expedient_end_time: closed ? "" : toHhMm(String(r.expedient_end_time ?? "18:00")),
    store_open_time: closed ? "" : toHhMm(String(r.store_open_time ?? "09:00")),
    store_close_time: closed ? "" : toHhMm(String(r.store_close_time ?? "18:00")),
    break_duration_minutes: r.break_duration_minutes ?? null,
    daily_work_minutes: r.daily_work_minutes ?? null,
    sort_order: r.sort_order ?? 0,
  };
}

function fillFormFromBranch(data: Awaited<ReturnType<typeof branchesApi.getById>>) {
  const branch = data.branch;
  if (!branch) return;

  const legacyRule = {
    ...defaultOpenScheduleRuleAllWeek(),
    expedient_start_time: toHhMm(branch.expedient_start_time ?? "08:00"),
    expedient_end_time: toHhMm(branch.expedient_end_time ?? "18:00"),
    store_open_time: toHhMm(branch.store_open_time ?? "09:00"),
    store_close_time: toHhMm(branch.store_close_time ?? "18:00"),
  };

  const schedule_rules =
    branch.schedule_rules && branch.schedule_rules.length > 0
      ? [...branch.schedule_rules].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(mapApiScheduleRule)
      : [legacyRule];

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
    schedule_rules,
  };
  branchLogoUrl.value = branch.logo_url ?? null;
}

async function onBranchLogoSelect(file: File) {
  if (Number.isNaN(branchId.value)) return;
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
  resetErrors();
  const validation = validateBranchForm(form.value, "edit-with-hours");
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
    .catch(onApiError)
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
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar filial</h1>
          <p class="text-muted mb-0 small">Atualizar dados da filial.</p>
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
          :company-options="companyOptions ?? []"
          :lock-company-id="companyScoped ? scopedCompanyId : null"
          mode="edit"
          show-operating-hours
          edit-tabbed
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
