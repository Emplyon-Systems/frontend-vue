<script setup lang="ts">
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

const router = useRouter();
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
                <h6 class="text-muted mb-0 small">Utilizadores</h6>
                <span class="h4 mb-0 fw-bold">—</span>
                <small class="text-muted d-block">total no sistema</small>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" lg="3">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="d-flex align-items-center">
              <div class="flex-shrink-0 rounded-3 bg-success bg-opacity-10 p-3 me-3">
                <i class="iconoir-buildings fs-2 text-success"></i>
              </div>
              <div>
                <h6 class="text-muted mb-0 small">Empresas</h6>
                <span class="h4 mb-0 fw-bold">—</span>
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
                <span class="h4 mb-0 fw-bold">—</span>
                <small class="text-muted d-block">configurados</small>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" lg="3">
          <b-card class="border-0 shadow-sm h-100 cursor-pointer" @click="router.push({ name: 'owner.audits' })">
            <b-card-body class="d-flex align-items-center">
              <div class="flex-shrink-0 rounded-3 bg-info bg-opacity-10 p-3 me-3">
                <i class="iconoir-database fs-2 text-info"></i>
              </div>
              <div>
                <h6 class="text-muted mb-0 small">Auditoria</h6>
                <span class="h4 mb-0 fw-bold">—</span>
                <small class="text-muted d-block">registos</small>
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
                  <strong>Utilizadores</strong> — Criar, editar e listar utilizadores.
                </router-link>
              </li>
              <li class="py-2 border-bottom">
                <i class="iconoir-buildings me-2 text-success"></i>
                <strong>Empresas</strong> — Gerir empresas e filiais (em breve).
              </li>
              <li class="py-2 border-bottom">
                <router-link :to="{ name: 'owner.roles' }" class="text-decoration-none text-body">
                  <i class="iconoir-shield me-2 text-warning"></i>
                  <strong>Perfis</strong> — Definir perfis e vincular permissões.
                </router-link>
              </li>
              <li class="py-2 border-bottom">
                <router-link :to="{ name: 'owner.permissions' }" class="text-decoration-none text-body">
                  <i class="iconoir-lock me-2 text-secondary"></i>
                  <strong>Permissões</strong> — Gerir permissões do sistema.
                </router-link>
              </li>
              <li class="py-2">
                <router-link :to="{ name: 'owner.audits' }" class="text-decoration-none text-body">
                  <i class="iconoir-database me-2 text-info"></i>
                  <strong>Auditoria</strong> — Consultar logs de ações.
                </router-link>
              </li>
            </ul>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </DefaultLayout>
</template>
