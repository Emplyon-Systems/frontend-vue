<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  markRaw,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";

/** Carregamento lazy + opções não reativas evitam ciclos Apex/Vue que bloqueiam o browser. */
const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));
import AppAlert from "@/components/AppAlert.vue";
import CompanyFirstStepsWizard from "@/views/panels/company/setup/CompanyFirstStepsWizard.vue";
import { companiesApi, sectorsApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";
import type { CompanyRecord } from "@/types/api";

const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();

const loading = ref(true);
const loadError = ref("");
const company = ref<CompanyRecord | null>(null);
const sectorsTotal = ref(0);

const companyId = computed(() => {
  const fromCtx = Number(authStore.activeContext?.company_id ?? 0);
  if (fromCtx > 0) return fromCtx;
  const fromPivot = Number(authStore.user?.companies?.[0]?.id ?? 0);
  if (fromPivot > 0) return fromPivot;
  for (const r of authStore.user?.roles ?? []) {
    const id = Number(r.company_id ?? 0);
    if (id > 0) return id;
    const m = String(r.slug ?? "").match(/-c(\d+)$/);
    if (m) return Number(m[1]);
  }
  return 0;
});

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
});

const today = new Date().toLocaleDateString("pt-BR", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric",
});

const usersUsed    = computed(() => Number(company.value?.users_used   ?? company.value?.users?.length   ?? 0));
const userLimit    = computed(() => Number(company.value?.user_limit   ?? 0));
const branchesUsed = computed(() => Number(company.value?.branches_used ?? company.value?.branches?.length ?? 0));
const branchLimit  = computed(() => Number(company.value?.branch_limit ?? 0));

const userPct    = computed(() => userLimit.value   > 0 ? Math.min(100, Math.round(usersUsed.value    / userLimit.value    * 100)) : 0);
const branchPct  = computed(() => branchLimit.value > 0 ? Math.min(100, Math.round(branchesUsed.value / branchLimit.value  * 100)) : 0);

const userVariant   = computed(() => userPct.value   > 85 ? "danger" : userPct.value   > 65 ? "warning" : "success");
const branchVariant = computed(() => branchPct.value > 85 ? "danger" : branchPct.value > 65 ? "warning" : "success");

const branches    = computed(() => (company.value?.branches ?? []).slice(0, 6));
const recentUsers = computed(() =>
  (company.value?.users ?? [])
    .slice()
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
    .slice(0, 6)
);

const myRoles = computed(() => authStore.user?.roles ?? []);

const canCreateBranch = computed(() => authStore.hasPermission("branches.create"));
const canViewBranches = computed(() => authStore.hasPermission("branches.index") || authStore.hasPermission("branches.read"));
const canViewUsers    = computed(() => authStore.hasPermission("users.index")    || authStore.hasPermission("users.read"));

// ── Gráficos Apex: shallowRef + markRaw (evita “Page unresponsive”) ────────
const occupancySeries = shallowRef([0, 0]);
const occupancyOptions = shallowRef<Record<string, unknown>>({});
const donutSeries = shallowRef([1]);
const donutOptions = shallowRef<Record<string, unknown>>({});

watch(
  () => [userPct.value, branchPct.value] as const,
  ([up, bp]) => {
    occupancySeries.value = [up, bp];
    occupancyOptions.value = markRaw({
      chart: { type: "radialBar" as const, toolbar: { show: false } },
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: -135,
          endAngle: 135,
          hollow: { size: "30%" },
          dataLabels: {
            name: { fontSize: "13px", offsetY: -10 },
            value: { fontSize: "16px", fontWeight: 700, offsetY: 4, formatter: (v: number) => `${v}%` },
            total: {
              show: true,
              label: "Plano",
              fontSize: "12px",
              formatter: () => `${Math.round((up + bp) / 2)}%`,
            },
          },
        },
      },
      colors: [
        up > 85 ? "#dc3545" : up > 65 ? "#ffc107" : "#198754",
        bp > 85 ? "#dc3545" : bp > 65 ? "#ffc107" : "#0d6efd",
      ],
      labels: ["Usuários", "Filiais"],
      legend: { show: true, position: "bottom" as const, fontSize: "12px" },
    });
  },
  { immediate: true }
);

