<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { branchesApi } from "@/api/resources";
import type { BranchHolidayRecord } from "@/types/api";

const props = defineProps<{
  branchId: number;
  canSync?: boolean;
}>();

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TODAY = new Date().toISOString().slice(0, 10);
const currentYear = new Date().getFullYear();

const holidays = ref<BranchHolidayRecord[]>([]);
const loading = ref(false);
const syncing = ref(false);
const error = ref("");
const syncSuccess = ref(false);

/** tooltip state */
const tooltip = ref<{ name: string; kind: string | null; x: number; y: number } | null>(null);

/** Map "YYYY-MM-DD" → holiday */
const holidayMap = computed(() => {
  const m: Record<string, BranchHolidayRecord> = {};
  for (const h of holidays.value) {
    m[h.observed_date.slice(0, 10)] = h;
  }
  return m;
});

const countByKind = (kind: string) =>
  holidays.value.filter((h) => h.holiday_kind === kind).length;

const kindLabel = (kind?: string | null) => {
  if (kind === "NACIONAL") return "Nacional";
  if (kind === "ESTADUAL") return "Estadual";
  if (kind === "MUNICIPAL") return "Municipal";
  return kind ?? "—";
};

function calendarDays(monthIndex: number): Array<{ day: number | null; date: string | null }> {
  const firstDay = new Date(currentYear, monthIndex, 1).getDay();
  const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
  const cells: Array<{ day: number | null; date: string | null }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(monthIndex + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push({ day: d, date: `${currentYear}-${mm}-${dd}` });
  }
  return cells;
}

function showTooltip(event: MouseEvent, holiday: BranchHolidayRecord) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  tooltip.value = {
    name: holiday.name,
    kind: holiday.holiday_kind ?? null,
    x: rect.left + rect.width / 2,
    y: rect.top - 8,
  };
}

function hideTooltip() {
  tooltip.value = null;
}

async function loadHolidays() {
  if (!props.branchId) return;
  loading.value = true;
  error.value = "";
  try {
    const res = await branchesApi.holidays(props.branchId, currentYear);
    holidays.value = res.holidays ?? [];
  } catch {
    error.value = "Não foi possível carregar os feriados.";
  } finally {
    loading.value = false;
  }
}

async function doSync() {
  if (!props.branchId || syncing.value) return;
  syncing.value = true;
  syncSuccess.value = false;
  error.value = "";
  try {
    await branchesApi.syncHolidays(props.branchId, currentYear);
    syncSuccess.value = true;
    await loadHolidays();
  } catch {
    error.value = "Falha ao sincronizar feriados.";
  } finally {
    syncing.value = false;
  }
}

