<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AuthLayout from "@/layouts/AuthLayout.vue";
import { useAuthStore } from "@/stores/auth";
import { getPanelHomeForUser } from "@/config/panels";

const router = useRouter();
const authStore = useAuthStore();

const contextOptions = computed(() => authStore.getContextOptions());
const companyContexts = computed(() => contextOptions.value.filter((ctx) => ctx.branch_id == null));
const branchContexts = computed(() => contextOptions.value.filter((ctx) => ctx.branch_id != null));

function contextTitle(ctx: { company_name?: string; branch_name?: string; label: string; branch_id?: number | null }) {
  if (ctx.branch_id != null) return (ctx.branch_name ?? "").trim() || ctx.label;
  return (ctx.company_name ?? "").trim() || ctx.label;
}

function contextSubtitle(ctx: { company_name?: string; branch_id?: number | null }) {
  if (ctx.branch_id != null) return (ctx.company_name ?? "").trim() || "Filial";
  return "Empresa";
}

function selectAndContinue(ctx: { company_id: number; branch_id?: number | null; label: string }) {
  authStore.selectContext(ctx);
  const path = getPanelHomeForUser(authStore.user, ctx);
  router.push(path || "/");
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.replace({ name: "auth.sign-in" });
    return;
  }
  const opts = contextOptions.value;
  if (!opts.length) {
    /** Sem opções de contexto (ex.: pivot API incompleto): não devolver ao login — ir ao painel inferido. */
    const dest = getPanelHomeForUser(authStore.user ?? undefined, authStore.activeContext);
    router.replace(dest || "/employee");
    return;
  }
  if (opts.length === 1) {
    selectAndContinue(opts[0]);
  }
});
</script>

<template>
  <AuthLayout>
    <b-col lg="10" xl="9" class="mx-auto">
      <b-card no-body class="context-card-shell border-0 shadow-sm">
        <b-card-body class="p-0 context-header rounded-top">
          <div class="text-center p-4 p-md-5">
            <router-link to="/" class="logo logo-admin">
              <img src="/logovertical.svg" height="60" alt="logo" class="auth-logo" />
            </router-link>
            <h4 class="mt-3 mb-1 fw-semibold text-white fs-18">
              Escolha o contexto de acesso
            </h4>
            <p class="text-white-50 mb-0 small">
              Tem acesso a várias empresas ou filiais. Selecione onde deseja atuar.
            </p>
          </div>
        </b-card-body>
        <b-card-body class="p-4 p-md-5 bg-white">
          <div v-if="contextOptions.length > 1" class="context-sections">
            <section v-if="companyContexts.length" class="context-section">
              <h6 class="context-section-title">Empresas</h6>
              <div class="d-grid gap-2">
                <b-button
                  v-for="ctx in companyContexts"
                  :key="`c-${ctx.company_id}`"
                  variant="light"
                  size="lg"
                  class="context-option"
                  @click="selectAndContinue(ctx)"
                >
                  <span class="context-option__icon context-option__icon--company">
                    <i class="iconoir-building"></i>
                  </span>
                  <span class="flex-grow-1 text-start">
                    <span class="d-block fw-semibold text-dark">{{ contextTitle(ctx) }}</span>
                    <small class="text-muted">{{ contextSubtitle(ctx) }}</small>
                  </span>
                  <i class="iconoir-arrow-right text-primary"></i>
                </b-button>
              </div>
            </section>

            <section v-if="branchContexts.length" class="context-section">
              <h6 class="context-section-title">Filiais</h6>
              <div class="d-grid gap-2">
                <b-button
                  v-for="ctx in branchContexts"
                  :key="`b-${ctx.company_id}-${ctx.branch_id}`"
                  variant="light"
                  size="lg"
                  class="context-option"
                  @click="selectAndContinue(ctx)"
                >
                  <span class="context-option__icon context-option__icon--branch">
                    <i class="iconoir-git-branch"></i>
                  </span>
                  <span class="flex-grow-1 text-start">
                    <span class="d-block fw-semibold text-dark">{{ contextTitle(ctx) }}</span>
                    <small class="text-muted">{{ contextSubtitle(ctx) }}</small>
                  </span>
                  <i class="iconoir-arrow-right text-primary"></i>
                </b-button>
              </div>
            </section>
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

<style scoped lang="scss">
.context-card-shell {
  border-radius: 14px;
  overflow: hidden;
}

.context-header {
  background: linear-gradient(120deg, #0a0f1f 0%, #0f172a 100%);
}

.context-sections {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

.context-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
}

.context-section-title {
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  color: #475569;
  font-weight: 700;
}

.context-option {
  background: #fff !important;
  border: 1px solid #dbeafe !important;
  border-radius: 10px !important;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem !important;
}

.context-option:hover {
  border-color: #60a5fa !important;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.12);
}

.context-option__icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.context-option__icon--company {
  background: #eff6ff;
  color: #2563eb;
}

.context-option__icon--branch {
  background: #ecfeff;
  color: #0f766e;
}

@media (min-width: 992px) {
  .context-sections {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}
</style>
