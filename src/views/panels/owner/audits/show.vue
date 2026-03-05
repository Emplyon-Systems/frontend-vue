<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import { auditsApi } from "@/api/resources";
import type { AuditRecord } from "@/types/api";

const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params.id));
const loading = ref(true);
const loadError = ref("");
const audit = ref<AuditRecord | null>(null);

function formatDate(value: string | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-PT", {
      dateStyle: "long",
      timeStyle: "medium",
    });
  } catch {
    return value;
  }
}

function formatJson(obj: Record<string, unknown> | null | undefined): string {
  if (!obj || typeof obj !== "object") return "—";
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function goBack() {
  router.push({ name: "owner.audits" });
}

onMounted(() => {
  auditsApi
    .getById(id.value)
    .then((data) => (audit.value = data.audit ?? null))
    .catch(() => (loadError.value = "Registo de auditoria não encontrado."))
    .finally(() => (loading.value = false));
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Detalhe da auditoria</h1>
          <p class="text-muted mb-0 small">Visualização completa da ação registada.</p>
        </div>
        <b-button variant="outline-secondary" @click="goBack">
          <i class="iconoir-arrow-left me-1"></i>
          Voltar
        </b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>

      <template v-else-if="audit">
        <b-row>
          <b-col lg="6">
            <UIComponentCard title="Informação geral">
              <b-list-group flush>
                <b-list-group-item class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">ID</span>
                  <strong>{{ audit.id }}</strong>
                </b-list-group-item>
                <b-list-group-item class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">Data</span>
                  <span>{{ formatDate(audit.created_at) }}</span>
                </b-list-group-item>
                <b-list-group-item class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">Evento</span>
                  <b-badge variant="secondary">{{ audit.event }}</b-badge>
                </b-list-group-item>
                <b-list-group-item class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">Tipo</span>
                  <code class="small">{{ audit.auditable_type || "—" }}</code>
                </b-list-group-item>
                <b-list-group-item class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">ID do registo</span>
                  <span>{{ audit.auditable_id ?? "—" }}</span>
                </b-list-group-item>
                <b-list-group-item class="d-flex justify-content-between align-items-start">
                  <span class="text-muted">Utilizador</span>
                  <span class="text-end">
                    <span v-if="audit.user">{{ audit.user.name }}</span>
                    <span v-else class="text-muted">—</span>
                    <span v-if="audit.user?.roles?.length" class="d-block small mt-1">
                      <b-badge
                        v-for="r in audit.user.roles"
                        :key="r.id"
                        variant="light"
                        class="text-dark me-1"
                      >
                        {{ r.name }}
                      </b-badge>
                    </span>
                  </span>
                </b-list-group-item>
                <b-list-group-item v-if="audit.ip_address" class="d-flex justify-content-between align-items-center">
                  <span class="text-muted">IP</span>
                  <code class="small">{{ audit.ip_address }}</code>
                </b-list-group-item>
              </b-list-group>
            </UIComponentCard>
          </b-col>
          <b-col lg="6">
            <UIComponentCard title="Valores anteriores (old_values)">
              <pre class="mb-0 p-3 bg-light rounded small" style="max-height: 280px; overflow: auto;">{{ formatJson(audit.old_values) }}</pre>
            </UIComponentCard>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <UIComponentCard title="Novos valores (new_values)">
              <pre class="mb-0 p-3 bg-light rounded small" style="max-height: 280px; overflow: auto;">{{ formatJson(audit.new_values) }}</pre>
            </UIComponentCard>
          </b-col>
        </b-row>
        <b-row v-if="audit.user_agent">
          <b-col>
            <UIComponentCard title="User Agent">
              <code class="small d-block p-2 bg-light rounded" style="word-break: break-all;">{{ audit.user_agent }}</code>
            </UIComponentCard>
          </b-col>
        </b-row>
      </template>

      <div v-else-if="loading" class="text-center py-5 text-muted">A carregar...</div>
    </div>
  </DefaultLayout>
</template>
