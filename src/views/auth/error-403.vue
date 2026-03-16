<template>
  <DefaultLayout>
    <div class="py-5 text-center">
      <div class="rounded-3 bg-warning bg-opacity-10 p-4 d-inline-block mb-3">
        <i class="iconoir-lock fs-1 text-warning"></i>
      </div>
      <h1 class="h3 mb-2">Sem permissão</h1>
      <p class="text-muted mb-4">
        Não tem permissão para aceder a este conteúdo.
      </p>
      <router-link :to="dashboardRoute" class="btn btn-primary">
        <i class="iconoir-home-simple me-1"></i> Voltar ao Dashboard
      </router-link>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAuthStore } from "@/stores/auth";
import { getPanelHomeForUser } from "@/config/panels";

const authStore = useAuthStore();

const dashboardRoute = computed(() => ({
  path: getPanelHomeForUser(authStore.user ?? undefined, authStore.activeContext) || "/employee",
}));
</script>
