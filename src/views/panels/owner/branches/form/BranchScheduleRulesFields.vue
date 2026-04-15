<script setup lang="ts">
import type { BranchScheduleRuleFormRow } from "@/core/schemas";

const props = withDefaults(
  defineProps<{
    rules: BranchScheduleRuleFormRow[];
    errors?: Record<string, string>;
    disabled?: boolean;
  }>(),
  {
    errors: () => ({}),
    disabled: false,
  }
);

const emit = defineEmits<{
  (e: "update:rules", value: BranchScheduleRuleFormRow[]): void;
  (e: "clear-error", field: string): void;
}>();

const WEEKDAYS = [
  { value: 1, label: "Seg", long: "Segunda" },
  { value: 2, label: "Ter", long: "Terça" },
  { value: 3, label: "Qua", long: "Quarta" },
  { value: 4, label: "Qui", long: "Quinta" },
  { value: 5, label: "Sex", long: "Sexta" },
  { value: 6, label: "Sáb", long: "Sábado" },
  { value: 7, label: "Dom", long: "Domingo" },
] as const;

function patchRule(ruleIndex: number, patch: Partial<BranchScheduleRuleFormRow>) {
  const rules = [...(props.rules ?? [])];
  if (!rules[ruleIndex]) return;
  rules[ruleIndex] = { ...rules[ruleIndex], ...patch };
  emit("update:rules", rules);
  Object.keys(patch).forEach((k) => emit("clear-error", `schedule_rules.${ruleIndex}.${k}`));
  emit("clear-error", "schedule_rules");
}

function toggleWeekday(ruleIndex: number, day: number, checked: boolean) {
  const rules = [...(props.rules ?? [])];
  const row = rules[ruleIndex];
  if (!row) return;
  const set = new Set(row.weekdays);
  if (checked) set.add(day);
  else set.delete(day);
  rules[ruleIndex] = { ...row, weekdays: [...set].sort((a, b) => a - b) };
  emit("update:rules", rules);
  emit("clear-error", `schedule_rules.${ruleIndex}.weekdays`);
  emit("clear-error", "schedule_rules");
}

function addRule() {
  const prev = [...(props.rules ?? [])];
  prev.push({
    weekdays: [],
    is_closed: false,
    expedient_start_time: "08:00",
    expedient_end_time: "18:00",
    store_open_time: "09:00",
    store_close_time: "18:00",
    break_duration_minutes: null,
    daily_work_minutes: null,
    sort_order: prev.length,
  });
  emit("update:rules", prev);
  emit("clear-error", "schedule_rules");
}

function removeRule(ruleIndex: number) {
  const prev = [...(props.rules ?? [])];
  if (prev.length <= 1) return;
  prev.splice(ruleIndex, 1);
  emit("update:rules", prev);
  emit("clear-error", "schedule_rules");
}
</script>

