<script setup lang="ts">
import type { BranchScheduleRuleRecord } from "@/types/api";

const props = withDefaults(
  defineProps<{
    rules: BranchScheduleRuleRecord[];
  }>(),
  {
    rules: () => [],
  }
);

const WEEKDAYS = [
  { value: 1, label: "Seg", long: "Segunda" },
  { value: 2, label: "Ter", long: "Terça" },
  { value: 3, label: "Qua", long: "Quarta" },
  { value: 4, label: "Qui", long: "Quinta" },
  { value: 5, label: "Sex", long: "Sexta" },
  { value: 6, label: "Sáb", long: "Sábado" },
  { value: 7, label: "Dom", long: "Domingo" },
] as const;

function dayLongLabel(d: number): string {
  return WEEKDAYS.find((x) => x.value === d)?.long ?? String(d);
}

function formatTime(v: string): string {
  const m = String(v ?? "").match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "—";
}
</script>

<template>
  <div>
    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
      <div>
        <h2 class="h6 mb-1">Horários e expediente</h2>
        <p class="text-muted small mb-0">Regras por período (1 = segunda … 7 = domingo).</p>
      </div>
    </div>

    <div v-if="!props.rules.length" class="border rounded p-4 text-center text-muted">
      Nenhuma regra de horário registada para esta filial.
    </div>

    <div v-else class="border rounded p-3">
      <div
        v-for="(rule, ri) in props.rules"
        :key="rule.id ?? ri"
        class="mb-3 pb-3 border-bottom"
        :class="{ 'border-0 mb-0 pb-0': ri === props.rules.length - 1 }"
      >
        <p class="fw-medium mb-1">Período {{ ri + 1 }}</p>
        <p class="text-muted small mb-2">
          Dias:
          {{ rule.weekdays?.length ? rule.weekdays.map(dayLongLabel).join(", ") : "—" }}
        </p>
        <template v-if="rule.is_closed">
          <p class="mb-0 text-muted">Fechado (sem expediente nem loja)</p>
        </template>
        <template v-else>
          <p class="small mb-1">
            Expediente:
            {{ formatTime(String(rule.expedient_start_time ?? "")) }} –
            {{ formatTime(String(rule.expedient_end_time ?? "")) }}
          </p>
          <p class="small mb-0">
            Clientes:
            {{ formatTime(String(rule.store_open_time ?? "")) }} –
            {{ formatTime(String(rule.store_close_time ?? "")) }}
          </p>
        </template>
        <p
          v-if="rule.break_duration_minutes != null && rule.break_duration_minutes > 0"
          class="small mb-0 mt-1 text-muted"
        >
          Intervalo de refeição: {{ rule.break_duration_minutes }} min
        </p>
        <p
          v-if="rule.daily_work_minutes != null && rule.daily_work_minutes > 0"
          class="small mb-0 text-muted"
        >
          Carga horária diária: {{ rule.daily_work_minutes }} min
        </p>
      </div>
    </div>
  </div>
</template>
