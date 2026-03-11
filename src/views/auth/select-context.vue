<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AuthLayout from "@/layouts/AuthLayout.vue";
import { useAuthStore } from "@/stores/auth";
import { getPanelHomeForUser } from "@/config/panels";

const router = useRouter();
const authStore = useAuthStore();

const contextOptions = computed(() => authStore.getContextOptions());

function selectAndContinue(ctx: { company_id: number; branch_id?: number | null; label: string }) {
  authStore.selectContext(ctx);
  const path = getPanelHomeForUser(authStore.user);
  router.push(path || "/");
}

onMounted(() => {
  if (!authStore.isAuthenticated || !contextOptions.value.length) {
    router.replace({ name: "auth.sign-in" });
    return;
  }
  if (contextOptions.value.length === 1) {
    selectAndContinue(contextOptions.value[0]);
  }
});
</script>

<template>
  <AuthLayout>
    <b-col lg="6" class="mx-auto">
      <b-card no-body>
        <b-card-body class="p-0 bg-black auth-header-box rounded-top">
          <div class="text-center p-4">
            <router-link to="/" class="logo logo-admin">
              <img src="/logovertical.svg" height="60" alt="logo" class="auth-logo" />
            </router-link>
            <h4 class="mt-3 mb-1 fw-semibold text-white fs-18">
              Escolha o contexto de acesso
            </h4>
            <p class="text-muted mb-0 small">
              Tem acesso a várias empresas ou filiais. Selecione onde deseja atuar.
            </p>
          </div>
        </b-card-body>
        <b-card-body class="p-4">
          <div v-if="contextOptions.length > 1" class="d-grid gap-2">
            <b-button
              v-for="ctx in contextOptions"
              :key="ctx.branch_id ? `b-${ctx.company_id}-${ctx.branch_id}` : `c-${ctx.company_id}`"
              variant="outline-primary"
              size="lg"
              class="text-start d-flex align-items-center py-3"
              @click="selectAndContinue(ctx)"
            >
              <i class="iconoir-building fs-4 me-3 text-primary"></i>
              <span class="flex-grow-1">{{ ctx.label }}</span>
              <i class="iconoir-arrow-right"></i>
            </b-button>
          </div>
          <div v-else class="text-center text-muted">
            <p class="mb-0">A redirecionar…</p>
            <b-spinner small class="mt-2"></b-spinner>
          </div>
        </b-card-body>
      </b-card>
    </b-col>
  </AuthLayout>
</template>
