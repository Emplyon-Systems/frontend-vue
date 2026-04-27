<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import PublicTutorialListPage from "@/views/panels/common/tutorials/PublicTutorialListPage.vue";
</script>

<template>
  <DefaultLayout>
    <PublicTutorialListPage detail-route-name="branch.tutorials.detail" />
  </DefaultLayout>
</template>
