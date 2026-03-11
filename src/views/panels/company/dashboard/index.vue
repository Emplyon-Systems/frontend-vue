<script setup lang="ts">
import { computed } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const activeContext = computed(() => authStore.activeContext);
const currentCompanyName = computed(() => {
  if (activeContext.value?.company_name) return activeContext.value.company_name;
  return authStore.user?.companies?.[0]?.name ?? "Empresa não identificada";
});
const currentBranchName = computed(() => activeContext.value?.branch_name ?? "Todas as filiais");
const roles = computed(() => authStore.user?.roles ?? []);
const companyCount = computed(() => authStore.user?.companies?.length ?? 0);
const branchCount = computed(() => authStore.user?.branches?.length ?? 0);
const contextsCount = computed(() => authStore.getContextOptions().length);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Dashboard Empresa</h1>
          <p class="text-muted mb-0 small">Resumo do seu contexto de acesso atual.</p>
        </div>
      </div>

      <b-row class="g-3 mb-4">
        <b-col sm="6" md="3">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="text-center">
              <div class="rounded-3 bg-primary bg-opacity-10 p-3 d-inline-block mb-2">
                <i class="iconoir-building fs-2 text-primary"></i>
              </div>
              <h6 class="text-muted mb-0 small">Empresa atual</h6>
              <span class="h6 mb-0 fw-bold d-block">{{ currentCompanyName }}</span>
              <small class="text-muted">contexto selecionado</small>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" md="3">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="text-center">
              <div class="rounded-3 bg-info bg-opacity-10 p-3 d-inline-block mb-2">
                <i class="iconoir-map-pin fs-2 text-info"></i>
              </div>
              <h6 class="text-muted mb-0 small">Filial</h6>
              <span class="h6 mb-0 fw-bold d-block">{{ currentBranchName }}</span>
              <small class="text-muted">unidade em operação</small>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" md="3">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="text-center">
              <div class="rounded-3 bg-success bg-opacity-10 p-3 d-inline-block mb-2">
                <i class="iconoir-badge-check fs-2 text-success"></i>
              </div>
              <h6 class="text-muted mb-0 small">Perfis ativos</h6>
              <span class="h4 mb-0 fw-bold d-block">{{ roles.length }}</span>
              <small class="text-muted">neste utilizador</small>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" md="3">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="text-center">
              <div class="rounded-3 bg-warning bg-opacity-10 p-3 d-inline-block mb-2">
                <i class="iconoir-multiple-pages fs-2 text-warning"></i>
              </div>
              <h6 class="text-muted mb-0 small">Contextos disponíveis</h6>
              <span class="h4 mb-0 fw-bold d-block">{{ contextsCount }}</span>
              <small class="text-muted">empresa/filial</small>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>

      <b-row class="g-3">
        <b-col lg="6">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-title class="mb-3">Cobertura de acesso</b-card-title>
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
              <span class="text-muted">Empresas associadas</span>
              <strong>{{ companyCount }}</strong>
            </div>
            <div class="d-flex justify-content-between align-items-center py-2">
              <span class="text-muted">Filiais associadas</span>
              <strong>{{ branchCount }}</strong>
            </div>
          </b-card>
        </b-col>
        <b-col lg="6">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-title class="mb-3">Perfis deste utilizador</b-card-title>
            <div v-if="roles.length" class="d-flex flex-wrap gap-2">
              <b-badge v-for="role in roles" :key="role.id" variant="light" class="text-dark">
                {{ role.name }}
              </b-badge>
            </div>
            <p v-else class="text-muted small mb-0">Sem perfis atribuídos.</p>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </DefaultLayout>
</template>
