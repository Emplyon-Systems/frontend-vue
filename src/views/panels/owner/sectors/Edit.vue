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
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { usePanelScope } from "@/composables/usePanelScope";

const route = useRoute();
const router = useRouter();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const sectorId = computed(() => Number(route.params.id));
const { isCompanyScoped: companyScoped, isBranchScoped: branchScoped, currentBranchId } = usePanelScope();

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
const branchExpedientEnvelopeById = ref<Record<number, { start: string; end: string } | null>>({});
const branchScheduleHint = computed(() => {
  const envelope = branchExpedientEnvelopeById.value[Number(form.value.branch_id ?? 0)] ?? null;
  if (!envelope) return "";
  return `Horário permitido nesta filial: ${envelope.start} às ${envelope.end}.`;
});

function cancel() {
  router.push({ name: sectorsListRoute() });
}

function fillFormFromSector(data: Awaited<ReturnType<typeof sectorsApi.getById>>) {
  const sector = data.sector;
  if (!sector) return;
  form.value = {
    branch_id: sector.branch_id ?? 0,
    name: sector.name ?? "",
    start_time: sector.start_time ?? "08:00",
    end_time: sector.end_time ?? "17:00",
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
    .update(sectorId.value, validation.data)
    .then(() => {
      notifySuccess("Setor atualizado com sucesso.");
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
  loadSector();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar setor</h1>
          <p class="text-muted mb-0 small">Atualizar dados do setor.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingSector" class="text-muted">Carregando setor...</div>
      <b-form v-else @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :branch-options="branchOptions"
          :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null"
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
        <p v-if="branchScheduleHint" class="text-muted small mt-2 mb-0">
          {{ branchScheduleHint }}
        </p>
      </b-form>
    </div>
  </component>
</template>
