<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useNotifyStore } from "@/stores/notify";
import AppToastItem from "@/components/AppToastItem.vue";

const notifyStore = useNotifyStore();
const { items } = storeToRefs(notifyStore);

function dismiss(id: number) {
  notifyStore.remove(id);
}
</script>

<template>
  <div class="app-toast-container" aria-live="polite">
    <AppToastItem
      v-for="item in items"
      :key="item.id"
      :variant="item.variant"
      :title="item.title"
      :message="item.message"
      dismissible
      class="app-toast-container__item"
      @dismissed="dismiss(item.id)"
    />
  </div>
</template>

<style scoped>
.app-toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 380px;
  pointer-events: none;
}

.app-toast-container__item {
  pointer-events: auto;
}
</style>
