<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ProfilePage from "./profile/index.vue";
import type { SectorUser } from "./profile/SectorUsersTab.vue";
import { sectorsApi, branchesApi } from "@/api/resources";
import { sectorInitialForm, type SectorFormData } from "@/core/schemas";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { usePanelScope } from "@/composables/usePanelScope";
import { useModulePermissions } from "@/composables/usePermissions";
import type { SectorRecord } from "@/types/api";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const sectorPermissions = useModulePermissions("sectors");
const sectorId = computed(() => Number(route.params.id));
const { isCompanyScoped: companyScoped, isBranchScoped: branchScoped } = usePanelScope();

function sectorsListRoute() {
  return branchScoped.value ? "branch.sectors" : companyScoped.value ? "company.sectors" : "owner.sectors";
}

const loadingSector = ref(true);
const loadError = ref("");
const form = ref<SectorFormData>(sectorInitialForm());
const branchOptions = ref<Array<{ id: number; name: string }>>([]);
const sectorSlug = ref("");
const users = ref<SectorUser[]>([]);
const usersCount = ref(0);
const sectorStartTime = ref("");
const sectorEndTime = ref("");
const canEditSector = computed(() => authStore.hasRole("superadmin") || sectorPermissions.canUpdate.value);

function back() {
  router.push({ name: sectorsListRoute() });
}

function goEdit() {
  if (!canEditSector.value) return;
  const editName = branchScoped.value ? "branch.sectors.edit" : companyScoped.value ? "company.sectors.edit" : "owner.sectors.edit";
  router.push({ name: editName, params: { id: String(sectorId.value) } });
}

function fillFromSector(data: Awaited<ReturnType<typeof sectorsApi.getById>>) {
  const sector = data.sector as (SectorRecord & { users?: SectorUser[] }) | undefined;
  if (!sector) return;
  form.value = {
    branch_id: sector.branch_id ?? 0,
    name: sector.name ?? "",
    start_time: sector.start_time ?? "",
    end_time: sector.end_time ?? "",
  };
  sectorSlug.value = sector.slug ?? "";
  sectorStartTime.value = sector.start_time ?? "";
  sectorEndTime.value = sector.end_time ?? "";
  users.value = sector.users ?? [];
  usersCount.value = sector.users?.length ?? 0;
}

function loadSector() {
  loadError.value = "";
  loadingSector.value = true;

  if (!sectorId.value) {
    loadError.value = "Setor inválido.";
    loadingSector.value = false;
    return;
  }

  sectorsApi
    .getById(sectorId.value)
    .then(fillFromSector)
    .catch(() => (loadError.value = "Setor não encontrado."))
    .finally(() => (loadingSector.value = false));
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
  loadSector();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Visualizar setor</h1>
          <p class="text-muted mb-0 small">Consulta dos dados do setor.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button v-if="canEditSector" variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingSector" class="text-muted">Carregando setor...</div>
      <ProfilePage
        v-else
        :name="form.name"
        :slug="sectorSlug"
        :branch-name="branchName"
        :subtitle="branchScoped ? undefined : branchName"
        :hide-branch-context="branchScoped"
        :start-time="sectorStartTime"
        :end-time="sectorEndTime"
        :users="users"
        :users-count="usersCount"
        :on-edit="canEditSector ? goEdit : undefined"
      />
    </div>
  </component>
</template>