watch(
  () => company.value,
  (c) => {
    const counts: Record<string, number> = {};
    for (const u of c?.users ?? []) {
      const roles = u.roles ?? [];
      const label = roles.length ? roles[0].name : "Sem perfil";
      counts[label] = (counts[label] ?? 0) + 1;
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const hasData = entries.some(([, v]) => v > 0);
    donutSeries.value = hasData ? entries.map(([, v]) => v) : [1];
    donutOptions.value = markRaw({
      chart: { type: "donut" as const },
      labels: hasData ? entries.map(([k]) => k) : ["Sem dados"],
      colors: hasData
        ? ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#0dcaf0", "#6f42c1", "#fd7e14"]
        : ["#dee2e6"],
      legend: { position: "bottom" as const, fontSize: "12px" },
      dataLabels: { enabled: hasData },
      tooltip: { y: { formatter: (v: number) => `${v} usuário${v !== 1 ? "es" : ""}` } },
      plotOptions: { pie: { donut: { size: "58%" } } },
    });
  },
  { immediate: true }
);

async function loadData() {
  loadError.value = "";
  loading.value = true;
  company.value = null;
  sectorsTotal.value = 0;
  if (!companyId.value) {
    loadError.value = "Empresa não identificada no contexto.";
    loading.value = false;
    return;
  }
  try {
    const [companyRes, sectorsRes] = await Promise.all([
      companiesApi.getById(companyId.value),
      sectorsApi.list({ per_page: 1 }).catch(() => null),
    ]);
    company.value      = companyRes.company ?? null;
    sectorsTotal.value = sectorsRes?.sectors?.total ?? 0;
    if (!company.value) loadError.value = "Empresa não encontrada.";
  } catch {
    company.value = null;
    loadError.value = "Não foi possível carregar os dados da empresa.";
  } finally {
    loading.value = false;
  }
}

const showCompanyFirstSteps = computed(
  () =>
    Boolean(
      company.value &&
      !company.value.setup_completed_at &&
      companyId.value > 0 &&
      !companySetupDismissed.value
    )
);
const companyFirstStepsWizardRef = ref<{ skipSetup: () => Promise<void> } | null>(null);
const companySetupDismissed = ref(false);

function onCompanyFirstStepsCompleted() {
  companySetupDismissed.value = false;
  loadData();
}

function onCompanyFirstStepsSkipped() {
  companySetupDismissed.value = true;
}

function onSkipCompanyFirstStepsOutsideModal() {
  void companyFirstStepsWizardRef.value?.skipSetup();
}

onMounted(loadData);
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div v-if="showCompanyFirstSteps" class="setup-skip-outside">
      <b-button variant="outline-light" size="sm" @click="onSkipCompanyFirstStepsOutsideModal">
        Pular primeiros passos
      </b-button>
    </div>

    <CompanyFirstStepsWizard
      v-if="showCompanyFirstSteps"
      ref="companyFirstStepsWizardRef"
      :company-id="companyId"
      @completed="onCompanyFirstStepsCompleted"
      @skipped="onCompanyFirstStepsSkipped"
    />

    <div class="py-4">

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Dashboard</h1>
          <p class="text-muted mb-0 small text-capitalize">
            {{ greeting }}, {{ authStore.user?.name?.split(" ")[0] ?? "Gestor" }} — {{ today }}
          </p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <b-button v-if="canCreateBranch" variant="outline-primary" size="sm" @click="router.push({ name: 'company.branches.create' })">
            <i class="iconoir-plus me-1"></i> Nova filial
          </b-button>
          <b-button v-if="canViewBranches" variant="outline-secondary" size="sm" @click="router.push({ name: 'company.branches' })">
            <i class="iconoir-git-branch me-1"></i> Filiais
          </b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loading" class="text-muted py-4 text-center">Carregando dados da empresa...</div>

      <template v-else>

        <!-- KPI Cards -->
        <b-row class="g-3 mb-4">

          <b-col sm="6" xl="3">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div class="rounded-3 bg-primary bg-opacity-10 p-3">
                    <i class="iconoir-community fs-4 text-primary"></i>
                  </div>
                  <b-badge :variant="userVariant">{{ userPct }}%</b-badge>
                </div>
                <p class="text-muted small mb-1">Usuários</p>
                <h3 class="fw-bold mb-1">{{ usersUsed }} <span class="fs-6 text-muted fw-normal">/ {{ userLimit > 0 ? userLimit : "∞" }}</span></h3>
                <b-progress height="5px" class="mt-1">
                  <b-progress-bar :value="userPct" :variant="userVariant" />
                </b-progress>
                <small class="text-muted">vagas utilizadas</small>
              </b-card-body>
            </b-card>
          </b-col>

          <b-col sm="6" xl="3">
            <b-card class="border-0 shadow-sm h-100 cursor-pointer" @click="canViewBranches && router.push({ name: 'company.branches' })">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div class="rounded-3 bg-success bg-opacity-10 p-3">
                    <i class="iconoir-git-branch fs-4 text-success"></i>
                  </div>
                  <b-badge :variant="branchVariant">{{ branchPct }}%</b-badge>
                </div>
                <p class="text-muted small mb-1">Filiais</p>
                <h3 class="fw-bold mb-1">{{ branchesUsed }} <span class="fs-6 text-muted fw-normal">/ {{ branchLimit > 0 ? branchLimit : "∞" }}</span></h3>
                <b-progress height="5px" class="mt-1">
                  <b-progress-bar :value="branchPct" :variant="branchVariant" />
                </b-progress>
                <small class="text-muted">vagas utilizadas</small>
              </b-card-body>
            </b-card>
          </b-col>

          <b-col sm="6" xl="3">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div class="rounded-3 bg-info bg-opacity-10 p-3">
                    <i class="iconoir-frame fs-4 text-info"></i>
                  </div>
                </div>
                <p class="text-muted small mb-1">Setores</p>
                <h3 class="fw-bold mb-0">{{ sectorsTotal }}</h3>
                <small class="text-muted">por filial — abra uma filial em Filiais para gerir</small>
              </b-card-body>
            </b-card>
          </b-col>

          <b-col sm="6" xl="3">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div class="rounded-3 bg-warning bg-opacity-10 p-3">
                    <i class="iconoir-badge-check fs-4 text-warning"></i>
                  </div>
                </div>
                <p class="text-muted small mb-1">Meus perfis</p>
                <h3 class="fw-bold mb-0">{{ myRoles.length }}</h3>
                <small class="text-muted">atribuídos a este usuário</small>
              </b-card-body>
            </b-card>
          </b-col>

        </b-row>

        <!-- Linha 2: Gráficos (só com empresa carregada — evita Apex em estado vazio) -->
        <b-row v-if="company" class="g-3 mb-4">

          <!-- RadialBar: Ocupação do Plano -->
          <b-col lg="5">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="mb-1">
                  <h6 class="fw-semibold mb-0">Ocupação do Plano</h6>
                  <p class="text-muted small mb-0">Uso de usuários e filiais</p>
                </div>
                <VueApexCharts
                  type="radialBar"
                  height="300"
                  :options="occupancyOptions"
                  :series="occupancySeries"
                />
                <div class="d-flex justify-content-around mt-1">
                  <div class="text-center">
                    <p class="text-muted small mb-0">Usuários</p>
                    <strong class="small">{{ usersUsed }} / {{ userLimit > 0 ? userLimit : "∞" }}</strong>
                  </div>
                  <div class="text-center">
                    <p class="text-muted small mb-0">Filiais</p>
                    <strong class="small">{{ branchesUsed }} / {{ branchLimit > 0 ? branchLimit : "∞" }}</strong>
                  </div>
                </div>
              </b-card-body>
            </b-card>
          </b-col>

          <!-- Donut: Usuarios por Perfil -->
          <b-col lg="7">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="mb-1">
                  <h6 class="fw-semibold mb-0">Usuarios por Perfil</h6>
                  <p class="text-muted small mb-0">Distribuição de perfis na empresa</p>
                </div>
                <VueApexCharts
                  type="donut"
                  height="300"
                  :options="donutOptions"
                  :series="donutSeries"
                />
              </b-card-body>
            </b-card>
          </b-col>

        </b-row>

        <!-- Linha 3: Filiais + Usuarios recentes -->
        <b-row class="g-3 mb-4">

          <b-col lg="6">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 class="fw-semibold mb-0">Filiais</h6>
                    <p class="text-muted small mb-0">Unidades cadastradas</p>
                  </div>
                  <b-button v-if="canViewBranches" size="sm" variant="outline-primary" @click="router.push({ name: 'company.branches' })">
                    Ver todas
                  </b-button>
                </div>
                <div v-if="branches.length" class="d-flex flex-column gap-2">
                  <div
                    v-for="branch in branches"
                    :key="branch.id"
                    class="d-flex align-items-center gap-3 p-2 rounded border bg-light-subtle"
                  >
                    <div
                      class="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center text-success fw-bold flex-shrink-0"
                      style="width:36px;height:36px;font-size:13px"
                    >
                      {{ (branch.name ?? "F").charAt(0).toUpperCase() }}
                    </div>
                    <div class="flex-grow-1 min-width-0">
                      <p class="mb-0 small fw-medium text-truncate">{{ branch.name }}</p>
                      <p class="mb-0 text-muted" style="font-size:11px">{{ branch.city ? `${branch.city}/${branch.state}` : branch.cnpj ?? "—" }}</p>
                    </div>
                    <b-badge variant="light" class="text-dark flex-shrink-0" style="font-size:10px">
                      {{ branch.cnpj ? branch.cnpj.slice(0, 8) + "…" : "—" }}
                    </b-badge>
                  </div>
                </div>
                <p v-else class="text-muted small mb-0">Nenhuma filial cadastrada.</p>
              </b-card-body>
            </b-card>
          </b-col>

          <b-col lg="6">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 class="fw-semibold mb-0">Usuarios</h6>
                    <p class="text-muted small mb-0">Mais recentes no sistema</p>
                  </div>
                  <b-button v-if="canViewUsers" size="sm" variant="outline-primary" @click="router.push({ name: 'company.my-company.view' })">
                    Ver empresa
                  </b-button>
                </div>
                <div v-if="recentUsers.length" class="d-flex flex-column gap-2">
                  <div
                    v-for="user in recentUsers"
                    :key="user.id"
                    class="d-flex align-items-center gap-3 p-2 rounded border bg-light-subtle"
                  >
                    <div
                      class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fw-bold flex-shrink-0"
                      style="width:36px;height:36px;font-size:13px"
                    >
                      {{ (user.name ?? "U").charAt(0).toUpperCase() }}
                    </div>
                    <div class="flex-grow-1 min-width-0">
                      <p class="mb-0 small fw-medium text-truncate">{{ user.name }}</p>
                      <p class="mb-0 text-muted text-truncate" style="font-size:11px">{{ user.email }}</p>
                    </div>
                    <div class="flex-shrink-0 d-flex flex-wrap gap-1 justify-content-end" style="max-width:120px">
                      <b-badge
                        v-for="role in (user.roles ?? []).slice(0, 1)"
                        :key="role.id"
                        variant="light"
                        class="text-dark"
                        style="font-size:10px"
                      >
                        {{ role.name }}
                      </b-badge>
                    </div>
                  </div>
                </div>
                <p v-else class="text-muted small mb-0">Nenhum usuário registrado.</p>
              </b-card-body>
            </b-card>
          </b-col>

        </b-row>

        <!-- Linha 4: Info empresa + Meus perfis -->
        <b-row class="g-3">

          <b-col lg="8">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 class="fw-semibold mb-0">Dados da empresa</h6>
                    <p class="text-muted small mb-0">Informação cadastral</p>
                  </div>
                  <b-button size="sm" variant="outline-secondary" @click="router.push({ name: 'company.my-company.view' })">
                    <i class="iconoir-eye me-1"></i> Ver
                  </b-button>
                </div>
                <b-row class="g-2">
                  <b-col cols="6" md="4">
                    <p class="text-muted small mb-1">Nome</p>
                    <p class="mb-0 fw-medium small">{{ company?.name || "—" }}</p>
                  </b-col>
                  <b-col cols="6" md="4">
                    <p class="text-muted small mb-1">CNPJ</p>
                    <p class="mb-0 fw-medium small">{{ company?.cnpj || "—" }}</p>
                  </b-col>
                  <b-col cols="6" md="4">
                    <p class="text-muted small mb-1">E-mail</p>
                    <p class="mb-0 fw-medium small text-truncate">{{ company?.email || "—" }}</p>
                  </b-col>
                  <b-col cols="6" md="4">
                    <p class="text-muted small mb-1">Telefone</p>
                    <p class="mb-0 fw-medium small">{{ company?.phone || "—" }}</p>
                  </b-col>
                  <b-col cols="6" md="4">
                    <p class="text-muted small mb-1">Município</p>
                    <p class="mb-0 fw-medium small">{{ company?.city ? `${company.city}/${company.state}` : "—" }}</p>
                  </b-col>
                  <b-col cols="6" md="4">
                    <p class="text-muted small mb-1">CEP</p>
                    <p class="mb-0 fw-medium small">{{ company?.zip_code || "—" }}</p>
                  </b-col>
                </b-row>
              </b-card-body>
            </b-card>
          </b-col>

          <b-col lg="4">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <h6 class="fw-semibold mb-3">Meus perfis</h6>
                <div v-if="myRoles.length" class="d-flex flex-wrap gap-2">
                  <b-badge v-for="role in myRoles" :key="role.id" variant="light" class="text-dark">
                    {{ role.name }}
                  </b-badge>
                </div>
                <p v-else class="text-muted small mb-0">Sem perfis atribuídos.</p>
              </b-card-body>
            </b-card>
          </b-col>

        </b-row>

      </template>
    </div>
  </component>
</template>

<style scoped>
.setup-skip-outside {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1070;
}
</style>
