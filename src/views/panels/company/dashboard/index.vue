<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Dashboard Empresa</h1>
          <p class="text-muted mb-0 small">A sua organização, equipa e atividade.</p>
        </div>
      </div>

      <b-row class="g-3 mb-4">
        <b-col sm="6" md="4">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="text-center">
              <div class="rounded-3 bg-primary bg-opacity-10 p-3 d-inline-block mb-2">
                <i class="iconoir-user-group fs-2 text-primary"></i>
              </div>
              <h6 class="text-muted mb-0 small">Colaboradores</h6>
              <span class="h4 mb-0 fw-bold d-block">—</span>
              <small class="text-muted">na equipa</small>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" md="4">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="text-center">
              <div class="rounded-3 bg-success bg-opacity-10 p-3 d-inline-block mb-2">
                <i class="iconoir-activity fs-2 text-success"></i>
              </div>
              <h6 class="text-muted mb-0 small">Atividade</h6>
              <span class="h4 mb-0 fw-bold d-block">—</span>
              <small class="text-muted">esta semana</small>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" md="4">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="text-center">
              <div class="rounded-3 bg-info bg-opacity-10 p-3 d-inline-block mb-2">
                <i class="iconoir-building fs-2 text-info"></i>
              </div>
              <h6 class="text-muted mb-0 small">Filial</h6>
              <span class="h5 mb-0 fw-bold d-block">—</span>
              <small class="text-muted">unidade atual</small>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>

      <b-row class="g-3">
        <b-col lg="6">
          <b-card class="border-0 shadow-sm">
            <b-card-title class="mb-3">Equipa</b-card-title>
            <p class="text-muted small mb-3">Colaboradores associados a esta empresa ou filial.</p>
            <div class="text-center py-4 bg-light rounded">
              <i class="iconoir-user-group fs-1 text-muted"></i>
              <p class="text-muted small mb-0 mt-2">Lista de colaboradores em breve.</p>
            </div>
          </b-card>
        </b-col>
        <b-col lg="6">
          <b-card class="border-0 shadow-sm">
            <b-card-title class="mb-3">Atividade recente</b-card-title>
            <p class="text-muted small mb-3">Últimas ações na sua organização.</p>
            <div class="text-center py-4 bg-light rounded">
              <i class="iconoir-activity fs-1 text-muted"></i>
              <p class="text-muted small mb-0 mt-2">Registos de atividade em breve.</p>
            </div>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </DefaultLayout>
</template>
