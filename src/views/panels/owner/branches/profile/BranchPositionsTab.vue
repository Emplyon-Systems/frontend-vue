<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ListagemCard from "@/components/ListagemCard.vue";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal.vue";
import TableActionButtons from "@/components/TableActionButtons.vue";
import { positionsApi } from "@/api/resources";
import { useModulePermissions } from "@/composables/usePermissions";
import { notifySuccess } from "@/helpers/notify";
import type { PositionRecord } from "@/types/api";

const props = defineProps<{ branchId: number }>();

const route = useRoute();
const router = useRouter();
const positionPermissions = useModulePermissions("positions");

const loading = ref(true);
const positions = ref<PositionRecord[]>([]);
const currentPage = ref(1);
const perPage = ref(10);
const total = ref(0);
const lastPage = ref(1);

const deleteId = ref<number | null>(null);
const deleteModal = ref(false);

const columns = [
  { key: "id", label: "ID", sortable: false, align: "start" as const },
  { key: "name", label: "Nome", sortable: false, align: "start" as const },
  { key: "slug", label: "Slug", sortable: false, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
];

const pagination = ref({ current_page: 1, per_page: 10, total: 0, last_page: 1 });

const resultLabel = ref("Nenhum cargo nesta filial");

function routeNameFor(op: "create" | "view" | "edit"): string {
  const r = String(route.name ?? "");
  if (r.startsWith("company.")) return `company.positions.${op}`;
  if (r.startsWith("branch.")) return `branch.positions.${op}`;
  return `owner.positions.${op}`;
}

function loadList(page = 1) {
  if (!props.branchId) return;
  loading.value = true;
  positionsApi
    .list({ branch_ids: [props.branchId], page, per_page: perPage.value })
    .then((data) => {
      positions.value = data.positions?.data ?? [];
      const pg = data.positions;
      pagination.value = {
        current_page: pg?.current_page ?? 1,
        per_page: pg?.per_page ?? perPage.value,
        total: pg?.total ?? 0,
        last_page: pg?.last_page ?? 1,
      };
      const t = pg?.total ?? 0;
      resultLabel.value = t === 0 ? "Nenhum cargo nesta filial" : t === 1 ? "1 cargo" : `${t} cargos`;
    })
    .finally(() => (loading.value = false));
}

function goCreate() {
  router.push({
    name: routeNameFor("create"),
    query: { branch_id: String(props.branchId) },
  });
}

function goView(id: number) {
  router.push({ name: routeNameFor("view"), params: { id: String(id) } });
}

function goEdit(id: number) {
  router.push({ name: routeNameFor("edit"), params: { id: String(id) } });
}

function confirmDelete(position: PositionRecord) {
  deleteId.value = position.id;
  deleteModal.value = true;
}

function doDelete() {
  if (deleteId.value == null) return;
  positionsApi.remove(deleteId.value).then(() => {
    deleteModal.value = false;
    deleteId.value = null;
    notifySuccess("Cargo eliminado com sucesso.");
    loadList(pagination.value.current_page);
  });
}

function onPerPageChange(value: number) {
  perPage.value = value;
  loadList(1);
}

onMounted(() => loadList());
watch(() => props.branchId, () => loadList());
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <span class="text-muted small">Cargos disponíveis para esta filial.</span>
      <b-button
        v-if="positionPermissions.canCreate.value"
        variant="primary"
        size="sm"
        @click="goCreate"
      >
        <i class="iconoir-plus me-1"></i>
        Novo cargo
      </b-button>
    </div>

    <ListagemCard
      :columns="columns"
      :data="positions"
      :loading="loading"
      :pagination="pagination"
      :per-page-options="[10, 25, 50]"
      :result-label="resultLabel"
      :has-active-filters="false"
      empty-message="Nenhum cargo nesta filial."
      result-badge-class="result-badge-default"
      @update:per-page="onPerPageChange"
      @update:page="loadList"
    >
      <template #row="{ item }">
        <b-tr>
          <b-td>{{ (item as PositionRecord).id }}</b-td>
          <b-td>{{ (item as PositionRecord).name }}</b-td>
          <b-td><code>{{ (item as PositionRecord).slug }}</code></b-td>
          <b-td class="text-end">
            <TableActionButtons
              :item-id="(item as PositionRecord).id"
              :show-view="positionPermissions.canRead.value"
              :show-edit="positionPermissions.canUpdate.value"
              :show-delete="positionPermissions.canDelete.value"
              view-title="Visualizar"
              edit-title="Editar"
              delete-title="Excluir"
              @view="goView"
              @edit="goEdit"
              @delete="(id) => { const p = positions.find((x) => x.id === id); if (p) confirmDelete(p); }"
            />
          </b-td>
        </b-tr>
      </template>
    </ListagemCard>

    <ConfirmDeleteModal
      v-model="deleteModal"
      title="Excluir cargo"
      message="Tem certeza de que deseja excluir este cargo?"
      @confirm="doDelete"
    />
  </div>
</template>
