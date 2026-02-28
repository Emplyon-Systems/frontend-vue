<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import * as usersApi from "@/api/resources/users";
import type { UserRecord } from "@/types/api";

const router = useRouter();
const loading = ref(true);
const users = ref<UserRecord[]>([]);
const pagination = ref({ current_page: 1, per_page: 15, total: 0, last_page: 1 });
const search = ref("");
const deleteId = ref<number | null>(null);
const deleteModal = ref(false);

function loadList(page = 1) {
  loading.value = true;
  usersApi
    .list({ page, per_page: pagination.value.per_page, search: search.value || undefined })
    .then((data) => {
      users.value = data.users?.data ?? [];
      pagination.value = {
        current_page: data.users?.current_page ?? 1,
        per_page: data.users?.per_page ?? 15,
        total: data.users?.total ?? 0,
        last_page: data.users?.last_page ?? 1,
      };
    })
    .finally(() => (loading.value = false));
}

function doSearch() {
  loadList(1);
}

function confirmDelete(user: UserRecord) {
  deleteId.value = user.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  usersApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    loadList(pagination.value.current_page);
  });
}

function goCreate() {
  router.push({ name: "owner.users.create" });
}

function goEdit(id: number) {
  router.push({ name: "owner.users.edit", params: { id: String(id) } });
}

onMounted(() => loadList());
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Utilizadores</h1>
          <p class="text-muted mb-0 small">Listar, criar e editar utilizadores do sistema.</p>
        </div>
        <b-button variant="primary" @click="goCreate">
          <i class="iconoir-plus me-1"></i>
          Novo utilizador
        </b-button>
      </div>

      <UIComponentCard title="Listagem">
        <b-row class="mb-3">
          <b-col md="6">
            <b-input-group>
              <b-form-input
                v-model="search"
                placeholder="Pesquisar por nome ou e-mail..."
                @keyup.enter="doSearch"
              />
              <b-button variant="primary" @click="doSearch">Pesquisar</b-button>
            </b-input-group>
          </b-col>
        </b-row>

        <div v-if="loading" class="text-center py-4 text-muted">A carregar...</div>
        <div v-else class="table-responsive">
          <b-table-simple responsive striped hover class="mb-0">
            <b-thead>
              <b-tr>
                <b-th>ID</b-th>
                <b-th>Nome</b-th>
                <b-th>E-mail</b-th>
                <b-th>Perfis</b-th>
                <b-th class="text-end">Ações</b-th>
              </b-tr>
            </b-thead>
            <b-tbody>
              <b-tr v-for="u in users" :key="u.id">
                <b-td>{{ u.id }}</b-td>
                <b-td>{{ u.name }}</b-td>
                <b-td>{{ u.email }}</b-td>
                <b-td>
                  <span v-if="u.roles?.length">
                    <b-badge v-for="r in u.roles" :key="r.id" variant="light" class="text-dark me-1">{{ r.name }}</b-badge>
                  </span>
                  <span v-else class="text-muted">—</span>
                </b-td>
                <b-td class="text-end">
                  <b-button
                    size="sm"
                    variant="outline-primary"
                    class="me-1"
                    title="Editar"
                    @click="goEdit(u.id)"
                  >
                    <i class="iconoir-edit"></i>
                  </b-button>
                  <b-button
                    size="sm"
                    variant="outline-danger"
                    title="Eliminar"
                    @click="confirmDelete(u)"
                  >
                    <i class="iconoir-trash"></i>
                  </b-button>
                </b-td>
              </b-tr>
              <b-tr v-if="!users.length">
                <b-td colspan="5" class="text-center text-muted py-4">Nenhum utilizador encontrado.</b-td>
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

    <b-modal v-model="deleteModal" title="Eliminar utilizador" @ok="doDelete" ok-title="Eliminar" ok-variant="danger">
      Tem a certeza que deseja eliminar este utilizador?
    </b-modal>
  </DefaultLayout>
</template>
