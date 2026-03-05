<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  title: string;
  message: string;
  loading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
}>();

function close() {
  emit("update:modelValue", false);
}

function onConfirm() {
  emit("confirm");
}
</script>

<template>
  <b-modal
    :model-value="modelValue"
    :title="title"
    modal-class="confirm-delete-modal"
    header-class="confirm-delete-modal__header"
    body-class="confirm-delete-modal__body"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <template #header>
      <div class="d-flex align-items-center justify-content-between gap-2 w-100">
        <div class="d-flex align-items-center gap-2">
          <span class="confirm-delete-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" />
              <path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" />
            </svg>
          </span>
          <span class="fw-semibold">{{ title }}</span>
        </div>
        <b-close-button aria-label="Fechar" @click="close" />
      </div>
    </template>

    <p class="mb-0 text-body">{{ message }}</p>

    <template #footer>
      <div class="d-flex justify-content-end gap-2 w-100">
        <b-button
          variant="outline-secondary"
          :disabled="loading"
          @click="close"
        >
          {{ cancelLabel ?? "Cancelar" }}
        </b-button>
        <b-button
          variant="danger"
          :disabled="loading"
          @click="onConfirm"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          {{ confirmLabel ?? "Eliminar" }}
        </b-button>
      </div>
    </template>
  </b-modal>
</template>

<style scoped>
.confirm-delete-modal__header {
  border-bottom: 1px solid var(--bs-border-color);
  background-color: var(--bs-body-bg);
  padding: 1rem 1.25rem;
}

.confirm-delete-modal__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  background-color: rgba(var(--bs-danger-rgb), 0.15);
  color: var(--bs-danger);
}

.confirm-delete-modal__icon svg {
  width: 1.1rem;
  height: 1.1rem;
}

.confirm-delete-modal__body {
  padding: 1.25rem;
}
</style>
