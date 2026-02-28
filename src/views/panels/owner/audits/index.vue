<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import * as auditsApi from "@/api/resources/audits";
import type { AuditRecord } from "@/types/api";

const router = useRouter();
const loading = ref(true);
const audits = ref<AuditRecord[]>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const filters = ref({ event: "", auditable_type: "" });

function loadList(page = 1) {
  loading.value = true;
  const params: auditsApi.AuditsListParams = {
    page,
    per_page: pagination.value.per_page,
  };
  if (filters.value.event) params.event = filters.value.event;
  if (filters.value.auditable_type) params.auditable_type = filters.value.auditable_type;

  auditsApi
    .list(params)
    .then((data) => {
      audits.value = data.audits?.data ?? [];
      pagination.value = {
        current_page: data.audits?.current_page ?? 1,
        per_page: data.audits?.per_page ?? 15,
        total: data.audits?.total ?? 0,
        last_page: data.audits?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

function doSearch() {
  loadList(1);
}

function formatDate(value: string | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return value;
  }
}

function goView(id: number) {
  router.push({ name: "owner.audits.show", params: { id: String(id) } });
}

onMounted(() => loadList());
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Auditoria</h1>
          <p class="text-muted mb-0 small">Consultar registos de ações no sistema.</p>
        </div>
      </div>

      <UIComponentCard title="Registos de auditoria">
        <b-row class="mb-3">
          <b-col md="4">
            <b-form-input
              v-model="filters.event"
              placeholder="Evento (ex: created, updated)"
              @keyup.enter="doSearch"
            />
          </b-col>
          <b-col md="4">
            <b-form-input
              v-model="filters.auditable_type"
              placeholder="Tipo (modelo)"
              @keyup.enter="doSearch"
            />
          </b-col>
          <b-col md="2">
            <b-button variant="primary" @click="doSearch">Filtrar</b-button>
          </b-col>
        </b-row>

        <div v-if="loading" class="text-center py-4 text-muted">A carregar...</div>
        <div v-else class="table-responsive">
          <b-table-simple responsive striped hover class="mb-0">
            <b-thead>
              <b-tr>
                <b-th>ID</b-th>
                <b-th>Data</b-th>
                <b-th>Evento</b-th>
                <b-th>Tipo</b-th>
                <b-th>Utilizador</b-th>
                <b-th class="text-end">Ações</b-th>
              </b-tr>
            </b-thead>
            <b-tbody>
              <b-tr v-for="a in audits" :key="a.id">
                <b-td>{{ a.id }}</b-td>
                <b-td>{{ formatDate(a.created_at) }}</b-td>
                <b-td><b-badge variant="secondary">{{ a.event }}</b-badge></b-td>
                <b-td><code class="small">{{ a.auditable_type || "—" }}</code></b-td>
                <b-td>{{ a.user?.name ?? a.user_id ?? "—" }}</b-td>
                <b-td class="text-end">
                  <b-button
                    size="sm"
                    variant="outline-primary"
                    title="Visualizar detalhes"
                    @click="goView(a.id)"
                  >
                    <i class="iconoir-eye"></i>
                  </b-button>
                </b-td>
              </b-tr>
              <b-tr v-if="!audits.length">
                <b-td colspan="6" class="text-center text-muted py-4">Nenhum registo de auditoria.</b-td>
              </b-tr>
            </b-tbody>
          </b-table-simple>
        </div>

        <b-row v-if="pagination.last_page > 1" class="align-items-center mt-3">
          <b-col>
            <small class="text-muted">
              A mostrar {{ (pagination.current_page - 1) * pagination.per_page + 1 }}–
              {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}
              de {{ pagination.total }}
            </small>
          </b-col>
          <b-col class="d-flex justify-content-end">
            <b-pagination
              v-model="pagination.current_page"
              :total-rows="pagination.total"
              :per-page="pagination.per_page"
              size="sm"
              @update:model-value="loadList($event)"
            />
          </b-col>
        </b-row>
      </UIComponentCard>
    </div>
  </DefaultLayout>
</template>
