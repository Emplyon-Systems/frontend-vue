<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    itemId: number;
    showView?: boolean;
    showEdit?: boolean;
    showDelete?: boolean;
    /** Ex.: reativar registro inativado (mesmo estilo dos outros botões). */
    showRestore?: boolean;
    viewTitle?: string;
    editTitle?: string;
    deleteTitle?: string;
    restoreTitle?: string;
  }>(),
  {
    showView: true,
    showEdit: true,
    showDelete: true,
    showRestore: false,
    viewTitle: "Visualizar",
    editTitle: "Editar",
    deleteTitle: "Eliminar",
    restoreTitle: "Reativar",
  }
);

const emit = defineEmits<{
  (e: "view", id: number): void;
  (e: "edit", id: number): void;
  (e: "delete", id: number): void;
  (e: "restore", id: number): void;
}>();
</script>

<template>
  <div class="table-action-buttons">
    <b-button
      v-if="showView"
      size="sm"
      variant="outline-secondary"
      class="btn-action"
      :title="viewTitle"
      @click="emit('view', itemId)"
    >
      <span class="icon-svg" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13C6.6 5 17.4 5 21 13" />
          <path d="M12 17C10.3431 17 9 15.6569 9 14C9 12.3431 10.3431 11 12 11C13.6569 11 15 12.3431 15 14C15 15.6569 13.6569 17 12 17Z" />
        </svg>
      </span>
    </b-button>
    <b-button
      v-if="showEdit"
      size="sm"
      variant="outline-primary"
      class="btn-action"
      :title="editTitle"
      @click="emit('edit', itemId)"
    >
      <span class="icon-svg" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 21L12 21H21" />
          <path d="M12.2218 5.82839L15.0503 2.99996L20 7.94971L17.1716 10.7781M12.2218 5.82839L6.61522 11.435C6.42769 11.6225 6.32233 11.8769 6.32233 12.1421L6.32233 16.6776L10.8579 16.6776C11.1231 16.6776 11.3774 16.5723 11.565 16.3847L17.1716 10.7781M12.2218 5.82839L17.1716 10.7781" />
        </svg>
      </span>
    </b-button>
    <b-button
      v-if="showDelete"
      size="sm"
      variant="outline-danger"
      class="btn-action"
      :title="deleteTitle"
      @click="emit('delete', itemId)"
    >
      <span class="icon-svg" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" />
          <path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" />
        </svg>
      </span>
    </b-button>
    <b-button
      v-if="showRestore"
      size="sm"
      variant="outline-success"
      class="btn-action"
      :title="restoreTitle"
      @click="emit('restore', itemId)"
    >
      <span class="icon-svg" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12a8 8 0 0 1 8-8V2l4 3.5L12 9V6a6 6 0 1 0 6 6" />
        </svg>
      </span>
    </b-button>
  </div>
</template>

<style scoped>
.table-action-buttons {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-action {
  width: 2rem;
  height: 2rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.icon-svg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
}

.icon-svg svg {
  width: 1.05rem;
  height: 1.05rem;
  color: currentColor;
}

.btn-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-action:active {
  transform: translateY(0);
}
</style>
