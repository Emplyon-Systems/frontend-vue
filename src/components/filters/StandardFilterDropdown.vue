<script setup lang="ts">
type Props = {
  label?: string;
  active?: boolean;
};

withDefaults(defineProps<Props>(), {
  label: "Filtros",
  active: false,
});

defineEmits<{
  (e: "apply"): void;
  (e: "reset"): void;
}>();
</script>

<template>
  <b-dropdown variant="outline-secondary" right class="w-auto">
    <template #button-content>
      <i class="iconoir-filter me-1"></i>
      {{ label }}
      <b-badge v-if="active" variant="primary" pill class="ms-1">Ativo</b-badge>
    </template>

    <div class="px-3 py-2" style="min-width: 320px">
      <slot />
    </div>

    <b-dropdown-divider />
    <div class="d-flex justify-content-end gap-2 px-3 py-2">
      <b-button size="sm" variant="outline-secondary" @click="$emit('reset')">Limpar</b-button>
      <b-button size="sm" variant="primary" @click="$emit('apply')">Aplicar</b-button>
    </div>
  </b-dropdown>
</template>
