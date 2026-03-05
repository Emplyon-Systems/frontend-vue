<script setup lang="ts">
export interface CompaniesFilterModel {
  name: string;
  cnpj: string;
  created_at_from: string;
  created_at_until: string;
  per_page: number;
}

const props = defineProps<{
  modelValue: CompaniesFilterModel;
  active?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: CompaniesFilterModel): void;
  (e: "apply"): void;
  (e: "reset"): void;
}>();

function update<K extends keyof CompaniesFilterModel>(field: K, value: CompaniesFilterModel[K]) {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
}
</script>

<template>
  <div class="p-0">
    <b-row class="g-3">
      <b-col md="6">
        <b-form-group label="Nome da empresa" label-for="filter-name">
          <b-form-input
            id="filter-name"
            :model-value="modelValue.name"
            type="text"
            placeholder="Nome da empresa"
            @update:model-value="update('name', $event)"
          />
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="CNPJ" label-for="filter-cnpj">
          <b-form-input
            id="filter-cnpj"
            :model-value="modelValue.cnpj"
            type="text"
            placeholder="CNPJ"
            @update:model-value="update('cnpj', $event)"
          />
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Data de cadastro de" label-for="filter-created-from">
          <b-form-input
            id="filter-created-from"
            :model-value="modelValue.created_at_from"
            type="date"
            @update:model-value="update('created_at_from', $event)"
          />
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Data de cadastro até" label-for="filter-created-until">
          <b-form-input
            id="filter-created-until"
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
