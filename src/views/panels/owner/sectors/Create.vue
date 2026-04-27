<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "./form/DataForm.vue";
import { sectorsApi, branchesApi } from "@/api/resources";
import { sectorInitialForm, validateSectorForm, type SectorFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const routeName = computed(() => String(route.name ?? ""));
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));
const currentBranchId = computed(() => {
  if (!branchScoped.value) return 0;
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.id ?? 0);
});
const loading = ref(false);
const form = ref<SectorFormData>(sectorInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});
const branchOptions = ref<Array<{ id: number; name: string }>>([]);
const branchExpedientEnvelopeById = ref<Record<number, { start: string; end: string } | null>>({});
const branchScheduleHint = computed(() => {
  const envelope = branchExpedientEnvelopeById.value[Number(form.value.branch_id ?? 0)] ?? null;
  if (!envelope) return "";
  return `Horário permitido nesta filial: ${envelope.start} às ${envelope.end}.`;
});

function sectorsListRoute() {
  return branchScoped.value ? "branch.sectors" : companyScoped.value ? "company.sectors" : "owner.sectors";
}

function cancel() {
  router.push({ name: sectorsListRoute() });
}

function submit() {
  resetErrors();
  const validation = validateSectorForm(form.value, "create");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }
  const envelope = branchExpedientEnvelopeById.value[Number(form.value.branch_id ?? 0)] ?? null;
  if (envelope) {
    if (form.value.start_time < envelope.start || form.value.start_time > envelope.end) {
      errors.value = {
        ...errors.value,
        start_time: `Horário de início deve estar entre ${envelope.start} e ${envelope.end} (funcionamento da filial).`,
      };
      return;
    }
    if (form.value.end_time < envelope.start || form.value.end_time > envelope.end) {
      errors.value = {
        ...errors.value,
        end_time: `Horário de término deve estar entre ${envelope.start} e ${envelope.end} (funcionamento da filial).`,
      };
      return;
    }
  }

  loading.value = true;
  sectorsApi
    .create(validation.data)
    .then(() => {
      notifySuccess("Setor criado com sucesso.");
      router.push({ name: sectorsListRoute() });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  const envelopeFromRules = (rules?: Array<{ is_closed?: boolean; expedient_start_time?: string | null; expedient_end_time?: string | null }>) => {
    const valid = (rules ?? [])
      .filter((r) => !r.is_closed && r.expedient_start_time && r.expedient_end_time)
      .map((r) => ({
        start: String(r.expedient_start_time ?? "").slice(0, 5),
        end: String(r.expedient_end_time ?? "").slice(0, 5),
      }));
    if (!valid.length) return null;
    const start = valid.reduce((acc, item) => (item.start < acc ? item.start : acc), valid[0].start);
    const end = valid.reduce((acc, item) => (item.end > acc ? item.end : acc), valid[0].end);
    return { start, end };
  };

  if (branchScoped.value && currentBranchId.value > 0) {
    let branchName =
      authStore.activeContext?.branch_id === currentBranchId.value
        ? authStore.activeContext?.branch_name
        : authStore.user?.branches?.find((b) => b.id === currentBranchId.value)?.name;
    if (!branchName) {
      try {
        const res = await branchesApi.getById(currentBranchId.value);
        branchName = res.branch?.name ?? `Filial #${currentBranchId.value}`;
      } catch {
        branchName = `Filial #${currentBranchId.value}`;
      }
    }
    branchOptions.value = [{ id: currentBranchId.value, name: branchName ?? `Filial #${currentBranchId.value}` }];
    form.value.branch_id = currentBranchId.value;
    try {
      const branchRes = await branchesApi.getById(currentBranchId.value);
      branchExpedientEnvelopeById.value[currentBranchId.value] = envelopeFromRules(branchRes.branch?.schedule_rules);
    } catch {
      branchExpedientEnvelopeById.value[currentBranchId.value] = null;
    }
    return;
  }
  const branches = await branchesApi.plucks();
  branchOptions.value = (branches as { id: number; name?: string }[])
    .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  await Promise.all(
    branchOptions.value.map(async (b) => {
      try {
        const branchRes = await branchesApi.getById(b.id);
        branchExpedientEnvelopeById.value[b.id] = envelopeFromRules(branchRes.branch?.schedule_rules);
      } catch {
        branchExpedientEnvelopeById.value[b.id] = null;
      }
    })
  );
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Novo setor</h1>
          <p class="text-muted mb-0 small">
            {{
              branchScoped
                ? "Criar setor nesta filial. O slug é gerado automaticamente."
                : "Criar setor vinculado a uma filial. O slug é gerado automaticamente."
            }}
          </p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <b-form @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :branch-options="branchOptions"
          :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null"
          mode="create"
          @clear-error="clearError"
        >
          <template #actions>
            <b-button type="submit" variant="primary" :disabled="loading">
              {{ loading ? "Salvando..." : "Salvar" }}
            </b-button>
            <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
          </template>
        </DataForm>
        <p v-if="branchScheduleHint" class="text-muted small mt-2 mb-0">
          {{ branchScheduleHint }}
        </p>
      </b-form>
    </div>
  </component>
</template>