onMounted(loadHolidays);
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
      <div>
        <h2 class="h6 mb-1">Calendário de Feriados {{ currentYear }}</h2>
        <p class="text-muted small mb-0">Feriados nacionais, estaduais e municipais.</p>
      </div>
      <b-button
        v-if="canSync && !loading && holidays.length === 0"
        variant="outline-primary"
        size="sm"
        :disabled="syncing"
        @click="doSync"
      >
        <span v-if="syncing">Sincronizando…</span>
        <span v-else>↻ Sincronizar</span>
      </b-button>
    </div>

    <b-alert v-if="syncSuccess" variant="success" dismissible class="mb-3" @dismissed="syncSuccess = false">
      Feriados sincronizados com sucesso.
    </b-alert>
    <b-alert v-if="error" variant="danger" dismissible class="mb-3" @dismissed="error = ''">
      {{ error }}
    </b-alert>

    <div v-if="loading" class="text-muted py-4 text-center small">Carregando feriados…</div>

    <template v-else>
      <div class="mb-4">
        <template v-if="holidays.length === 0">
          <p class="text-muted mb-0">Nenhum feriado registado para {{ currentYear }}.</p>
        </template>
        <template v-else>
          <div class="d-flex flex-wrap gap-3 align-items-center">
            <div v-if="countByKind('NACIONAL')" class="holiday-stat" style="background: #fe6959;">
              <span class="holiday-stat-count">{{ countByKind('NACIONAL') }}</span>
              <span class="holiday-stat-label">Nacionais</span>
            </div>
            <div v-if="countByKind('ESTADUAL')" class="holiday-stat" style="background: #6c757d;">
              <span class="holiday-stat-count">{{ countByKind('ESTADUAL') }}</span>
              <span class="holiday-stat-label">Estaduais</span>
            </div>
            <div v-if="countByKind('MUNICIPAL')" class="holiday-stat" style="background: #0179fe;">
              <span class="holiday-stat-count">{{ countByKind('MUNICIPAL') }}</span>
              <span class="holiday-stat-label">Municipais</span>
            </div>
            <span class="text-muted small ms-1">
              {{ holidays.length }} feriado{{ holidays.length !== 1 ? "s" : "" }} no total
            </span>
          </div>
        </template>
      </div>

      <!-- 12-month calendar grid -->
      <div class="row g-3">
        <div
          v-for="(monthName, mi) in MONTHS"
          :key="mi"
          class="col-12 col-sm-6 col-md-4 col-xl-3"
        >
          <div class="cal-card border rounded overflow-hidden h-100">
            <!-- Month header -->
            <div class="cal-month-header text-center text-white fw-semibold small py-1 px-2">
              {{ monthName }}
            </div>

            <div class="p-2">
              <!-- Weekday labels -->
              <div class="calendar-grid mb-1">
                <div
                  v-for="wl in WEEK_LABELS"
                  :key="wl"
                  class="cal-cell text-center text-muted"
                  style="font-size: 0.62rem; font-weight: 600;"
                >
                  {{ wl }}
                </div>
              </div>

              <!-- Day cells -->
              <div class="calendar-grid">
                <div
                  v-for="(cell, ci) in calendarDays(mi)"
                  :key="ci"
                  class="cal-cell text-center"
                  :class="{
                    [`cal-holiday-${(holidayMap[cell.date!]?.holiday_kind ?? 'NACIONAL').toLowerCase()}`]: cell.date && holidayMap[cell.date],
                    'cal-today': cell.date === TODAY,
                  }"
                  @mouseenter="cell.date && holidayMap[cell.date] ? showTooltip($event, holidayMap[cell.date]) : undefined"
                  @mouseleave="hideTooltip"
                >
                  <span v-if="cell.day" class="cal-day-label">{{ cell.day }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Holiday list -->
      <div v-if="holidays.length" class="mt-4">
        <h3 class="h6 mb-3">Lista de feriados {{ currentYear }}</h3>
        <div class="border rounded">
          <div
            v-for="(h, hi) in holidays"
            :key="h.id"
            class="d-flex align-items-center gap-2 px-3 py-2"
            :class="{ 'border-top': hi > 0 }"
          >
            <span class="text-muted small" style="min-width: 90px; font-variant-numeric: tabular-nums;">
              {{ new Date(h.observed_date.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) }}
            </span>
            <span class="flex-grow-1 small">{{ h.name }}</span>
            <span
              v-if="h.holiday_kind"
              class="kind-badge"
              :class="`kind-badge--${h.holiday_kind.toLowerCase()}`"
            >
              {{ kindLabel(h.holiday_kind) }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Floating tooltip -->
    <Teleport to="body">
      <div
        v-if="tooltip"
        class="cal-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <span class="cal-tooltip-name">{{ tooltip.name }}</span>
        <span v-if="tooltip.kind" class="cal-tooltip-kind">{{ kindLabel(tooltip.kind) }}</span>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.holiday-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 10px 20px;
  min-width: 90px;
  color: #fff;
}

.holiday-stat-count {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.1;
}

.holiday-stat-label {
  font-size: 0.72rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2px;
}

.cal-month-header {
  background-color: #0179fe;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.cal-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 0.7rem;
  position: relative;
  cursor: default;
}

.cal-day-label {
  line-height: 1;
}

/* Nacional — laranja */
.cal-holiday-nacional {
  background-color: #ffe5e2;
  color: #b93e2e;
  font-weight: 600;
}

/* Estadual — amarelo */
.cal-holiday-estadual {
  background-color: #fff4cc;
  color: #856404;
  font-weight: 600;
}

/* Municipal — azul claro */
.cal-holiday-municipal {
  background-color: #d0efff;
  color: #015a8a;
  font-weight: 600;
}

.cal-today {
  outline: 2px solid #0179fe;
  outline-offset: -2px;
}

/* Badge inline na lista */
.kind-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 20px;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.kind-badge--nacional {
  background-color: #ffe5e2;
  color: #b93e2e;
}

.kind-badge--estadual {
  background-color: #fff4cc;
  color: #856404;
}

.kind-badge--municipal {
  background-color: #d0efff;
  color: #015a8a;
}
</style>

<style>
.cal-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  background: #1a1a2e;
  color: #fff;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  white-space: nowrap;
  pointer-events: none;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.cal-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1a1a2e;
}

.cal-tooltip-name {
  font-weight: 600;
}

.cal-tooltip-kind {
  font-size: 0.65rem;
  opacity: 0.75;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
