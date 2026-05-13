<script setup lang="ts">
import UIComponentCard from "@/components/UIComponentCard.vue";
import type { DayOffModalityFormData } from "@/core/schemas";

const props = defineProps<{
  modelValue: DayOffModalityFormData;
  errors?: Record<string, string>;
  mode?: "create" | "edit" | "view";
  branchOptions?: Array<{ id: number; name: string; company_name?: string }>;
  lockBranchId?: number | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: DayOffModalityFormData): void;
  (e: "clear-error", field: string): void;
}>();

function updateField<K extends keyof DayOffModalityFormData>(field: K, value: DayOffModalityFormData[K]) {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
  emit("clear-error", field);
}
</script>

<template>
  <UIComponentCard title="Dados da modalidade de folga">
    <b-row class="g-3">
      <b-col v-if="Number(lockBranchId ?? 0) <= 0" md="12">
        <b-form-group label="Filial">
          <b-form-select
            :disabled="mode === 'view' || Number(lockBranchId ?? 0) > 0"
            :model-value="modelValue.branch_id"
            :options="[{ value: 0, text: 'Selecione uma filial' }, ...(branchOptions ?? []).map((b) => ({ value: b.id, text: b.company_name ? `${b.name} (${b.company_name})` : b.name }))]"
            :class="{ 'is-invalid': !!errors?.branch_id }"
            @update:model-value="updateField('branch_id', Number($event ?? 0))"
          />
          <b-form-invalid-feedback v-if="errors?.branch_id">{{ errors.branch_id }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="12">
        <b-form-group label="Nome">
          <b-form-input :readonly="mode === 'view'" :model-value="modelValue.name" :class="{ 'is-invalid': !!errors?.name }" @update:model-value="updateField('name', String($event ?? ''))" />
          <b-form-invalid-feedback v-if="errors?.name">{{ errors.name }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="12">
        <b-form-group label="Descrição">
          <b-form-textarea :readonly="mode === 'view'" rows="3" :model-value="modelValue.description ?? ''" @update:model-value="updateField('description', String($event ?? ''))" />
        </b-form-group>
      </b-col>
      <b-col md="12">
        <b-form-checkbox :disabled="mode === 'view'" :model-value="!!modelValue.is_default" @update:model-value="updateField('is_default', !!$event)">
          Modalidade padrão
        </b-form-checkbox>
      </b-col>
    </b-row>
    <div v-if="mode !== 'view'" class="d-flex gap-2 mt-3">
      <slot name="actions" />
    </div>
  </UIComponentCard>
</template>
