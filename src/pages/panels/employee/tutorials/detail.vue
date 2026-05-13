<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import PublicTutorialDetailPage from "@/views/panels/common/tutorials/PublicTutorialDetailPage.vue";
</script>

<template>
  <DefaultLayout>
    <PublicTutorialDetailPage list-route-name="employee.tutorials" />
  </DefaultLayout>
</template>
