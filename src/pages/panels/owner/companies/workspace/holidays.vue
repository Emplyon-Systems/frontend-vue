<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import BranchHolidaysTab from "@/views/panels/owner/branches/profile/BranchHolidaysTab.vue";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();

const branchId = computed(() => {
  const id = Number(route.params.id ?? 0);
  return Number.isFinite(id) && id > 0 ? id : 0;
});

const canSync = computed(() => authStore.hasPermission("branches.update"));
</script>

<template>
  <div class="py-2">
    <BranchHolidaysTab v-if="branchId" :branch-id="branchId" :can-sync="canSync" />
    <p v-else class="text-muted">Filial não encontrada.</p>
  </div>
</template>
