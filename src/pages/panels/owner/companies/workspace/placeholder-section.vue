<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const slot = computed(() => String(route.params.slot ?? ""));
</script>

<template>
  <div class="rounded border border-dashed p-4 text-muted small">
    <p class="mb-1 fw-semibold text-body">Secção de exemplo ({{ slot }})</p>
    <p class="mb-0">
      Placeholder só para testar o scroll das abas. Remove as abas “Exemplo” em
      <code>CompanyWorkspaceLayout.vue</code> quando não precisares.
    </p>
  </div>
</template>
