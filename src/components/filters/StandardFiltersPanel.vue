<script setup lang="ts">
type Props = {
  title?: string;
  description?: string;
};

withDefaults(defineProps<Props>(), {
  title: "Filtros",
  description: "Refine os resultados com os critérios desejados.",
});

defineEmits<{
  (e: "apply"): void;
  (e: "reset"): void;
}>();
</script>

<template>
  <div class="border rounded-3 p-3 p-md-4 mb-3 bg-light-subtle">
    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
      <div>
        <h6 class="mb-1">{{ title }}</h6>
        <small class="text-muted">{{ description }}</small>
      </div>
    </div>

    <b-row class="g-3">
      <slot />
    </b-row>

    <div class="d-flex justify-content-end gap-2 mt-3">
      <b-button variant="outline-secondary" @click="$emit('reset')">Limpar</b-button>
      <b-button variant="primary" @click="$emit('apply')">Aplicar filtros</b-button>
    </div>
  </div>
</template>
