<script setup lang="ts">
import { RouterView } from "vue-router";
import AppToastContainer from "@/components/AppToastContainer.vue";
import { useLayoutStore } from "@/stores/layout";
import { useAuthStore } from "@/stores/auth";
import { onMounted } from "vue";

onMounted(() => {
  useAuthStore().hydrate();
  useLayoutStore().init();
});
</script>

<template>
  <AppToastContainer />
  <RouterView />
</template>
