<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import { branchesApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";
import type { BranchRecord, UserRole } from "@/types/api";

const authStore = useAuthStore();
const loading = ref(true);
const loadError = ref("");
const branch = ref<BranchRecord | null>(null);

const branchId = computed(() => {
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.id ?? 0);
});

const users = computed(() => branch.value?.users ?? []);
const usersCount = computed(() => users.value.length);
const managersCount = computed(() =>
  users.value.filter((u) =>
    (u.roles ?? []).some((role) => role.slug === "branch_manager" || role.slug?.startsWith("filial-b"))
  ).length
);
const collaboratorsCount = computed(() =>
  users.value.filter((u) =>
    (u.roles ?? []).some((role) => role.slug === "colaborador" || role.slug?.startsWith("colaborador-b"))
  ).length
);
const uniqueRolesCount = computed(() => {
  const ids = new Set<number>();
  for (const user of users.value) for (const role of user.roles ?? []) ids.add(role.id);
  return ids.size;
});

const uniqueRoles = computed(() => {
  const map = new Map<number, UserRole>();
  for (const user of users.value) {
    for (const role of user.roles ?? []) {
      if (!map.has(role.id)) map.set(role.id, role);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
});

async function loadBranch() {
  loadError.value = "";
  loading.value = true;
  if (!branchId.value) {
    loadError.value = "Filial não identificada no contexto atual.";
    loading.value = false;
    return;
  }

  try {
    const response = await branchesApi.getById(branchId.value);
    branch.value = response.branch ?? null;
    if (!branch.value) loadError.value = "Filial não encontrada.";
  } catch {
    loadError.value = "Não foi possível carregar os dados da filial.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadBranch);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Dashboard Filial</h1>
          <p class="text-muted mb-0 small">Visão operacional com dados reais da sua filial.</p>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loading" class="text-muted">A carregar dados da filial...</div>

      <template v-else>
        <b-row class="g-3 mb-4">
          <b-col sm="6" md="3">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body class="text-center">
                <div class="rounded-3 bg-primary bg-opacity-10 p-3 d-inline-block mb-2">
                  <i class="iconoir-user-group fs-2 text-primary"></i>
                </div>
                <h6 class="text-muted mb-0 small">Utilizadores da filial</h6>
                <span class="h4 mb-0 fw-bold d-block">{{ usersCount }}</span>
                <small class="text-muted">com acesso à unidade</small>
              </b-card-body>
            </b-card>
          </b-col>
          <b-col sm="6" md="3">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body class="text-center">
                <div class="rounded-3 bg-success bg-opacity-10 p-3 d-inline-block mb-2">
                  <i class="iconoir-badge-check fs-2 text-success"></i>
                </div>
                <h6 class="text-muted mb-0 small">Perfis na filial</h6>
                <span class="h4 mb-0 fw-bold d-block">{{ uniqueRolesCount }}</span>
                <small class="text-muted">perfis distintos</small>
              </b-card-body>
            </b-card>
          </b-col>
          <b-col sm="6" md="3">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body class="text-center">
                <div class="rounded-3 bg-warning bg-opacity-10 p-3 d-inline-block mb-2">
                  <i class="iconoir-user fs-2 text-warning"></i>
                </div>
                <h6 class="text-muted mb-0 small">Gerentes</h6>
                <span class="h4 mb-0 fw-bold d-block">{{ managersCount }}</span>
                <small class="text-muted">gerente de filial</small>
              </b-card-body>
            </b-card>
          </b-col>
          <b-col sm="6" md="3">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-body class="text-center">
                <div class="rounded-3 bg-info bg-opacity-10 p-3 d-inline-block mb-2">
                  <i class="iconoir-community fs-2 text-info"></i>
                </div>
                <h6 class="text-muted mb-0 small">Colaboradores</h6>
                <span class="h4 mb-0 fw-bold d-block">{{ collaboratorsCount }}</span>
                <small class="text-muted">perfil colaborador</small>
              </b-card-body>
            </b-card>
          </b-col>
        </b-row>

        <b-row class="g-3">
          <b-col lg="6">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-title class="mb-3">Dados da unidade</b-card-title>
              <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span class="text-muted">Filial</span>
                <strong>{{ branch?.name || "—" }}</strong>
              </div>
              <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span class="text-muted">Empresa</span>
                <strong>{{ branch?.company?.name || "—" }}</strong>
              </div>
              <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span class="text-muted">CNPJ</span>
                <strong>{{ branch?.cnpj || "—" }}</strong>
              </div>
              <div class="d-flex justify-content-between align-items-center py-2">
                <span class="text-muted">Localização</span>
                <strong>{{ branch?.city ? `${branch.city}/${branch.state}` : "—" }}</strong>
              </div>
            </b-card>
          </b-col>

          <b-col lg="6">
            <b-card class="border-0 shadow-sm h-100">
              <b-card-title class="mb-3">Perfis em uso</b-card-title>
              <div v-if="uniqueRoles.length" class="d-flex flex-wrap gap-2">
                <b-badge v-for="role in uniqueRoles" :key="role.id" variant="light" class="text-dark">
                  {{ role.name }}
                </b-badge>
              </div>
              <p v-else class="text-muted small mb-0">Sem perfis vinculados nesta filial.</p>
            </b-card>
          </b-col>
        </b-row>
      </template>
    </div>
  </DefaultLayout>
</template>
