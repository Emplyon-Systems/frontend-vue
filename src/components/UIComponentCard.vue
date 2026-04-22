<script setup lang="ts">
type CardPropsType = {
  title: string;
};

defineProps<CardPropsType>();
</script>

<template>
  <b-card no-body>
    <b-card-header>
      <b-row class="align-items-center">
        <b-col>
          <b-card-title>{{ title }}</b-card-title>
        </b-col>
        <b-col cols="auto">
          <slot name="header-extra" />
        </b-col>
      </b-row>
    </b-card-header>
    <b-card-body class="pt-0">
      <slot />
    </b-card-body>
  </b-card>
</template>
