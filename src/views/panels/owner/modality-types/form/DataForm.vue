<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";
import UIComponentCard from "@/components/UIComponentCard.vue";
import type { ModalityTypeFormData } from "@/core/schemas";

const props = withDefaults(
  defineProps<{
    modelValue: ModalityTypeFormData;
    errors?: Record<string, string>;
    mode?: "create" | "edit" | "view";
    branchOptions?: Array<{ id: number; name: string; company_name?: string }>;
    lockBranchId?: number | null;
  }>(),
  {
    errors: () => ({}),
    mode: "create",
    branchOptions: () => [],
    lockBranchId: null,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: ModalityTypeFormData): void;
  (e: "clear-error", field: string): void;
}>();

const isView = computed(() => props.mode === "view");
const isBranchLocked = computed(() => Number(props.lockBranchId ?? 0) > 0);
const branchSelectRef = ref<HTMLSelectElement | null>(null);
let branchSelectr: any = null;

const localForm = computed({
  get: () => props.modelValue,
  set: (value: ModalityTypeFormData) => emit("update:modelValue", value),
});

function branchLabel(branch: { id: number; name: string; company_name?: string }) {
  return branch.company_name ? `${branch.name} (${branch.company_name})` : branch.name;
}

function updateField<K extends keyof ModalityTypeFormData>(field: K, value: ModalityTypeFormData[K]) {
  localForm.value = {
    ...localForm.value,
    [field]: value,
  };
  emit("clear-error", field);
}

function onBranchChange(event: Event) {
  const value = (event.target as HTMLSelectElement | null)?.value ?? "";
  updateField("branch_id", value === "" ? 0 : Number(value));
}

function parseSingleNumber(value: unknown): number {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function destroySelectrs() {
  branchSelectr?.destroy?.();
  branchSelectr = null;
}

function initSelectrs() {
  destroySelectrs();
  if (isView.value || isBranchLocked.value) return;
  if (!branchSelectRef.value || !(props.branchOptions?.length ?? 0)) return;

  branchSelectr = new Selectr(branchSelectRef.value, {
    searchable: true,
    multiple: false,
    placeholder: "Selecione uma filial",
  });
  branchSelectr.on("selectr.change", () => {
    updateField("branch_id", parseSingleNumber(branchSelectr.getValue()));
  });
  const branchId = Number(props.modelValue.branch_id ?? 0);
  if (branchId > 0) branchSelectr.setValue(branchId);
}

const selectSignature = computed(() =>
  JSON.stringify({
    mode: props.mode,
    lockBranchId: props.lockBranchId,
    branch_id: props.modelValue.branch_id,
    branches: props.branchOptions?.map((b) => b.id) ?? [],
  })
);

watch(selectSignature, async () => {
  await nextTick();
  initSelectrs();
});

onMounted(async () => {
  await nextTick();
  initSelectrs();
});

onBeforeUnmount(() => {
  destroySelectrs();
});
</script>

<template>
  <UIComponentCard title="Dados da modalidade de domingo">
    <b-row class="g-3">
      <b-col v-if="!isBranchLocked" md="12">
        <b-form-group label="Filial" label-for="modality-type-branch_id">
          <select
            id="modality-type-branch_id"
            ref="branchSelectRef"
            class="form-select"
            :disabled="isView || isBranchLocked"
            :class="{ 'is-invalid': !!errors?.branch_id }"
            @change="onBranchChange"
          >
            <option value="" :selected="!localForm.branch_id">Selecione uma filial</option>
            <option
              v-for="branch in branchOptions ?? []"
              :key="branch.id"
              :value="branch.id"
              :selected="Number(localForm.branch_id ?? 0) === branch.id"
            >
              {{ branchLabel(branch) }}
            </option>
          </select>
          <b-form-invalid-feedback v-if="errors?.branch_id">{{ errors.branch_id }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="12">
        <b-form-group label="Nome" label-for="modality-type-name">
          <b-form-input
            id="modality-type-name"
            :model-value="modelValue.name"
            type="text"
            placeholder="Nome do tipo (modalidade de domingo)"
            :readonly="isView"
            :class="{ 'is-invalid': errors?.name }"
            @update:model-value="updateField('name', String($event ?? ''))"
          />
          <b-form-text v-if="!isView">O slug será gerado automaticamente a partir do nome.</b-form-text>
          <b-form-invalid-feedback v-if="errors?.name">{{ errors.name }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-row>
    <div v-if="!isView" class="d-flex gap-2 mt-3">
      <slot name="actions" />
    </div>
  </UIComponentCard>
</template>
