<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import { tutorialCategoriesApi } from "@/api/resources";
import type { TutorialCategoryRecord } from "@/types/api";
import { notifyError, notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useModulePermissions } from "@/composables/usePermissions";

const router = useRouter();
const authStore = useAuthStore();
const perms = useModulePermissions("tutorial_categories");

const isSuperadmin = computed(() => authStore.hasRole("superadmin"));
const canCreate = computed(() => isSuperadmin.value || perms.canCreate.value);
const canUpdate = computed(() => isSuperadmin.value || perms.canUpdate.value);
const canDelete = computed(() => isSuperadmin.value || perms.canDelete.value);

const loading = ref(true);
const rows = ref<TutorialCategoryRecord[]>([]);
const deleteModal = ref(false);
const deleteId = ref<number | null>(null);

function load() {
  loading.value = true;
  tutorialCategoriesApi
    .list({ per_page: 100, order_by: "name", order_dir: "asc" })
    .then((res) => {
      rows.value = res.tutorial_categories?.data ?? [];
    })
    .catch(() => notifyError("Não foi possível carregar as categorias."))
    .finally(() => (loading.value = false));
}

function goCreate() {
  router.push({ name: "owner.tutorial-categories.create" });
}

function goEdit(id: number) {
  router.push({ name: "owner.tutorial-categories.edit", params: { id: String(id) } });
}

function askDelete(id: number) {
  deleteId.value = id;
  deleteModal.value = true;
}

function confirmDelete() {
  const id = deleteId.value;
  deleteModal.value = false;
  deleteId.value = null;
  if (id == null) return;
  tutorialCategoriesApi
    .remove(id)
    .then(() => {
      notifySuccess("Categoria excluída.");
      load();
    })
    .catch(() => notifyError("Não foi possível excluir. Verifique se não há tutoriais associados."));
}

onMounted(load);
</script>

<template>
  <DefaultLayout>
    <UIComponentCard title="Categorias de tutoriais">
      <div class="d-flex justify-content-end mb-3">
        <b-button v-if="canCreate" variant="primary" @click="goCreate">
          Nova categoria
        </b-button>
      </div>

      <div v-if="loading" class="text-body-secondary py-4 text-center">
        Carregando…
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Slug</th>
              <th class="text-end">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td>{{ r.id }}</td>
              <td>{{ r.name }}</td>
              <td><code>{{ r.slug }}</code></td>
              <td class="text-end">
                <TableActionButtons
                  :item-id="r.id"
                  :show-view="false"
                  :show-edit="canUpdate"
                  :show-delete="canDelete"
                  @edit="goEdit"
                  @delete="askDelete"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        v-model="deleteModal"
        title="Excluir categoria"
        message="Tem certeza? Tutoriais associados a esta categoria podem impedir a exclusão."
        @confirm="confirmDelete"
      />
    </UIComponentCard>
  </DefaultLayout>
</template>
