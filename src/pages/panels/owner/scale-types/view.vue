<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "@/views/panels/owner/scale-types/form/DataForm.vue";
import { scaleTypesApi } from "@/api/resources";
import { scaleTypeInitialForm, type ScaleTypeFormData } from "@/core/schemas";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { useModulePermissions } from "@/composables/usePermissions";
import { usePanelScope } from "@/composables/usePanelScope";
import { useScopePlucks } from "@/composables/useScopePlucks";

const route = useRoute();
const router = useRouter();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { loadBranchOptionsByScope } = useScopePlucks();
const scaleTypePermissions = useModulePermissions("scale_types");
const { isCompanyScoped: companyScoped, isBranchScoped: branchScoped, currentBranchId } = usePanelScope();
const scaleTypeId = computed(() => Number(route.params.id));
const loadingScaleType = ref(true);
const loadError = ref("");
const form = ref<ScaleTypeFormData>(scaleTypeInitialForm());
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);
const canEditScaleType = scaleTypePermissions.canUpdate;

function scaleTypesListRoute() {
  return branchScoped.value
    ? "branch.scale-types"
    : companyScoped.value
      ? "company.scale-types"
      : "owner.scale-types";
}

function back() {
  router.push({ name: scaleTypesListRoute() });
}

function goEdit() {
  if (!canEditScaleType.value) return;
  const editName = branchScoped.value
    ? "branch.scale-types.edit"
    : companyScoped.value
      ? "company.scale-types.edit"
      : "owner.scale-types.edit";
  router.push({ name: editName, params: { id: String(scaleTypeId.value) } });
}

function fillFromScaleType(data: Awaited<ReturnType<typeof scaleTypesApi.getById>>) {
  const st = data.scaleType;
  if (!st) return;
  form.value = {
    branch_id: st.branch_id ?? 0,
    name: st.name ?? "",
  };
}

function loadScaleType() {
  loadError.value = "";
  loadingScaleType.value = true;

  if (!scaleTypeId.value) {
    loadError.value = "Tipo de escala inválido.";
    loadingScaleType.value = false;
    return;
  }

  scaleTypesApi
    .getById(scaleTypeId.value)
    .then(fillFromScaleType)
    .catch(() => (loadError.value = "Tipo de escala não encontrado."))
    .finally(() => (loadingScaleType.value = false));
}

onMounted(async () => {
  branchOptions.value = await loadBranchOptionsByScope({
    branchScoped: branchScoped.value,
    currentBranchId: currentBranchId.value,
    includeCompanyName: true,
  });
  loadScaleType();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Visualizar tipo de escala</h1>
          <p class="text-muted mb-0 small">Consulta dos dados do tipo de escala.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button v-if="canEditScaleType" variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingScaleType" class="text-muted">Carregando tipo de escala...</div>
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
