<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import { tutorialsApi } from "@/api/resources";
import type { TutorialRecord } from "@/types/api";
import { notifyError, notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";
import { useModulePermissions } from "@/composables/usePermissions";

const router = useRouter();
const authStore = useAuthStore();
const perms = useModulePermissions("tutorials");

const isSuperadmin = computed(() => authStore.hasRole("superadmin"));
const canCreate = computed(() => isSuperadmin.value || perms.canCreate.value);
const canUpdate = computed(() => isSuperadmin.value || perms.canUpdate.value);
const canDelete = computed(() => isSuperadmin.value || perms.canDelete.value);

const loading = ref(true);
const rows = ref<TutorialRecord[]>([]);
const deleteModal = ref(false);
const deleteId = ref<number | null>(null);

const targetLabel: Record<string, string> = {
  branch: "Filial",
  employee: "Colaborador",
  company: "Empresa",
  all: "Todos",
};

function formatTargets(t: TutorialRecord) {
  return (t.targets ?? []).map((x) => targetLabel[x.target] ?? x.target).join(", ");
}

function load() {
  loading.value = true;
  tutorialsApi
    .list({ per_page: 100, order_by: "id", order_dir: "desc" })
    .then((res) => {
      rows.value = res.tutorials?.data ?? [];
    })
    .catch(() => notifyError("Não foi possível carregar os tutoriais."))
    .finally(() => (loading.value = false));
}

function goCreate() {
  router.push({ name: "owner.tutorials.create" });
}

function goEdit(id: number) {
  router.push({ name: "owner.tutorials.edit", params: { id: String(id) } });
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
  tutorialsApi
    .remove(id)
    .then(() => {
      notifySuccess("Tutorial excluído.");
      load();
    })
    .catch(() => notifyError("Não foi possível excluir o tutorial."));
}

onMounted(load);
</script>

<template>
  <DefaultLayout>
    <UIComponentCard title="Tutoriais (catálogo global)">
      <div class="d-flex justify-content-end mb-3">
        <b-button v-if="canCreate" variant="primary" @click="goCreate">
          Novo tutorial
        </b-button>
      </div>

      <div v-if="loading" class="text-body-secondary py-4 text-center">
        Carregando…
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th class="d-none d-md-table-cell tutorial-thumb-col">
                Capa
              </th>
              <th>ID</th>
              <th>Título</th>
              <th>Categoria</th>
              <th>Públicos</th>
              <th class="text-end">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td class="d-none d-md-table-cell">
                <img
                  :src="r.thumbnail"
                  alt=""
                  class="tutorial-list-thumb rounded border bg-light"
                  loading="lazy"
                >
              </td>
              <td>{{ r.id }}</td>
              <td>{{ r.title }}</td>
              <td>{{ r.category?.name ?? "—" }}</td>
              <td class="small">
                {{ formatTargets(r) || "—" }}
              </td>
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
        title="Excluir tutorial"
        message="Tem certeza? Esta ação não pode ser desfeita."
        @confirm="confirmDelete"
      />
    </UIComponentCard>
  </DefaultLayout>
</template>

<style scoped>
.tutorial-list-thumb {
  width: 72px;
  height: 40px;
  object-fit: cover;
  display: block;
}

.tutorial-thumb-col {
  width: 88px;
}
</style>
