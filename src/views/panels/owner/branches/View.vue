<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ProfilePage from "./profile/index.vue";
import { branchesApi } from "@/api/resources";
import { branchInitialForm, type BranchFormData } from "@/core/schemas";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import { usePanelScope } from "@/composables/usePanelScope";
import { useScopePlucks } from "@/composables/useScopePlucks";
import type { BranchRecord, BranchScheduleRuleRecord } from "@/types/api";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const { loadCompanyOptionsByScope } = useScopePlucks();
const { isBranchScoped: branchScoped, isCompanyScoped: companyScoped, currentBranchId } = usePanelScope();
const branchId = computed(() => {
  const fromParam = Number(route.params.id);
  if (Number.isFinite(fromParam) && fromParam > 0) return fromParam;
  if (branchScoped.value) {
    const fromContext = Number(currentBranchId.value ?? 0);
    return fromContext > 0 ? fromContext : 0;
  }
  return 0;
});
/** Resumo da filial com abas horizontais no layout (Setores/Funcionários vêm das tabs superiores). */
const isCompanyBranchOverview = computed(() => String(route.name ?? "") === "company.branch.overview");
const scopedCompanyId = computed(() => (companyScoped.value ? Number(authStore.user?.companies?.[0]?.id ?? 0) : 0));
const workspaceCompanyId = computed(() => {
  const id = Number(route.query.company_id ?? 0);
  return id > 0 ? id : 0;
});
const isWorkspaceContext = computed(() => workspaceCompanyId.value > 0);

const loadingBranch = ref(true);
const loadError = ref("");
const form = ref<BranchFormData>(branchInitialForm());
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const users = ref<BranchRecord["users"]>([]);
const usersCount = ref(0);
const branchUserLimit = ref<number | null>(null);
const branchUsersUsedDisplay = ref<number | null>(null);
const sectors = ref<BranchRecord["sectors"]>([]);
const scheduleRulesView = ref<BranchScheduleRuleRecord[]>([]);
const branchLogoUrl = ref<string | null>(null);
const canEditBranch = computed(() => authStore.hasPermission("branches.update") || branchScoped.value);
/** Aba Funcionários na vista da filial: superadmin ou gestor empresa/filial com permissão. */
const showBranchEmployeesTab = computed(
  () =>
    authStore.hasRole("superadmin") ||
    ((companyScoped.value || branchScoped.value) && authStore.hasPermission("employees.read")),
);

function back() {
  if (branchScoped.value) {
    router.push({ name: "panels.branch.dashboard" });
    return;
  }
  if (isWorkspaceContext.value) {
    router.push({ name: "owner.company.workspace.branches", params: { id: String(workspaceCompanyId.value) } });
    return;
  }
  router.push({ name: companyScoped.value ? "company.branches" : "owner.branches" });
}

function goEdit() {
  if (!canEditBranch.value) return;
  if (branchScoped.value) {
    router.push({ name: "branch.my-branch.edit" });
    return;
  }
  if (isWorkspaceContext.value) {
    router.push({ name: "owner.branches.edit", params: { id: String(branchId.value) }, query: { company_id: String(workspaceCompanyId.value) } });
    return;
  }
  router.push({ name: companyScoped.value ? "company.branches.edit" : "owner.branches.edit", params: { id: String(branchId.value) } });
}

function toHhMm(v: string): string {
  const m = String(v ?? "").trim().match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "08:00";
}

function buildScheduleRulesForDisplay(branch: BranchRecord): BranchScheduleRuleRecord[] {
  if (branch.schedule_rules && branch.schedule_rules.length > 0) {
    return [...branch.schedule_rules].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }
  return [
    {
      id: 0,
      branch_id: branch.id,
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      is_closed: false,
      expedient_start_time: branch.expedient_start_time ?? "08:00",
      expedient_end_time: branch.expedient_end_time ?? "18:00",
      store_open_time: branch.store_open_time ?? "09:00",
      store_close_time: branch.store_close_time ?? "18:00",
      break_duration_minutes: null,
      daily_work_minutes: null,
      sort_order: 0,
    },
  ];
}

function fillFormFromBranch(data: Awaited<ReturnType<typeof branchesApi.getById>>) {
  const branch = data.branch as BranchRecord | undefined;
  if (!branch) return;
  scheduleRulesView.value = buildScheduleRulesForDisplay(branch);
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
  users.value = branch.users ?? [];
  branchUserLimit.value = null;
  branchUsersUsedDisplay.value =
    branch.users_used != null ? Number(branch.users_used) : (branch.users?.length ?? 0);
  usersCount.value = branchUsersUsedDisplay.value;
  sectors.value = branch.sectors ?? [];
  branchLogoUrl.value = branch.logo_url ?? null;
}

function loadBranch() {
  loadError.value = "";
  loadingBranch.value = true;

  if (!branchId.value) {
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

onMounted(async () => {
  companyOptions.value = await loadCompanyOptionsByScope({
    companyScoped: companyScoped.value,
    scopedCompanyId: scopedCompanyId.value,
  });
  loadBranch();
});
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div :class="isCompanyBranchOverview ? '' : 'py-4'">
      <div
        v-if="!isCompanyBranchOverview"
        class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4"
      >
        <div>
          <h1 class="h4 mb-1">Visualizar filial</h1>
          <p class="text-muted mb-0 small">Consulta dos dados cadastrais da filial.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button v-if="canEditBranch" variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>
      <div v-else class="d-flex justify-content-end gap-2 mb-3">
        <b-button v-if="canEditBranch" variant="outline-primary" size="sm" @click="goEdit">
          Editar filial
        </b-button>
        <b-button variant="outline-secondary" size="sm" @click="back">Voltar às filiais</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingBranch" class="text-muted">Carregando filial...</div>
      <ProfilePage
        v-else
        :name="form.name"
        :cnpj="form.cnpj"
        :companyName="companyOptions.find((c) => c.id === form.company_id)?.name || ''"
        :zipCode="form.zip_code"
        :street="form.street"
        :streetNumber="form.street_number"
        :neighborhood="form.neighborhood"
        :city="form.city"
        :state="form.state"
        :users="users"
        :usersCount="usersCount"
        :userLimit="branchUserLimit"
        :usersUsedDisplay="branchUsersUsedDisplay"
        :sectors="sectors"
        :subtitle="companyOptions.find((c) => c.id === form.company_id)?.name || ''"
        :logo-src="branchLogoUrl ?? undefined"
        :onEdit="canEditBranch ? goEdit : undefined"
        :branch-id="branchId"
        :show-employees-tab="showBranchEmployeesTab"
        :schedule-rules="scheduleRulesView"
        :branch-workspace-overview="isCompanyBranchOverview"
        :only-branch-information="branchScoped"
      />
    </div>
  </component>
</template>
