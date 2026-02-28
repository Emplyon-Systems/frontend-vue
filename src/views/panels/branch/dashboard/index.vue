<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Dashboard Filial</h1>
          <p class="text-muted mb-0 small">Visão operacional da sua filial.</p>
        </div>
      </div>

      <b-row class="g-3 mb-4">
        <b-col sm="6" md="4">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="text-center">
              <div class="rounded-3 bg-primary bg-opacity-10 p-3 d-inline-block mb-2">
                <i class="iconoir-user-group fs-2 text-primary"></i>
              </div>
              <h6 class="text-muted mb-0 small">Equipa da filial</h6>
              <span class="h4 mb-0 fw-bold d-block">-</span>
              <small class="text-muted">colaboradores ativos</small>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" md="4">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="text-center">
              <div class="rounded-3 bg-success bg-opacity-10 p-3 d-inline-block mb-2">
                <i class="iconoir-activity fs-2 text-success"></i>
              </div>
              <h6 class="text-muted mb-0 small">Atividade local</h6>
              <span class="h4 mb-0 fw-bold d-block">-</span>
              <small class="text-muted">últimos 7 dias</small>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" md="4">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="text-center">
              <div class="rounded-3 bg-info bg-opacity-10 p-3 d-inline-block mb-2">
                <i class="iconoir-building fs-2 text-info"></i>
              </div>
              <h6 class="text-muted mb-0 small">Unidade</h6>
              <span class="h5 mb-0 fw-bold d-block">-</span>
              <small class="text-muted">dados da filial</small>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>

      <b-row class="g-3">
        <b-col lg="6">
          <b-card class="border-0 shadow-sm">
            <b-card-title class="mb-3">Operação da filial</b-card-title>
            <p class="text-muted small mb-3">Indicadores e tarefas da unidade.</p>
            <div class="text-center py-4 bg-light rounded">
              <i class="iconoir-graph-up fs-1 text-muted"></i>
              <p class="text-muted small mb-0 mt-2">Conteúdo do painel de filial em breve.</p>
            </div>
          </b-card>
        </b-col>
        <b-col lg="6">
          <b-card class="border-0 shadow-sm">
            <b-card-title class="mb-3">Avisos da filial</b-card-title>
            <p class="text-muted small mb-3">Comunicações e alertas para esta unidade.</p>
            <div class="text-center py-4 bg-light rounded">
              <i class="iconoir-bell fs-1 text-muted"></i>
              <p class="text-muted small mb-0 mt-2">Sem avisos no momento.</p>
            </div>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </DefaultLayout>
</template>
