<script setup lang="ts">
import { computed } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";

const todayLabel = computed(() => {
  return new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="mb-4">
        <h1 class="h4 mb-1">Dashboard Colaborador</h1>
        <p class="text-muted mb-0 small">As suas tarefas, avisos e informação do dia a dia.</p>
      </div>

      <b-row class="g-3 mb-4">
        <b-col sm="6" md="4">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="d-flex align-items-center">
              <div class="flex-shrink-0 rounded-3 bg-primary bg-opacity-10 p-3 me-3">
                <i class="iconoir-check-circle fs-2 text-primary"></i>
              </div>
              <div>
                <h6 class="text-muted mb-0 small">Tarefas em aberto</h6>
                <span class="h4 mb-0 fw-bold">—</span>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" md="4">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="d-flex align-items-center">
              <div class="flex-shrink-0 rounded-3 bg-warning bg-opacity-10 p-3 me-3">
                <i class="iconoir-notification fs-2 text-warning"></i>
              </div>
              <div>
                <h6 class="text-muted mb-0 small">Avisos</h6>
                <span class="h4 mb-0 fw-bold">—</span>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col sm="6" md="4">
          <b-card class="border-0 shadow-sm h-100">
            <b-card-body class="d-flex align-items-center">
              <div class="flex-shrink-0 rounded-3 bg-success bg-opacity-10 p-3 me-3">
                <i class="iconoir-calendar fs-2 text-success"></i>
              </div>
              <div>
                <h6 class="text-muted mb-0 small">Hoje</h6>
                <span class="h5 mb-0 fw-bold">{{ todayLabel }}</span>
              </div>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>

      <b-row class="g-3">
        <b-col lg="6">
          <b-card class="border-0 shadow-sm">
            <b-card-title class="mb-3">As minhas tarefas</b-card-title>
            <p class="text-muted small mb-3">Tarefas atribuídas a si.</p>
            <ul class="list-unstyled mb-0">
              <li class="py-2 border-bottom d-flex align-items-center">
                <i class="iconoir-check-circle me-2 text-muted"></i>
                <span class="text-muted">Nenhuma tarefa em aberto.</span>
              </li>
              <li class="py-2 text-muted small">
                As tarefas aparecerão aqui quando forem atribuídas.
              </li>
            </ul>
          </b-card>
        </b-col>
        <b-col lg="6">
          <b-card class="border-0 shadow-sm">
            <b-card-title class="mb-3">Avisos e notificações</b-card-title>
            <p class="text-muted small mb-3">Comunicações da empresa.</p>
            <div class="text-center py-4 bg-light rounded">
              <i class="iconoir-notification fs-1 text-muted"></i>
              <p class="text-muted small mb-0 mt-2">Sem avisos novos.</p>
            </div>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </DefaultLayout>
</template>
