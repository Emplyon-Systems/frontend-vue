<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed, onMounted, ref } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAuthStore } from "@/stores/auth";
import { branchesApi, companiesApi, rolesApi, usersApi } from "@/api/resources";

const router = useRouter();
const auth = useAuthStore();
const isSuperadmin = computed(() => auth.hasRole("superadmin"));

const usersTotal = ref<number | null>(null);
const companiesTotal = ref<number | null>(null);
const rolesTotal = ref<number | null>(null);
const branchesTotal = ref<number | null>(null);

onMounted(async () => {
  const load = async () => {
    try {
      const [usersRes, companiesRes, rolesRes, branchesRes] = await Promise.all([
        usersApi.list({ per_page: 1 }),
        isSuperadmin.value ? companiesApi.list({ per_page: 1 }) : Promise.resolve(null),
        rolesApi.list({ per_page: 1 }),
        branchesApi.list({ per_page: 1 }),
      ]);
      usersTotal.value = usersRes.users?.total ?? 0;
      companiesTotal.value = companiesRes?.companies?.total ?? 0;
      rolesTotal.value = rolesRes.roles?.total ?? 0;
      branchesTotal.value = branchesRes.branches?.total ?? 0;
    } catch {
      usersTotal.value = 0;
      if (isSuperadmin.value) companiesTotal.value = 0;
      rolesTotal.value = 0;
      branchesTotal.value = 0;
    }
  };
  await load();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Dashboard Owner</h1>
          <p class="text-muted mb-0 small">Visão global do sistema e gestão centralizada.</p>
        </div>
      </div>

      <b-row class="g-3 mb-4">
        <b-col sm="6" lg="3">
          <b-card class="border-0 shadow-sm h-100 cursor-pointer" @click="router.push({ name: 'owner.users' })">
            <b-card-body class="d-flex align-items-center">
              <div class="flex-shrink-0 rounded-3 bg-primary bg-opacity-10 p-3 me-3">
                <i class="iconoir-user fs-2 text-primary"></i>
              </div>
              <div>
                <h6 class="text-muted mb-0 small">Usuários</h6>
                <span class="h4 mb-0 fw-bold">{{ usersTotal !== null ? usersTotal : '—' }}</span>
                <small class="text-muted d-block">total no sistema</small>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col v-if="isSuperadmin" sm="6" lg="3">
          <b-card class="border-0 shadow-sm h-100 cursor-pointer" @click="router.push({ name: 'owner.companies' })">
            <b-card-body class="d-flex align-items-center">
              <div class="flex-shrink-0 rounded-3 bg-success bg-opacity-10 p-3 me-3">
                <i class="iconoir-building fs-2 text-success"></i>
              </div>
              <div>
                <h6 class="text-muted mb-0 small">Empresas</h6>
                <span class="h4 mb-0 fw-bold">{{ companiesTotal !== null ? companiesTotal : '—' }}</span>
                <small class="text-muted d-block">registadas</small>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" lg="3">
          <b-card class="border-0 shadow-sm h-100 cursor-pointer" @click="router.push({ name: 'owner.roles' })">
            <b-card-body class="d-flex align-items-center">
              <div class="flex-shrink-0 rounded-3 bg-warning bg-opacity-10 p-3 me-3">
                <i class="iconoir-shield fs-2 text-warning"></i>
              </div>
              <div>
                <h6 class="text-muted mb-0 small">Perfis</h6>
                <span class="h4 mb-0 fw-bold">{{ rolesTotal !== null ? rolesTotal : '—' }}</span>
                <small class="text-muted d-block">configurados</small>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" lg="3">
          <b-card class="border-0 shadow-sm h-100 cursor-pointer" @click="router.push({ name: 'owner.branches' })">
            <b-card-body class="d-flex align-items-center">
              <div class="flex-shrink-0 rounded-3 bg-info bg-opacity-10 p-3 me-3">
                <i class="iconoir-building fs-2 text-info"></i>
              </div>
              <div>
                <h6 class="text-muted mb-0 small">Filiais</h6>
                <span class="h4 mb-0 fw-bold">{{ branchesTotal !== null ? branchesTotal : '—' }}</span>
                <small class="text-muted d-block">no sistema</small>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>

      <b-row class="g-3">
        <b-col lg="6">
          <b-card class="border-0 shadow-sm">
            <b-card-title class="mb-3">Gestão</b-card-title>
            <p class="text-muted small mb-3">Atalhos para as áreas de administração do sistema.</p>
            <ul class="list-unstyled mb-0">
              <li class="py-2 border-bottom">
                <router-link :to="{ name: 'owner.users' }" class="text-decoration-none text-body">
                  <i class="iconoir-user me-2 text-primary"></i>
                  <strong>Usuários</strong> — Criar, editar e listar usuários.
                </router-link>
              </li>
              <li v-if="isSuperadmin" class="py-2 border-bottom">
                <router-link :to="{ name: 'owner.companies' }" class="text-decoration-none text-body">
                  <i class="iconoir-building me-2 text-success"></i>
                  <strong>Empresas</strong> — Gerir empresas do sistema.
                </router-link>
              </li>
              <li class="py-2 border-bottom">
                <router-link :to="{ name: 'owner.roles' }" class="text-decoration-none text-body">
                  <i class="iconoir-shield me-2 text-warning"></i>
                  <strong>Perfis</strong> — Definir perfis e vincular permissões.
                </router-link>
              </li>
              <li class="py-2">
                <router-link :to="{ name: 'owner.branches' }" class="text-decoration-none text-body">
                  <i class="iconoir-building me-2 text-info"></i>
                  <strong>Filiais</strong> — Gerir filiais do sistema.
                </router-link>
              </li>
            </ul>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </DefaultLayout>
</template>
