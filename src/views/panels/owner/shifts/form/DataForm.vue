<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";
import UIComponentCard from "@/components/UIComponentCard.vue";
import AppAlert from "@/components/AppAlert.vue";
import { SHIFT_NAMES, type ShiftFormData } from "@/core/schemas";

const props = withDefaults(
  defineProps<{
    modelValue: ShiftFormData;
    errors?: Record<string, string>;
    mode?: "create" | "edit" | "view";
    branchOptions?: Array<{ id: number; name: string; company_name?: string }>;
    lockBranchId?: number | null;
    showBranchCompanyName?: boolean;
  }>(),
  {
    errors: () => ({}),
    mode: "create",
    branchOptions: () => [],
    lockBranchId: null,
    showBranchCompanyName: true,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: ShiftFormData): void;
  (e: "clear-error", field: string): void;
}>();

const isView = computed(() => props.mode === "view");
const isBranchLocked = computed(() => Number(props.lockBranchId ?? 0) > 0);
const branchSelectRef = ref<HTMLSelectElement | null>(null);
let branchSelectr: any = null;

const localForm = computed({
  get: () => props.modelValue,
  set: (value: ShiftFormData) => emit("update:modelValue", value),
});

function branchLabel(branch: { id: number; name: string; company_name?: string }) {
  if (!props.showBranchCompanyName) return branch.name;
  return branch.company_name ? `${branch.name} (${branch.company_name})` : branch.name;
}

function updateField<K extends keyof ShiftFormData>(field: K, value: ShiftFormData[K]) {
  localForm.value = {
    ...localForm.value,
    [field]: value,
  };
  emit("clear-error", field);
}

const standardShiftNameList: readonly string[] = SHIFT_NAMES;

const shiftNameSelectOptions = computed(() => {
  const current = String(props.modelValue.name ?? "").trim();
  const base = SHIFT_NAMES.map((n) => ({ value: n, text: n }));
  if (current && !standardShiftNameList.includes(current)) {
    return [
      {
        value: current,
        text: `${current} (atual — escolha Manhã, Tarde ou Noite)`,
      },
      ...base,
    ];
  }
  return base;
});

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
  <UIComponentCard title="Dados do turno">
    <b-row v-if="errors?.general" class="g-3 mb-2">
      <b-col md="12">
        <AppAlert variant="danger">{{ errors.general }}</AppAlert>
      </b-col>
    </b-row>
    <b-row class="g-3">
      <b-col v-if="!isBranchLocked" md="12">
        <b-form-group label="Filial" label-for="shift-branch_id">
          <select
            id="shift-branch_id"
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
      <b-col :md="isView && !isBranchLocked ? 6 : 12">
        <b-form-group label="Nome" label-for="shift-name">
          <b-form-select
            v-if="!isView"
            id="shift-name"
            :model-value="modelValue.name"
            :options="shiftNameSelectOptions"
            :class="{ 'is-invalid': errors?.name }"
            @update:model-value="updateField('name', String($event ?? '') as ShiftFormData['name'])"
          />
          <b-form-input
            v-else
            id="shift-name"
            :model-value="modelValue.name"
            type="text"
            readonly
            :class="{ 'is-invalid': errors?.name }"
          />
          <b-form-invalid-feedback v-if="errors?.name">{{ errors.name }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col v-if="isView && !isBranchLocked" md="6">
        <b-form-group label="Slug" label-for="shift-slug">
          <b-form-input
            id="shift-slug"
            :model-value="modelValue.slug"
            type="text"
            readonly
            :class="{ 'is-invalid': errors?.slug }"
          />
          <b-form-invalid-feedback v-if="errors?.slug">{{ errors.slug }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Horário de início" label-for="shift-start_time">
          <b-form-input
            id="shift-start_time"
            :model-value="modelValue.start_time"
            type="time"
            :readonly="isView"
            :class="{ 'is-invalid': errors?.start_time }"
            @update:model-value="updateField('start_time', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors?.start_time">{{ errors.start_time }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Horário de término" label-for="shift-end_time">
          <b-form-input
            id="shift-end_time"
            :model-value="modelValue.end_time"
            type="time"
            :readonly="isView"
            :class="{ 'is-invalid': errors?.end_time }"
            @update:model-value="updateField('end_time', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors?.end_time">{{ errors.end_time }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-row>
    <div v-if="!isView" class="d-flex gap-2 mt-3">
      <slot name="actions" />
    </div>
  </UIComponentCard>
</template>
