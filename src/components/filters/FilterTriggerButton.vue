<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    active?: boolean;
    label?: string;
  }>(),
  {
    modelValue: false,
    active: false,
    label: "Filtros",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();
</script>

<template>
  <b-button variant="coral" @click="emit('update:modelValue', !modelValue)">
    <i class="iconoir-search me-1"></i>
    {{ label }}
    <i v-if="modelValue" class="iconoir-nav-arrow-down ms-1" aria-hidden="true"></i>
    <b-badge v-if="active" variant="primary" pill class="ms-2">Ativo</b-badge>
  </b-button>
</template>
