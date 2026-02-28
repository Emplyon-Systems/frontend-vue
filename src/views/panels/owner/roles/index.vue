<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import * as rolesApi from "@/api/resources/roles";
import type { RoleRecord } from "@/types/api";

const router = useRouter();
const loading = ref(true);
const roles = ref<RoleRecord[]>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const deleteId = ref<number | null>(null);
const deleteModal = ref(false);

function loadList(page = 1) {
  loading.value = true;
  rolesApi
    .list({ page, per_page: pagination.value.per_page })
    .then((data) => {
      roles.value = data.roles?.data ?? [];
      pagination.value = {
        current_page: data.roles?.current_page ?? 1,
        per_page: data.roles?.per_page ?? 15,
        total: data.roles?.total ?? 0,
        last_page: data.roles?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

function confirmDelete(role: RoleRecord) {
  deleteId.value = role.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  rolesApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    loadList(pagination.value.current_page);
  });
}

function goCreate() {
  router.push({ name: "owner.roles.form", params: { id: "new" } });
}

function goEdit(id: number) {
  router.push({ name: "owner.roles.form", params: { id: String(id) } });
}

onMounted(() => loadList());
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Perfis</h1>
          <p class="text-muted mb-0 small">Listar, criar e editar perfis (roles) e vincular permissões.</p>
        </div>
        <b-button variant="primary" @click="goCreate">
          <i class="iconoir-plus me-1"></i>
          Novo perfil
        </b-button>
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
                <b-th>Permissões</b-th>
                <b-th class="text-end">Ações</b-th>
              </b-tr>
            </b-thead>
            <b-tbody>
              <b-tr v-for="r in roles" :key="r.id">
                <b-td>{{ r.id }}</b-td>
                <b-td>{{ r.name }}</b-td>
                <b-td><code>{{ r.slug }}</code></b-td>
                <b-td>{{ r.description || "—" }}</b-td>
                <b-td>
                  <span v-if="r.permissions?.length">
                    <b-badge v-for="p in r.permissions" :key="p.id" variant="info" class="me-1">{{ p.slug }}</b-badge>
                  </span>
                  <span v-else class="text-muted">—</span>
                </b-td>
                <b-td class="text-end">
                  <b-button
                    size="sm"
                    variant="outline-primary"
                    class="me-1"
                    title="Editar"
                    @click="goEdit(r.id)"
                  >
                    <i class="iconoir-edit"></i>
                  </b-button>
                  <b-button
                    size="sm"
                    variant="outline-danger"
                    title="Eliminar"
                    @click="confirmDelete(r)"
                  >
                    <i class="iconoir-trash"></i>
                  </b-button>
                </b-td>
              </b-tr>
              <b-tr v-if="!roles.length">
                <b-td colspan="6" class="text-center text-muted py-4">Nenhum perfil encontrado.</b-td>
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

    <b-modal v-model="deleteModal" title="Eliminar perfil" @ok="doDelete" ok-title="Eliminar" ok-variant="danger">
      Tem a certeza que deseja eliminar este perfil?
    </b-modal>
  </DefaultLayout>
</template>
