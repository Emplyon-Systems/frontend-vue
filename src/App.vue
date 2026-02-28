<template>
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import { useLayoutStore } from "@/stores/layout";
import { useAuthStore } from "@/stores/auth";
// Fake backend desativado: login usa a API real via http-client
// import configureFakeBackend from "@/helpers/fake-backend";
import { onMounted } from "vue";

onMounted(() => {
  useAuthStore().hydrate();
  useLayoutStore().init();
});

// configureFakeBackend();
</script>
