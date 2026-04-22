<script setup lang="ts">
export interface AuditsFilterModel {
  event: string;
  auditable_type: string;
  created_at_from: string;
  created_at_until: string;
}

const props = defineProps<{
  modelValue: AuditsFilterModel;
  active?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: AuditsFilterModel): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();

function update<K extends keyof AuditsFilterModel>(field: K, value: AuditsFilterModel[K]) {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
}
</script>

<template>
  <div class="p-0">
    <b-row class="g-3">
      <b-col md="4">
        <b-form-group label="Evento" label-for="filter-audits-event">
          <b-form-input
            id="filter-audits-event"
            :model-value="modelValue.event"
            type="text"
            placeholder="ex: created, updated"
            @update:model-value="update('event', $event)"
          />
        </b-form-group>
      </b-col>
      <b-col md="4">
        <b-form-group label="Tipo (modelo)" label-for="filter-audits-type">
          <b-form-input
            id="filter-audits-type"
            :model-value="modelValue.auditable_type"
            type="text"
            placeholder="ex: App\Models\Company"
            @update:model-value="update('auditable_type', $event)"
          />
        </b-form-group>
      </b-col>
      <div class="w-100" aria-hidden="true" />
      <b-col md="6">
        <b-form-group label="Data de cadastro de" label-for="filter-audits-created-from">
          <b-form-input
            id="filter-audits-created-from"
            :model-value="modelValue.created_at_from"
            type="date"
            @update:model-value="update('created_at_from', $event)"
          />
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Data de cadastro até" label-for="filter-audits-created-until">
          <b-form-input
            id="filter-audits-created-until"
            :model-value="modelValue.created_at_until"
            type="date"
            @update:model-value="update('created_at_until', $event)"
          />
        </b-form-group>
      </b-col>
    </b-row>

    <div class="d-flex justify-content-end gap-2 mt-3">
      <b-button variant="outline-secondary" @click="$emit('reset')">Limpar</b-button>
      <b-button variant="primary" @click="$emit('apply')">Aplicar filtros</b-button>
    </div>
  </div>
</template>
