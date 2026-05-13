<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed, onMounted, ref } from "vue";
import VueApexCharts from "vue3-apexcharts";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAuthStore } from "@/stores/auth";
import { branchesApi, companiesApi, usersApi } from "@/api/resources";

const router = useRouter();
const auth = useAuthStore();
const isSuperadmin = computed(() => auth.hasRole("superadmin"));

const usersTotal    = ref<number | null>(null);
const companiesTotal = ref<number | null>(null);
const branchesTotal  = ref<number | null>(null);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
});

const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

// ── Mock KPIs ──────────────────────────────────────────────────────────────
const mrr      = ref(28_450);
const mrrGrowth = ref(12.4);
const churnRate = ref(2.1);
const avgUsersPerCompany = ref(8.3);
const planOccupancy = ref(74); // % de vagas usadas no sistema

// ── Mock — Receita mensal (12 meses) ───────────────────────────────────────
const revenueChart = {
  series: [{ name: "Receita (R$)", data: [18200, 19800, 21000, 20400, 22600, 23100, 24300, 25800, 26100, 27400, 27900, 28450] }],
  options: {
    chart: { type: "area", toolbar: { show: false }, sparkline: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
    colors: ["#0d6efd"],
    xaxis: { categories: ["Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar"] },
    yaxis: { labels: { formatter: (v: number) => `R$ ${(v / 1000).toFixed(0)}k` } },
    tooltip: { y: { formatter: (v: number) => `R$ ${v.toLocaleString("pt-BR")}` } },
    grid: { strokeDashArray: 4, borderColor: "#f0f0f0" },
  },
};

// ── Mock — Empresas por plano ───────────────────────────────────────────────
const planChart = {
  series: [14, 9, 5, 2],
  options: {
    chart: { type: "donut" },
    labels: ["Starter", "Pro", "Business", "Enterprise"],
    colors: ["#0d6efd", "#198754", "#ffc107", "#dc3545"],
    legend: { position: "bottom" },
    dataLabels: { enabled: true },
    tooltip: { y: { formatter: (v: number) => `${v} empresas` } },
    plotOptions: { pie: { donut: { size: "60%" } } },
  },
};

// ── Mock — Novos usuários por mês ───────────────────────────────────────────
const usersGrowthChart = {
  series: [{ name: "Novos usuários", data: [12, 18, 14, 22, 19, 28, 24, 31, 27, 35, 30, 38] }],
  options: {
    chart: { type: "bar", toolbar: { show: false } },
    colors: ["#198754"],
    dataLabels: { enabled: false },
    xaxis: { categories: ["Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar"] },
    yaxis: { labels: { formatter: (v: number) => `${v}` } },
    grid: { strokeDashArray: 4, borderColor: "#f0f0f0" },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
  },
};

// ── Mock — Empresas recentes ────────────────────────────────────────────────
const recentCompanies = [
  { name: "TechVision Ltda",   plan: "Pro",        users: 12, branches: 3, status: "ativa",    created: "24/03/2026" },
  { name: "MercadoFlex SA",    plan: "Business",   users: 28, branches: 7, status: "ativa",    created: "21/03/2026" },
  { name: "SoftEdge ME",       plan: "Starter",    users: 4,  branches: 1, status: "ativa",    created: "18/03/2026" },
  { name: "LogiPrime Ltda",    plan: "Pro",        users: 9,  branches: 2, status: "inativa",  created: "15/03/2026" },
  { name: "InovaHub Coworking",plan: "Enterprise", users: 42, branches: 9, status: "ativa",    created: "10/03/2026" },
];

const planBadge: Record<string, string> = {
  Starter: "secondary", Pro: "primary", Business: "warning", Enterprise: "danger",
};

onMounted(async () => {
  try {
    const [usersRes, branchesRes, companiesRes] = await Promise.all([
      usersApi.list({ per_page: 1 }),
      branchesApi.list({ per_page: 1 }),
      isSuperadmin.value ? companiesApi.list({ per_page: 1 }) : Promise.resolve(null),
    ]);
    usersTotal.value    = usersRes.users?.total ?? 0;
    branchesTotal.value = branchesRes.branches?.total ?? 0;
    companiesTotal.value = companiesRes?.companies?.total ?? 0;
  } catch {
    usersTotal.value = 0;
    branchesTotal.value = 0;
    if (isSuperadmin.value) companiesTotal.value = 0;
  }
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">

      <!-- Header -->
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Dashboard Emplyon</h1>
          <p class="text-muted mb-0 small text-capitalize">{{ greeting }}, {{ auth.user?.name?.split(" ")[0] ?? "Admin" }} — {{ today }}</p>
        </div>
        <div class="d-flex gap-2">
          <b-button variant="outline-primary" size="sm" @click="router.push({ name: 'owner.companies' })">
            <i class="iconoir-plus me-1"></i> Nova empresa
          </b-button>
          <b-button variant="outline-secondary" size="sm" @click="router.push({ name: 'owner.users' })">
            <i class="iconoir-user-plus me-1"></i> Novo usuário
          </b-button>
        </div>
      </div>

      <!-- KPI Cards -->
      <b-row class="g-3 mb-4">

        <!-- MRR -->
        <b-col sm="6" xl="3">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body>
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="rounded-3 bg-primary bg-opacity-10 p-3">
                  <i class="iconoir-dollar fs-4 text-primary"></i>
                </div>
                <b-badge variant="success" class="d-flex align-items-center gap-1">
                  <i class="iconoir-arrow-up-right" style="font-size: 11px"></i>
                  {{ mrrGrowth }}%
                </b-badge>
              </div>
              <p class="text-muted small mb-1">Receita Mensal (MRR)</p>
              <h3 class="fw-bold mb-0">R$ {{ mrr.toLocaleString("pt-BR") }}</h3>
              <small class="text-muted">vs. mês anterior</small>
            </b-card-body>
          </b-card>
        </b-col>

        <!-- Empresas -->
        <b-col sm="6" xl="3">
          <b-card class="border-0 shadow-sm h-100 cursor-pointer" @click="router.push({ name: 'owner.companies' })">
            <b-card-body>
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="rounded-3 bg-success bg-opacity-10 p-3">
                  <i class="iconoir-building fs-4 text-success"></i>
                </div>
                <b-badge variant="success" class="d-flex align-items-center gap-1">
                  <i class="iconoir-arrow-up-right" style="font-size: 11px"></i>+3
                </b-badge>
              </div>
              <p class="text-muted small mb-1">Empresas ativas</p>
              <h3 class="fw-bold mb-0">{{ companiesTotal !== null ? companiesTotal : "—" }}</h3>
              <small class="text-muted">este mês</small>
            </b-card-body>
          </b-card>
        </b-col>

        <!-- Usuários -->
        <b-col sm="6" xl="3">
          <b-card class="border-0 shadow-sm h-100 cursor-pointer" @click="router.push({ name: 'owner.users' })">
            <b-card-body>
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="rounded-3 bg-info bg-opacity-10 p-3">
                  <i class="iconoir-community fs-4 text-info"></i>
                </div>
                <span class="text-muted small">~{{ avgUsersPerCompany }}/empresa</span>
              </div>
              <p class="text-muted small mb-1">Usuários no sistema</p>
              <h3 class="fw-bold mb-0">{{ usersTotal !== null ? usersTotal : "—" }}</h3>
              <small class="text-muted">em todas as empresas</small>
            </b-card-body>
          </b-card>
        </b-col>

        <!-- Ocupação -->
        <b-col sm="6" xl="3">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body>
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="rounded-3 bg-warning bg-opacity-10 p-3">
                  <i class="iconoir-stats-up-square fs-4 text-warning"></i>
                </div>
                <b-badge :variant="planOccupancy > 85 ? 'danger' : planOccupancy > 65 ? 'warning' : 'success'">
                  {{ planOccupancy }}%
                </b-badge>
              </div>
              <p class="text-muted small mb-1">Ocupação de vagas</p>
              <h3 class="fw-bold mb-0">{{ planOccupancy }}%</h3>
              <b-progress class="mt-2" height="6px">
                <b-progress-bar
                  :value="planOccupancy"
                  :variant="planOccupancy > 85 ? 'danger' : planOccupancy > 65 ? 'warning' : 'success'"
                />
              </b-progress>
            </b-card-body>
          </b-card>
        </b-col>

      </b-row>

      <!-- Linha 2: Receita + Planos -->
      <b-row class="g-3 mb-4">

        <b-col lg="8">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body>
              <div class="d-flex justify-content-between align-items-center mb-1">
                <div>
                  <h6 class="fw-semibold mb-0">Evolução da Receita</h6>
                  <p class="text-muted small mb-0">Últimos 12 meses</p>
                </div>
                <b-badge variant="primary" class="px-3 py-2">MRR</b-badge>
              </div>
              <VueApexCharts
                type="area"
                height="240"
                :options="revenueChart.options"
                :series="revenueChart.series"
              />
            </b-card-body>
          </b-card>
        </b-col>

        <b-col lg="4">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body>
              <h6 class="fw-semibold mb-0">Empresas por Plano</h6>
              <p class="text-muted small mb-0">Distribuição atual</p>
              <VueApexCharts
                type="donut"
                height="260"
                :options="planChart.options"
                :series="planChart.series"
              />
            </b-card-body>
          </b-card>
        </b-col>

      </b-row>

      <!-- Linha 3: Crescimento usuários + Métricas rápidas -->
      <b-row class="g-3 mb-4">

        <b-col lg="6">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body>
              <div class="d-flex justify-content-between align-items-center mb-1">
                <div>
                  <h6 class="fw-semibold mb-0">Novos Usuários</h6>
                  <p class="text-muted small mb-0">Cadastros mensais</p>
                </div>
              </div>
              <VueApexCharts
                type="bar"
                height="220"
                :options="usersGrowthChart.options"
                :series="usersGrowthChart.series"
              />
            </b-card-body>
          </b-card>
        </b-col>

        <b-col lg="6">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body>
              <h6 class="fw-semibold mb-3">Indicadores de Saúde</h6>
              <div class="d-flex flex-column gap-3">

                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-danger bg-opacity-10 p-2">
                      <i class="iconoir-user-x text-danger" style="font-size:14px"></i>
                    </div>
                    <div>
                      <p class="mb-0 small fw-medium">Taxa de Churn</p>
                      <p class="mb-0 text-muted" style="font-size:11px">Cancelamentos no mês</p>
                    </div>
                  </div>
                  <span class="fw-bold text-danger">{{ churnRate }}%</span>
                </div>

                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-primary bg-opacity-10 p-2">
                      <i class="iconoir-git-branch text-primary" style="font-size:14px"></i>
                    </div>
                    <div>
                      <p class="mb-0 small fw-medium">Total de Filiais</p>
                      <p class="mb-0 text-muted" style="font-size:11px">No sistema</p>
                    </div>
                  </div>
                  <span class="fw-bold">{{ branchesTotal !== null ? branchesTotal : "—" }}</span>
                </div>

                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-success bg-opacity-10 p-2">
                      <i class="iconoir-community text-success" style="font-size:14px"></i>
                    </div>
                    <div>
                      <p class="mb-0 small fw-medium">Média usuários/empresa</p>
                      <p class="mb-0 text-muted" style="font-size:11px">Engajamento médio</p>
                    </div>
                  </div>
                  <span class="fw-bold">{{ avgUsersPerCompany }}</span>
                </div>

                <div class="d-flex justify-content-between align-items-center py-2">
                  <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-warning bg-opacity-10 p-2">
                      <i class="iconoir-dollar text-warning" style="font-size:14px"></i>
                    </div>
                    <div>
                      <p class="mb-0 small fw-medium">Ticket médio mensal</p>
                      <p class="mb-0 text-muted" style="font-size:11px">Por empresa ativa</p>
                    </div>
                  </div>
                  <span class="fw-bold">
                    R$ {{ companiesTotal ? Math.round(mrr / (companiesTotal || 1)).toLocaleString("pt-BR") : "—" }}
                  </span>
                </div>

              </div>
            </b-card-body>
          </b-card>
        </b-col>

      </b-row>

      <!-- Linha 4: Empresas recentes -->
      <b-row class="g-3">
        <b-col cols="12">
          <b-card class="border-0 shadow-sm">
            <b-card-body>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 class="fw-semibold mb-0">Empresas Recentes</h6>
                  <p class="text-muted small mb-0">Últimos cadastros no sistema</p>
                </div>
                <b-button size="sm" variant="outline-primary" @click="router.push({ name: 'owner.companies' })">
                  Ver todas
                </b-button>
              </div>
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="small text-muted fw-medium">Empresa</th>
                      <th class="small text-muted fw-medium">Plano</th>
                      <th class="small text-muted fw-medium text-center">Usuários</th>
                      <th class="small text-muted fw-medium text-center">Filiais</th>
                      <th class="small text-muted fw-medium text-center">Status</th>
                      <th class="small text-muted fw-medium">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in recentCompanies" :key="c.name">
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div
                            class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center text-primary fw-bold"
                            style="width:34px;height:34px;font-size:13px;flex-shrink:0"
                          >
                            {{ c.name.charAt(0) }}
                          </div>
                          <span class="fw-medium small">{{ c.name }}</span>
                        </div>
                      </td>
                      <td>
                        <b-badge :variant="planBadge[c.plan] ?? 'secondary'" class="px-2">{{ c.plan }}</b-badge>
                      </td>
                      <td class="text-center small">{{ c.users }}</td>
                      <td class="text-center small">{{ c.branches }}</td>
                      <td class="text-center">
                        <b-badge :variant="c.status === 'ativa' ? 'success' : 'danger'" class="px-2">
                          {{ c.status }}
                        </b-badge>
                      </td>
                      <td class="small text-muted">{{ c.created }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>

    </div>
  </DefaultLayout>
</template>
