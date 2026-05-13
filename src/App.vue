<script setup lang="ts">
import { RouterView } from "vue-router";
import AppToastContainer from "@/components/AppToastContainer.vue";
import ChatwootTenantWidget from "@/components/ChatwootTenantWidget.vue";
import { useLayoutStore } from "@/stores/layout";
import { onMounted } from "vue";

onMounted(() => {
  useLayoutStore().init();
});
</script>

<template>
  <AppToastContainer />
  <ChatwootTenantWidget />
  <RouterView />
</template>
