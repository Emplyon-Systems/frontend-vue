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
const VueApexCharts = defineAsyncComponent(() => import("vue3-apexcharts"));
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import BranchSetupWizard from "@/views/panels/branch/setup/BranchSetupWizard.vue";
import { branchesApi, sectorsApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";
import type { BranchRecord, UserRole } from "@/types/api";
import type { SectorPluckItem } from "@/api/resources/sectors";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const loadError = ref("");
const branch = ref<BranchRecord | null>(null);
const sectors = ref<SectorPluckItem[]>([]);

const branchId = computed(() => {
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  const fromPivot = Number(authStore.user?.branches?.[0]?.id ?? 0);
  if (fromPivot > 0) return fromPivot;
  for (const r of authStore.user?.roles ?? []) {
    const id = Number(r.branch_id ?? 0);
    if (id > 0) return id;
    const m = String(r.slug ?? "").match(/-b(\d+)$/);
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

const users              = computed(() => branch.value?.users ?? []);
const usersCount         = computed(() => users.value.length);
const managersCount      = computed(() =>
  users.value.filter((u) =>
    (u.roles ?? []).some(
      (r) =>
        r.slug === "branch_manager" ||
        r.slug?.startsWith("filial-b") ||
        r.slug?.startsWith("setor-b")
    )
  ).length
);
const collaboratorsCount = computed(() =>
  users.value.filter((u) =>
    (u.roles ?? []).some((r) => r.slug === "colaborador" || r.slug?.startsWith("colaborador-b"))
  ).length
);
const otherUsersCount    = computed(() => Math.max(0, usersCount.value - managersCount.value - collaboratorsCount.value));

const uniqueRoles = computed(() => {
  const map = new Map<number, UserRole>();
  for (const user of users.value)
    for (const role of user.roles ?? [])
      if (!map.has(role.id)) map.set(role.id, role);
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const myRoles = computed(() => authStore.user?.roles ?? []);

const canViewSectors = computed(() => authStore.hasPermission("sectors.index") || authStore.hasPermission("sectors.read"));
const canEditBranch  = computed(() => authStore.hasPermission("branches.update"));

function formatTime(v?: string): string {
  const m = String(v ?? "").match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "—";
}

// ── Gráficos Apex: shallowRef + markRaw (evita travão no painel filial) ───
const teamSeries = shallowRef<number[]>([1]);
const teamOptions = shallowRef<Record<string, unknown>>({});
const rolesBarSeries = shallowRef<{ name: string; data: number[] }[]>([{ name: "Usuarios", data: [] }]);
const rolesBarOptions = shallowRef<Record<string, unknown>>({});
const rolesBarHasData = ref(false);

watch(
  () =>
    [
      managersCount.value,
      collaboratorsCount.value,
      otherUsersCount.value,
      usersCount.value,
    ] as const,
  ([mgr, coll, oth, total]) => {
    const raw = [
      { label: "Gerentes", value: mgr, color: "#ffc107" },
      { label: "Colaboradores", value: coll, color: "#198754" },
      { label: "Outros", value: oth, color: "#0dcaf0" },
    ].filter((e) => e.value > 0);
    const hasData = raw.length > 0;
    teamSeries.value = hasData ? raw.map((e) => e.value) : [1];
    teamOptions.value = markRaw({
      chart: { type: "donut" as const },
      labels: hasData ? raw.map((e) => e.label) : ["Sem dados"],
      colors: hasData ? raw.map((e) => e.color) : ["#dee2e6"],
      legend: { position: "bottom" as const, fontSize: "12px" },
      dataLabels: { enabled: hasData },
      tooltip: { y: { formatter: (v: number) => `${v} usuário${v !== 1 ? "es" : ""}` } },
      plotOptions: {
        pie: {
          donut: {
            size: "58%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total",
                fontSize: "13px",
                fontWeight: 700,
                formatter: () => String(total),
              },
            },
          },
        },
      },
    });
  },
  { immediate: true }
);

watch(
  () => users.value,
  (list) => {
    const counts: Record<string, number> = {};
    for (const u of list)
      for (const role of u.roles ?? []) counts[role.name] = (counts[role.name] ?? 0) + 1;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    rolesBarHasData.value = entries.length > 0;
    rolesBarSeries.value = [{ name: "Usuarios", data: entries.map(([, v]) => v) }];
    rolesBarOptions.value = markRaw({
      chart: { type: "bar" as const, toolbar: { show: false } },
      colors: ["#0d6efd"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: entries.map(([k]) => k),
        labels: { style: { fontSize: "11px" } },
      },
      yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
      grid: { strokeDashArray: 4, borderColor: "#f0f0f0" },
      plotOptions: { bar: { borderRadius: 4, columnWidth: "50%", horizontal: entries.length > 5 } },
      tooltip: { y: { formatter: (v: number) => `${v} usuário${v !== 1 ? "es" : ""}` } },
    });
  },
  { immediate: true, deep: true }
);

const showSetupWizard = ref(false);
const branchSetupWizardRef = ref<{ skipSetup: () => Promise<void> } | null>(null);
const branchSetupDismissed = ref(false);

async function loadData() {
  loadError.value = "";
  loading.value = true;
  if (!branchId.value) {
    loadError.value = "Filial não identificada no contexto atual.";
    loading.value = false;
    return;
  }
  try {
    const [branchRes, sectorsRes] = await Promise.all([
      branchesApi.getById(branchId.value),
      sectorsApi.plucks({ branch_id: branchId.value }).catch(() => [] as SectorPluckItem[]),
    ]);
    branch.value  = branchRes.branch ?? null;
    sectors.value = sectorsRes;
    showSetupWizard.value = Boolean(
      branch.value &&
      !branch.value.setup_completed_at &&
      !branchSetupDismissed.value
    );
    if (!branch.value) loadError.value = "Filial não encontrada.";
  } catch {
    loadError.value = "Não foi possível carregar os dados da filial.";
  } finally {
    loading.value = false;
  }
}

function onSetupCompleted() {
  branchSetupDismissed.value = false;
  showSetupWizard.value = false;
  loadData();
}

function onSetupSkipped() {
  branchSetupDismissed.value = true;
  showSetupWizard.value = false;
}

function onSkipBranchSetupOutsideModal() {
  void branchSetupWizardRef.value?.skipSetup();
}

onMounted(loadData);
</script>

<template>
  <DefaultLayout>
    <div v-if="showSetupWizard" class="setup-skip-outside">
      <b-button variant="outline-light" size="sm" @click="onSkipBranchSetupOutsideModal">
        Pular configuração inicial
      </b-button>
    </div>

    <!-- Wizard de configuração inicial (modal sobre o dashboard) -->
    <BranchSetupWizard
      v-if="showSetupWizard"
      ref="branchSetupWizardRef"
      @completed="onSetupCompleted"
      @skipped="onSetupSkipped"
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
          <b-button variant="outline-primary" size="sm" @click="router.push({ name: 'branch.my-branch.view' })">
            <i class="iconoir-eye me-1"></i> Minha filial
          </b-button>
          <b-button v-if="canEditBranch" variant="outline-secondary" size="sm" @click="router.push({ name: 'branch.my-branch.edit' })">
            <i class="iconoir-edit me-1"></i> Editar
          </b-button>
          <b-button v-if="canViewSectors" variant="outline-secondary" size="sm" @click="router.push({ name: 'branch.sectors' })">
            <i class="iconoir-community me-1"></i> Setores
          </b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loading" class="text-muted py-4 text-center">Carregando dados da filial...</div>

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
                  <b-badge variant="primary">{{ usersCount }}</b-badge>
                </div>
                <p class="text-muted small mb-1">Usuarios</p>
                <h3 class="fw-bold mb-0">{{ usersCount }}</h3>
                <small class="text-muted">com acesso à filial</small>
              </b-card-body>
            </b-card>
          </b-col>

          <b-col sm="6" xl="3">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div class="rounded-3 bg-warning bg-opacity-10 p-3">
                    <i class="iconoir-user fs-4 text-warning"></i>
                  </div>
                  <b-badge variant="warning">{{ managersCount }}</b-badge>
                </div>
                <p class="text-muted small mb-1">Gerentes</p>
                <h3 class="fw-bold mb-0">{{ managersCount }}</h3>
                <small class="text-muted">perfil de gerente</small>
              </b-card-body>
            </b-card>
          </b-col>

          <b-col sm="6" xl="3">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div class="rounded-3 bg-success bg-opacity-10 p-3">
                    <i class="iconoir-user-love fs-4 text-success"></i>
                  </div>
                  <b-badge variant="success">{{ collaboratorsCount }}</b-badge>
                </div>
                <p class="text-muted small mb-1">Colaboradores</p>
                <h3 class="fw-bold mb-0">{{ collaboratorsCount }}</h3>
                <small class="text-muted">perfil colaborador</small>
              </b-card-body>
            </b-card>
          </b-col>

          <b-col sm="6" xl="3">
            <b-card class="border-0 shadow-sm h-100 cursor-pointer" @click="canViewSectors && router.push({ name: 'branch.sectors' })">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div class="rounded-3 bg-info bg-opacity-10 p-3">
                    <i class="iconoir-frame fs-4 text-info"></i>
                  </div>
                  <b-badge variant="info">{{ sectors.length }}</b-badge>
                </div>
                <p class="text-muted small mb-1">Setores</p>
                <h3 class="fw-bold mb-0">{{ sectors.length }}</h3>
                <small class="text-muted">nesta filial</small>
              </b-card-body>
            </b-card>
          </b-col>

        </b-row>

        <!-- Linha 2: Gráficos ───────────────────────────────────────────── -->
        <b-row class="g-3 mb-4">

          <!-- Donut: Composição da Equipe -->
          <b-col lg="4">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="mb-1">
                  <h6 class="fw-semibold mb-0">Composição da Equipe</h6>
                  <p class="text-muted small mb-0">Distribuição por tipo de perfil</p>
                </div>
                <VueApexCharts
                  type="donut"
                  height="280"
                  :options="teamOptions"
                  :series="teamSeries"
                />
              </b-card-body>
            </b-card>
          </b-col>

          <!-- Bar: Usuarios por Perfil -->
          <b-col lg="8">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="mb-1">
                  <h6 class="fw-semibold mb-0">Usuarios por Perfil</h6>
                  <p class="text-muted small mb-0">Quantidade de Usuarios em cada perfil</p>
                </div>
                <template v-if="rolesBarHasData">
                  <VueApexCharts
                    type="bar"
                    height="260"
                    :options="rolesBarOptions"
                    :series="rolesBarSeries"
                  />
                </template>
                <div v-else class="d-flex align-items-center justify-content-center h-75 text-muted">
                  <p class="small mb-0">Sem perfis atribuídos a Usuarios desta filial.</p>
                </div>
              </b-card-body>
            </b-card>
          </b-col>

        </b-row>

        <!-- Linha 3: Dados da unidade + Usuarios -->
        <b-row class="g-3 mb-4">

          <b-col lg="5">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 class="fw-semibold mb-0">Dados da unidade</h6>
                    <p class="text-muted small mb-0">Identificação e horários</p>
                  </div>
                  <b-button v-if="canEditBranch" size="sm" variant="outline-secondary" @click="router.push({ name: 'branch.my-branch.edit' })">
                    <i class="iconoir-edit"></i>
                  </b-button>
                </div>
                <div class="d-flex flex-column gap-0">
                  <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span class="text-muted small">Filial</span>
                    <strong class="small">{{ branch?.name || "—" }}</strong>
                  </div>
                  <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span class="text-muted small">Empresa</span>
                    <strong class="small">{{ branch?.company?.name || "—" }}</strong>
                  </div>
                  <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span class="text-muted small">CNPJ</span>
                    <strong class="small">{{ branch?.cnpj || "—" }}</strong>
                  </div>
                  <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span class="text-muted small">Localização</span>
                    <strong class="small">{{ branch?.city ? `${branch.city}/${branch.state}` : "—" }}</strong>
                  </div>
                  <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span class="text-muted small">Expediente</span>
                    <strong class="small">{{ formatTime(branch?.expedient_start_time) }} – {{ formatTime(branch?.expedient_end_time) }}</strong>
                  </div>
                  <div class="d-flex justify-content-between align-items-center py-2">
                    <span class="text-muted small">Loja (clientes)</span>
                    <strong class="small">{{ formatTime(branch?.store_open_time) }} – {{ formatTime(branch?.store_close_time) }}</strong>
                  </div>
                </div>
              </b-card-body>
            </b-card>
          </b-col>

          <b-col lg="7">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 class="fw-semibold mb-0">Usuarios da filial</h6>
                    <p class="text-muted small mb-0">Todos com acesso a esta unidade</p>
                  </div>
                  <div class="d-flex gap-1 flex-wrap">
                    <b-badge variant="light" class="text-muted" style="font-size:10px">{{ managersCount }} gerente{{ managersCount !== 1 ? "s" : "" }}</b-badge>
                    <b-badge variant="light" class="text-muted" style="font-size:10px">{{ collaboratorsCount }} colaborador{{ collaboratorsCount !== 1 ? "es" : "" }}</b-badge>
                  </div>
                </div>
                <div v-if="users.length" class="d-flex flex-column gap-2" style="max-height:260px;overflow-y:auto">
                  <div
                    v-for="user in users"
                    :key="user.id"
                    class="d-flex align-items-center gap-3 p-2 rounded border bg-light-subtle"
                  >
                    <div
                      class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fw-bold flex-shrink-0"
                      style="width:34px;height:34px;font-size:13px"
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
                <p v-else class="text-muted small mb-0">Nenhum usuário vinculado a esta filial.</p>
              </b-card-body>
            </b-card>
          </b-col>

        </b-row>

        <!-- Linha 4: Setores + Perfis -->
        <b-row class="g-3">

          <b-col lg="6">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 class="fw-semibold mb-0">Setores</h6>
                    <p class="text-muted small mb-0">Divisões desta filial</p>
                  </div>
                  <b-button v-if="canViewSectors" size="sm" variant="outline-primary" @click="router.push({ name: 'branch.sectors' })">
                    Gerir
                  </b-button>
                </div>
                <div v-if="sectors.length" class="d-flex flex-wrap gap-2">
                  <div
                    v-for="sector in sectors"
                    :key="sector.id"
                    class="d-flex align-items-center gap-2 px-3 py-2 rounded border bg-light-subtle"
                  >
                    <div class="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0" style="width:28px;height:28px">
                      <i class="iconoir-frame text-info" style="font-size:13px"></i>
                    </div>
                    <span class="small fw-medium">{{ sector.name }}</span>
                  </div>
                </div>
                <p v-else class="text-muted small mb-0">Nenhum setor cadastrado nesta filial.</p>
              </b-card-body>
            </b-card>
          </b-col>

          <b-col lg="6">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body>
                <div class="mb-4">
                  <h6 class="fw-semibold mb-2">Perfis em uso na filial</h6>
                  <div v-if="uniqueRoles.length" class="d-flex flex-wrap gap-2">
                    <b-badge v-for="role in uniqueRoles" :key="role.id" variant="light" class="text-dark">
                      {{ role.name }}
                    </b-badge>
                  </div>
                  <p v-else class="text-muted small mb-0">Sem perfis vinculados.</p>
                </div>
                <div>
                  <h6 class="fw-semibold mb-2">Meus perfis</h6>
                  <div v-if="myRoles.length" class="d-flex flex-wrap gap-2">
                    <b-badge v-for="role in myRoles" :key="role.id" variant="primary" class="bg-opacity-75">
                      {{ role.name }}
                    </b-badge>
                  </div>
                  <p v-else class="text-muted small mb-0">Sem perfis atribuídos.</p>
                </div>
              </b-card-body>
            </b-card>
          </b-col>

        </b-row>

      </template>
    </div>
  </DefaultLayout>
</template>

<style scoped>
.setup-skip-outside {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1070;
}
</style>
