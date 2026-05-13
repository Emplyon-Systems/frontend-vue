<script setup lang="ts">
import { computed } from "vue";
import type { EmployeeRecord } from "@/types/api";

const props = defineProps<{
  employee: EmployeeRecord;
}>();

const columns = [
  { key: "branchName", label: "Filial", sortable: false },
  { key: "sectorName", label: "Setor", sortable: false },
  { key: "modalityName", label: "Modalidade de domingo", sortable: false },
  { key: "principal", label: "Principal", sortable: false },
];

const rows = computed(() =>
  (props.employee.branches ?? []).map((b) => ({
    branchName: b.name?.trim() || `Filial #${b.id}`,
    sectorName: b.pivot_sector?.name?.trim() || "—",
    modalityName: b.pivot_modality_type?.name?.trim() || "—",
    principal: b.pivot?.is_primary ? "Sim" : "Não",
  }))
);
</script>

<template>
  <div>
    <b-card no-body class="mb-3">
      <b-card-header class="py-2">
        <b-card-title class="mb-0 h6">Filiais e setores</b-card-title>
      </b-card-header>
      <b-card-body class="py-2">
        <b-table v-if="rows.length" :items="rows" :fields="columns" small striped responsive class="mb-0" />
        <p v-else class="text-muted mb-0 small">Nenhuma filial vinculada.</p>
      </b-card-body>
    </b-card>
  </div>
</template>
