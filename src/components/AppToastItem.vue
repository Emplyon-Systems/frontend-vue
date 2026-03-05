<script setup lang="ts">
import type { NotifyVariant } from "@/stores/notify";

const props = withDefaults(
  defineProps<{
    variant?: NotifyVariant;
    title?: string;
    message: string;
    dismissible?: boolean;
  }>(),
  { variant: "success", dismissible: true }
);

const emit = defineEmits<{
  (e: "dismissed"): void;
}>();

</script>

<template>
  <div
    class="app-toast-item"
    :class="[`app-toast-item--${variant}`]"
    role="alert"
  >
    <div class="app-toast-item__icon" :class="`app-toast-item__icon--${variant}`" aria-hidden="true">
      <!-- success: check (Iconoir) -->
      <svg v-if="variant === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13L9 17L19 7" />
      </svg>
      <!-- danger: x (Iconoir) -->
      <svg v-else-if="variant === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426" />
      </svg>
      <!-- warning: line + dot (Iconoir warning-circle) -->
      <svg v-else-if="variant === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 7L12 13" />
        <path d="M12 17.01L12.01 16.9989" />
      </svg>
      <!-- info: line + dot (Iconoir info-circle) -->
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 11.5V16.5" />
        <path d="M12 7.51L12.01 7.49889" />
      </svg>
    </div>
    <div class="app-toast-item__content">
      <strong v-if="title" class="app-toast-item__title">{{ title }}</strong>
      <span class="app-toast-item__message">{{ message }}</span>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="app-toast-item__close"
      aria-label="Fechar"
      @click="emit('dismissed')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.app-toast-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1rem 1rem 1.25rem;
  min-width: 280px;
  max-width: 380px;
  text-align: left;
  border-radius: 0.5rem;
  border: 1px solid var(--bs-border-color);
  background-color: var(--bs-body-bg);
  color: var(--bs-body-color);
  box-shadow:
    0 0.25rem 0.5rem rgba(0, 0, 0, 0.08),
    0 0.5rem 1.5rem rgba(0, 0, 0, 0.12);
}

/* Tema escuro: sombra e borda mais visíveis */
html[data-bs-theme="dark"] .app-toast-item {
  border-color: var(--bs-border-color-translucent);
  box-shadow:
    0 0.25rem 0.5rem rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

.app-toast-item__icon {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.app-toast-item__icon svg {
  width: 1.15rem;
  height: 1.15rem;
  color: #fff;
}

.app-toast-item__icon--success {
  background-color: var(--bs-success);
}

.app-toast-item__icon--danger {
  background-color: var(--bs-danger);
}

.app-toast-item__icon--warning {
  background-color: var(--bs-warning);
}

.app-toast-item__icon--info {
  background-color: var(--bs-info);
}

/* Dark: ícones com contraste garantido */
html[data-bs-theme="dark"] .app-toast-item__icon--success {
  background-color: var(--bs-success);
}

html[data-bs-theme="dark"] .app-toast-item__icon--danger {
  background-color: var(--bs-danger);
}

html[data-bs-theme="dark"] .app-toast-item__icon--warning {
  background-color: var(--bs-warning);
}

html[data-bs-theme="dark"] .app-toast-item__icon--info {
  background-color: var(--bs-info);
}

.app-toast-item__content {
  flex: 1;
  min-width: 0;
}

.app-toast-item__title {
  display: block;
  font-size: 0.9375rem;
  margin-bottom: 0.125rem;
  color: var(--bs-body-color);
}

.app-toast-item__message {
  font-size: 0.875rem;
  color: var(--bs-secondary-color);
  line-height: 1.4;
}

html[data-bs-theme="dark"] .app-toast-item__message {
  color: var(--bs-body-color);
  opacity: 0.9;
}

.app-toast-item__close {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--bs-secondary-color);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s, color 0.15s;
}

.app-toast-item__close:hover {
  background-color: var(--bs-secondary-bg);
  color: var(--bs-body-color);
}

.app-toast-item__close svg {
  width: 1rem;
  height: 1rem;
}
</style>
