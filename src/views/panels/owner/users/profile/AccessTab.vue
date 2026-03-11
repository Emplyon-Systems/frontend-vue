<template>
  <div>
    <b-card no-body class="mb-3">
      <b-card-header class="py-2">
        <b-card-title class="mb-0 h6">Filiais com acesso</b-card-title>
      </b-card-header>
      <b-card-body class="py-2">
        <div v-if="branches?.length" class="d-flex flex-wrap gap-1">
          <b-badge
            v-for="branch in branches"
            :key="branch.id"
            variant="light"
            class="text-dark border"
          >
            {{ branch.name }}<span v-if="branch.company?.name" class="text-muted ms-1">({{ branch.company.name }})</span>
          </b-badge>
        </div>
        <p v-else class="text-muted mb-0 small">Nenhuma filial vinculada.</p>
      </b-card-body>
    </b-card>

    <b-card no-body>
      <b-card-header class="py-2">
        <b-card-title class="mb-0 h6">Setores vinculados</b-card-title>
      </b-card-header>
      <b-card-body class="py-2">
        <b-table
          v-if="sectorsWithBranch?.length"
          :items="sectorsWithBranch"
          :fields="accessColumns"
          small
          striped
          responsive
          class="mb-0"
        >
          <template #cell(setor)="data">
            {{ data.item.name }}
          </template>
          <template #cell(filial)="data">
            {{ data.item.branchName || "—" }}
          </template>
        </b-table>
        <p v-else class="text-muted mb-0 small">Nenhum setor vinculado.</p>
      </b-card-body>
    </b-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { UserRecord } from "@/types/api";

const props = defineProps<{
  branches?: UserRecord["branches"];
  sectors?: UserRecord["sectors"];
}>();

const accessColumns = [
  { key: "setor", label: "Setor", sortable: false },
  { key: "filial", label: "Filial", sortable: false },
];

const sectorsWithBranch = computed(() =>
  (props.sectors ?? []).map((s) => ({
    id: s.id,
    name: s.name ?? `Setor #${s.id}`,
    branchName: s.branch?.name ?? null,
  }))
);
</script>