<template>
  <div class="mb-3">
    <h6 class="mb-2">Horários por período</h6>
    <p class="text-muted small mb-3">
      Em cada regra escolha os dias (1 = segunda … 7 = domingo). Os sete dias têm de estar cobertos, sem repetir o mesmo dia em duas regras.
    </p>
    <b-alert v-if="errors.schedule_rules" :model-value="true" variant="danger" class="small py-2">
      {{ errors.schedule_rules }}
    </b-alert>
    <div v-for="(rule, ri) in rules" :key="ri" class="border rounded p-3 mb-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <span class="fw-medium">Regra {{ ri + 1 }}</span>
        <b-button
          v-if="!disabled"
          type="button"
          size="sm"
          variant="outline-danger"
          :disabled="rules.length <= 1"
          @click="removeRule(ri)"
        >
          Remover regra
        </b-button>
      </div>
      <b-form-group class="mb-2">
        <template #label>Dias da semana <span class="text-danger">*</span></template>
        <div class="d-flex flex-wrap gap-2">
          <b-form-checkbox
            v-for="d in WEEKDAYS"
            :key="d.value"
            :model-value="rule.weekdays.includes(d.value)"
            :disabled="disabled"
            @update:model-value="toggleWeekday(ri, d.value, Boolean($event))"
          >
            {{ d.label }}
          </b-form-checkbox>
        </div>
        <div v-if="errors[`schedule_rules.${ri}.weekdays`]" class="invalid-feedback d-block">
          {{ errors[`schedule_rules.${ri}.weekdays`] }}
        </div>
      </b-form-group>
      <b-form-checkbox
        class="mb-3"
        :model-value="rule.is_closed"
        :disabled="disabled"
        @update:model-value="patchRule(ri, { is_closed: Boolean($event) })"
      >
        Fechado nestes dias (sem expediente nem atendimento ao público)
      </b-form-checkbox>
      <b-row v-if="!rule.is_closed" class="g-2">
        <b-col md="6">
          <b-form-group :label-for="`exps-${ri}`" class="mb-2">
            <template #label>Início expediente <span class="text-danger">*</span></template>
            <b-form-input
              :id="`exps-${ri}`"
              type="time"
              :model-value="rule.expedient_start_time"
              :disabled="disabled"
              :state="errors[`schedule_rules.${ri}.expedient_start_time`] ? false : null"
              @update:model-value="patchRule(ri, { expedient_start_time: String($event ?? '') })"
            />
            <b-form-invalid-feedback v-if="errors[`schedule_rules.${ri}.expedient_start_time`]">
              {{ errors[`schedule_rules.${ri}.expedient_start_time`] }}
            </b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group :label-for="`expe-${ri}`" class="mb-2">
            <template #label>Fim expediente <span class="text-danger">*</span></template>
            <b-form-input
              :id="`expe-${ri}`"
              type="time"
              :model-value="rule.expedient_end_time"
              :disabled="disabled"
              :state="errors[`schedule_rules.${ri}.expedient_end_time`] ? false : null"
              @update:model-value="patchRule(ri, { expedient_end_time: String($event ?? '') })"
            />
            <b-form-invalid-feedback v-if="errors[`schedule_rules.${ri}.expedient_end_time`]">
              {{ errors[`schedule_rules.${ri}.expedient_end_time`] }}
            </b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group :label-for="`sto-${ri}`" class="mb-2">
            <template #label>Abertura loja (clientes) <span class="text-danger">*</span></template>
            <b-form-input
              :id="`sto-${ri}`"
              type="time"
              :model-value="rule.store_open_time"
              :disabled="disabled"
              :state="errors[`schedule_rules.${ri}.store_open_time`] ? false : null"
              @update:model-value="patchRule(ri, { store_open_time: String($event ?? '') })"
            />
            <b-form-invalid-feedback v-if="errors[`schedule_rules.${ri}.store_open_time`]">
              {{ errors[`schedule_rules.${ri}.store_open_time`] }}
            </b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group :label-for="`stc-${ri}`" class="mb-2">
            <template #label>Fecho loja (clientes) <span class="text-danger">*</span></template>
            <b-form-input
              :id="`stc-${ri}`"
              type="time"
              :model-value="rule.store_close_time"
              :disabled="disabled"
              :state="errors[`schedule_rules.${ri}.store_close_time`] ? false : null"
              @update:model-value="patchRule(ri, { store_close_time: String($event ?? '') })"
            />
            <b-form-invalid-feedback v-if="errors[`schedule_rules.${ri}.store_close_time`]">
              {{ errors[`schedule_rules.${ri}.store_close_time`] }}
            </b-form-invalid-feedback>
          </b-form-group>
        </b-col>
      </b-row>
      <b-row class="g-2">
        <b-col md="6">
          <b-form-group :label-for="`break-${ri}`" class="mb-0">
            <template #label>Intervalo refeição (minutos)</template>
            <b-form-input
              :id="`break-${ri}`"
              type="number"
              min="0"
              max="720"
              placeholder="Opcional"
              :model-value="rule.break_duration_minutes ?? ''"
              :disabled="disabled"
              @update:model-value="
                patchRule(ri, {
                  break_duration_minutes:
                    $event === '' || $event == null ? null : Math.min(720, Math.max(0, Number($event))),
                })
              "
            />
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group :label-for="`daily-${ri}`" class="mb-0">
            <template #label>Carga horária diária (minutos)</template>
            <b-form-input
              :id="`daily-${ri}`"
              type="number"
              min="0"
              max="1440"
              placeholder="Opcional"
              :model-value="rule.daily_work_minutes ?? ''"
              :disabled="disabled"
              @update:model-value="
                patchRule(ri, {
                  daily_work_minutes:
                    $event === '' || $event == null ? null : Math.min(1440, Math.max(0, Number($event))),
                })
              "
            />
          </b-form-group>
        </b-col>
      </b-row>
    </div>
    <b-button v-if="!disabled" type="button" variant="outline-primary" size="sm" class="mb-2" @click="addRule">
      + Adicionar regra
    </b-button>
  </div>
</template>
