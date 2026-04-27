<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ProfilePage from "./profile/index.vue";
import { positionsApi, branchesApi } from "@/api/resources";
import { positionInitialForm, type PositionFormData } from "@/core/schemas";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { usePanelScope } from "@/composables/usePanelScope";
import { useModulePermissions } from "@/composables/usePermissions";
import type { PositionRecord } from "@/types/api";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const positionPermissions = useModulePermissions("positions");
const positionId = computed(() => Number(route.params.id));
const { isCompanyScoped: companyScoped, isBranchScoped: branchScoped } = usePanelScope();

function positionsListRoute() {
  return branchScoped.value ? "branch.positions" : companyScoped.value ? "company.positions" : "owner.positions";
}

const loadingPosition = ref(true);
const loadError = ref("");
const form = ref<PositionFormData>(positionInitialForm());
const branchOptions = ref<Array<{ id: number; name: string }>>([]);
const positionSlug = ref("");
const canEditPosition = computed(() => authStore.hasRole("superadmin") || positionPermissions.canUpdate.value);

function back() {
  router.push({ name: positionsListRoute() });
}

function goEdit() {
  if (!canEditPosition.value) return;
  const editName = branchScoped.value ? "branch.positions.edit" : companyScoped.value ? "company.positions.edit" : "owner.positions.edit";
  router.push({ name: editName, params: { id: String(positionId.value) } });
}

function fillFromPosition(data: Awaited<ReturnType<typeof positionsApi.getById>>) {
  const position = data.position as PositionRecord | undefined;
  if (!position) return;
  form.value = {
    branch_id: position.branch_id ?? 0,
    name: position.name ?? "",
  };
  positionSlug.value = position.slug ?? "";
}

function loadPosition() {
  loadError.value = "";
  loadingPosition.value = true;

  if (!positionId.value) {
    loadError.value = "Cargo inválido.";
    loadingPosition.value = false;
    return;
  }

  positionsApi
    .getById(positionId.value)
    .then(fillFromPosition)
    .catch(() => (loadError.value = "Cargo não encontrado."))
    .finally(() => (loadingPosition.value = false));
}

const branchName = computed(() => {
  const id = form.value.branch_id;
  return branchOptions.value.find((b) => b.id === id)?.name ?? "—";
});

onMounted(async () => {
  const branches = await branchesApi.plucks();
  branchOptions.value = (branches as { id: number; name?: string }[])
    .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  loadPosition();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Visualizar cargo</h1>
          <p class="text-muted mb-0 small">Consulta dos dados do cargo.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button v-if="canEditPosition" variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingPosition" class="text-muted">Carregando cargo...</div>
      <ProfilePage
        v-else
        :name="form.name"
        :slug="positionSlug"
        :branch-name="branchName"
        :subtitle="branchScoped ? undefined : branchName"
        :hide-branch-context="branchScoped"
        :on-edit="canEditPosition ? goEdit : undefined"
      />
    </div>
  </component>
</template>
