<script setup lang="ts">
/**
 * Alerta padronizado do sistema: ícone em círculo + título opcional + conteúdo.
 * Variantes: success, danger, warning, info.
 */
const props = withDefaults(
  defineProps<{
    variant?: "success" | "danger" | "warning" | "info";
    title?: string;
    dismissible?: boolean;
    show?: boolean;
  }>(),
  {
    variant: "info",
    show: true,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "dismissed"): void;
}>();

const iconByVariant: Record<string, string> = {
  success: "iconoir-check",
  danger: "iconoir-xmark",
  warning: "iconoir-warning-triangle",
  info: "iconoir-info-circle",
};

const iconClass = iconByVariant[props.variant] ?? iconByVariant.info;
</script>

<template>
  <b-alert
    :model-value="show"
    :variant="variant"
    :dismissible="dismissible"
    class="shadow-sm border-theme-white-2 app-alert"
    @update:model-value="emit('update:modelValue', $event); emit('dismissed')"
  >
    <div
      class="d-inline-flex justify-content-center align-items-center thumb-xs rounded-circle me-2 flex-shrink-0"
      :class="`bg-${variant}`"
    >
      <i :class="[iconClass, 'text-white']"></i>
    </div>
    <span class="app-alert__content">
      <strong v-if="title" class="me-1">{{ title }}</strong>
      <slot />
    </span>
  </b-alert>
</template>

<style scoped>
.app-alert {
  display: flex;
  align-items: flex-start;
}
.app-alert__content {
  flex: 1;
}
.app-alert .thumb-xs i {
  font-size: 12px;
}
</style>
