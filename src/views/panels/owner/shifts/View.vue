<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "./form/DataForm.vue";
import { shiftsApi } from "@/api/resources";
import { shiftInitialForm, type ShiftFormData } from "@/core/schemas";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { usePanelScope } from "@/composables/usePanelScope";
import { useModulePermissions } from "@/composables/usePermissions";
import { useScopePlucks } from "@/composables/useScopePlucks";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { loadBranchOptionsByScope } = useScopePlucks();
const shiftPermissions = useModulePermissions("shifts");
const { isCompanyScoped: companyScoped, isBranchScoped: branchScoped, currentBranchId } = usePanelScope();
const shiftId = computed(() => Number(route.params.id));
const loadingShift = ref(true);
const loadError = ref("");
const form = ref<ShiftFormData>(shiftInitialForm());
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);
const canEditShift = computed(() => authStore.hasRole("superadmin") || shiftPermissions.canUpdate.value);

function shiftsListRoute() {
  return branchScoped.value ? "branch.shifts" : companyScoped.value ? "company.shifts" : "owner.shifts";
}

function back() {
  router.push({ name: shiftsListRoute() });
}

function goEdit() {
  if (!canEditShift.value) return;
  const editName = branchScoped.value ? "branch.shifts.edit" : companyScoped.value ? "company.shifts.edit" : "owner.shifts.edit";
  router.push({ name: editName, params: { id: String(shiftId.value) } });
}

function fillFromShift(data: Awaited<ReturnType<typeof shiftsApi.getById>>) {
  const shift = data.shift;
  if (!shift) return;
  form.value = {
    branch_id: shift.branch_id ?? 0,
    name: shift.name ?? "",
    slug: shift.slug ?? "",
    start_time: shift.start_time ?? "08:00",
    end_time: shift.end_time ?? "17:00",
  };
}

function loadShift() {
  loadError.value = "";
  loadingShift.value = true;

  if (!shiftId.value) {
    loadError.value = "Turno inválido.";
    loadingShift.value = false;
    return;
  }

  shiftsApi
    .getById(shiftId.value)
    .then(fillFromShift)
    .catch(() => (loadError.value = "Turno não encontrado."))
    .finally(() => (loadingShift.value = false));
}

onMounted(async () => {
  branchOptions.value = await loadBranchOptionsByScope({
    branchScoped: branchScoped.value,
    currentBranchId: currentBranchId.value,
    includeCompanyName: true,
  });
  loadShift();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Visualizar turno</h1>
          <p class="text-muted mb-0 small">Consulta dos dados do turno.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button v-if="canEditShift" variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingShift" class="text-muted">Carregando turno...</div>
      <DataForm
        v-else
        v-model="form"
        :branch-options="branchOptions"
        :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null"
        mode="view"
      />
    </div>
  </component>
</template>
