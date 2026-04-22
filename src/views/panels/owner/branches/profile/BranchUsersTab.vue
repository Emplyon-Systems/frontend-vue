<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import ListagemCard from "@/components/ListagemCard.vue";
import type { BranchRecord } from "@/types/api";

type BranchUser = NonNullable<BranchRecord["users"]>[number];

const props = defineProps<{
  users?: BranchRecord["users"];
}>();

const router = useRouter();
const currentPage = ref(1);
const perPage = ref(5);

const columns = [
  { key: "id", label: "ID", sortable: false, align: "start" as const },
  { key: "name", label: "Nome", sortable: false, align: "start" as const },
  { key: "email", label: "E-mail", sortable: false, align: "start" as const },
  { key: "roles", label: "Perfis", sortable: false, align: "start" as const },
  { key: "actions", label: "Ações", sortable: false, align: "end" as const },
];

const allUsers = computed<BranchUser[]>(() => props.users ?? []);
const total = computed(() => allUsers.value.length);
const lastPage = computed(() => Math.max(1, Math.ceil(total.value / perPage.value)));

const pagination = computed(() => ({
  current_page: Math.min(currentPage.value, lastPage.value),
  per_page: perPage.value,
  total: total.value,
  last_page: lastPage.value,
}));

const pagedUsers = computed<BranchUser[]>(() => {
  const page = Math.min(currentPage.value, lastPage.value);
  const start = (page - 1) * perPage.value;
  return allUsers.value.slice(start, start + perPage.value);
});

const resultLabel = computed(() => {
  if (total.value === 0) return "Nenhum usuário vinculado";
  if (total.value === 1) return "1 usuário vinculado";
  return `${total.value} usuários vinculados`;
});

function onPerPageChange(value: number) {
  perPage.value = value;
  currentPage.value = 1;
}

function onPageChange(page: number) {
  currentPage.value = page;
}

function goView(id: number) {
  router.push({ name: "owner.users.view", params: { id: String(id) } });
}
</script>

<template>
  <ListagemCard
    :columns="columns"
    :data="pagedUsers"
    :loading="false"
    :pagination="pagination"
    :per-page-options="[5, 10, 15, 25]"
    :result-label="resultLabel"
    :has-active-filters="false"
    empty-message="Nenhum usuário vinculado."
    result-badge-class="result-badge-default"
    @update:per-page="onPerPageChange"
    @update:page="onPageChange"
  >
    <template #row="{ item }">
      <b-tr>
        <b-td>{{ (item as BranchUser).id }}</b-td>
        <b-td>
          {{ (item as BranchUser).name }}
          <b-badge v-if="(item as BranchUser).pivot?.is_primary" variant="success" class="ms-2">
            Principal
          </b-badge>
        </b-td>
        <b-td>{{ (item as BranchUser).email }}</b-td>
        <b-td>
          <span v-if="(item as BranchUser).roles?.length">
            <b-badge
              v-for="role in (item as BranchUser).roles"
              :key="role.id"
              variant="light"
              class="text-dark me-1"
            >
              {{ role.name }}
            </b-badge>
          </span>
          <span v-else class="text-muted">—</span>
        </b-td>
        <b-td class="text-end">
          <b-button size="sm" variant="outline-primary" @click="goView((item as BranchUser).id)">
            Ver usuário
          </b-button>
        </b-td>
      </b-tr>
    </template>
  </ListagemCard>
</template>
