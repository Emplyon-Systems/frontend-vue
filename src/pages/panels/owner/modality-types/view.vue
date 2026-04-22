<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "@/views/panels/owner/modality-types/form/DataForm.vue";
import { modalityTypesApi } from "@/api/resources";
import { modalityTypeInitialForm, type ModalityTypeFormData } from "@/core/schemas";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { useModulePermissions } from "@/composables/usePermissions";
import { usePanelScope } from "@/composables/usePanelScope";
import { useScopePlucks } from "@/composables/useScopePlucks";

const route = useRoute();
const router = useRouter();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { loadBranchOptionsByScope } = useScopePlucks();
const modalityTypePermissions = useModulePermissions("modality_types");
const { isCompanyScoped: companyScoped, isBranchScoped: branchScoped, currentBranchId } = usePanelScope();
const modalityTypeId = computed(() => Number(route.params.id));
const loadingModalityType = ref(true);
const loadError = ref("");
const form = ref<ModalityTypeFormData>(modalityTypeInitialForm());
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);
const canEditModalityType = modalityTypePermissions.canUpdate;

function modalityTypesListRoute() {
  return branchScoped.value
    ? "branch.modality-types"
    : companyScoped.value
      ? "company.modality-types"
      : "owner.modality-types";
}

function back() {
  router.push({ name: modalityTypesListRoute() });
}

function goEdit() {
  if (!canEditModalityType.value) return;
  const editName = branchScoped.value
    ? "branch.modality-types.edit"
    : companyScoped.value
      ? "company.modality-types.edit"
      : "owner.modality-types.edit";
  router.push({ name: editName, params: { id: String(modalityTypeId.value) } });
}

function fillFromModalityType(data: Awaited<ReturnType<typeof modalityTypesApi.getById>>) {
  const mt = data.modalityType;
  if (!mt) return;
  form.value = {
    branch_id: mt.branch_id ?? 0,
    name: mt.name ?? "",
  };
}

function loadModalityType() {
  loadError.value = "";
  loadingModalityType.value = true;

  if (!modalityTypeId.value) {
    loadError.value = "Modalidade inválida.";
    loadingModalityType.value = false;
    return;
  }

  modalityTypesApi
    .getById(modalityTypeId.value)
    .then(fillFromModalityType)
    .catch(() => (loadError.value = "Modalidade não encontrada."))
    .finally(() => (loadingModalityType.value = false));
}

onMounted(async () => {
  branchOptions.value = await loadBranchOptionsByScope({
    branchScoped: branchScoped.value,
    currentBranchId: currentBranchId.value,
    includeCompanyName: true,
  });
  loadModalityType();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Visualizar modalidade</h1>
          <p class="text-muted mb-0 small">Consulta dos dados da modalidade.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button v-if="canEditModalityType" variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingModalityType" class="text-muted">Carregando modalidade...</div>
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
