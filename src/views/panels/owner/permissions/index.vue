<script setup lang="ts">
import { ref, onMounted } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import * as permissionsApi from "@/api/resources/permissions";
import type { PermissionRecord } from "@/types/api";

/**
 * Permissões vêm do seeder (auth) – apenas listagem/consulta.
 * Não se criam nem editam no front; usam-se para vincular a perfis.
 */
const loading = ref(true);
const permissions = ref<PermissionRecord[]>([]);
const pagination = ref({ current_page: 1, per_page: 20, total: 0, last_page: 1 });

function loadList(page = 1) {
  loading.value = true;
  permissionsApi
    .list({ page, per_page: pagination.value.per_page })
    .then((data) => {
      permissions.value = data.permissions?.data ?? [];
      pagination.value = {
        current_page: data.permissions?.current_page ?? 1,
        per_page: data.permissions?.per_page ?? 20,
        total: data.permissions?.total ?? 0,
        last_page: data.permissions?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

onMounted(() => loadList());
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Permissões</h1>
          <p class="text-muted mb-0 small">Listagem apenas. As permissões vêm do seeder (auth) e são vinculadas aos perfis.</p>
        </div>
      </div>

      <UIComponentCard title="Listagem">
        <div v-if="loading" class="text-center py-4 text-muted">A carregar...</div>
        <div v-else class="table-responsive">
          <b-table-simple responsive striped hover class="mb-0">
            <b-thead>
              <b-tr>
                <b-th>ID</b-th>
                <b-th>Nome</b-th>
                <b-th>Slug</b-th>
                <b-th>Descrição</b-th>
              </b-tr>
            </b-thead>
            <b-tbody>
              <b-tr v-for="p in permissions" :key="p.id">
                <b-td>{{ p.id }}</b-td>
                <b-td>{{ p.name }}</b-td>
                <b-td><code>{{ p.slug }}</code></b-td>
                <b-td>{{ p.description || "—" }}</b-td>
              </b-tr>
              <b-tr v-if="!permissions.length">
                <b-td colspan="4" class="text-center text-muted py-4">Nenhuma permissão encontrada.</b-td>
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
