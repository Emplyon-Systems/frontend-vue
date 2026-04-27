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
import { useListPageState } from "@/composables/useListPageState";

const router = useRouter();
const authStore = useAuthStore();
const perms = useModulePermissions("tutorials");

const isSuperadmin = computed(() => authStore.hasRole("superadmin"));
const canCreate = computed(() => isSuperadmin.value || perms.canCreate.value);
const canUpdate = computed(() => isSuperadmin.value || perms.canUpdate.value);
const canDelete = computed(() => isSuperadmin.value || perms.canDelete.value);

const { pagination, orderBy, orderDir, resultLabel, setPerPage } = useListPageState({
  perPage: 15,
  orderBy: "id",
  orderDir: "desc",
});

const loading = ref(true);
const rows = ref<TutorialRecord[]>([]);
const deleteModal = ref(false);
const deleteId = ref<number | null>(null);

const perPageOptions = [10, 15, 25, 50, 100];

const targetLabel: Record<string, string> = {
  branch: "Filial",
  employee: "Colaborador",
  company: "Empresa",
  all: "Todos",
};

function formatTargets(t: TutorialRecord) {
  return (t.targets ?? []).map((x) => targetLabel[x.target] ?? x.target).join(", ");
}

function loadList(page = 1) {
  loading.value = true;
  tutorialsApi
    .list({
      page,
      per_page: pagination.value.per_page,
      order_by: orderBy.value,
      order_dir: orderDir.value,
    })
    .then((res) => {
      const pag = res.tutorials;
      rows.value = pag?.data ?? [];
      pagination.value = {
        current_page: pag?.current_page ?? 1,
        per_page: pag?.per_page ?? pagination.value.per_page,
        total: pag?.total ?? 0,
        last_page: pag?.last_page ?? 1,
      };
    })
    .catch(() => notifyError("Não foi possível carregar os tutoriais."))
    .finally(() => (loading.value = false));
}

function onPerPageChange(value: number | string) {
  setPerPage(Number(value));
  loadList(1);
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
      const p = pagination.value;
      const page =
        rows.value.length <= 1 && p.current_page > 1 ? p.current_page - 1 : p.current_page;
      loadList(page);
    })
    .catch(() => notifyError("Não foi possível excluir o tutorial."));
}

onMounted(() => loadList(1));
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

      <template v-else>
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Mostrar</span>
            <b-form-select
              :model-value="pagination.per_page"
              :options="perPageOptions.map((n) => ({ value: n, text: String(n) }))"
              size="sm"
              class="form-select-sm d-inline-block w-auto"
              @update:model-value="onPerPageChange"
            />
            <span class="text-muted small">por página</span>
          </div>
          <b-badge pill class="result-badge-tutorials">{{ resultLabel }}</b-badge>
        </div>

        <div class="table-responsive">
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
              <tr v-if="!rows.length">
                <td colspan="6" class="text-center text-body-secondary py-4">
                  Nenhum tutorial encontrado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <b-row
          v-if="pagination.last_page > 1 && pagination.total > 0"
          class="align-items-center mt-3"
        >
          <b-col>
            <small class="text-muted">
              Exibindo {{ (pagination.current_page - 1) * pagination.per_page + 1 }}–{{
                Math.min(pagination.current_page * pagination.per_page, pagination.total)
              }}
              de {{ pagination.total }}
            </small>
          </b-col>
          <b-col class="d-flex justify-content-end">
            <b-pagination
              :model-value="pagination.current_page"
              :total-rows="pagination.total"
              :per-page="pagination.per_page"
              size="sm"
              @update:model-value="loadList"
            />
          </b-col>
        </b-row>
      </template>

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

.result-badge-tutorials {
  background-color: var(--bs-primary);
  color: #fff;
}
</style>
