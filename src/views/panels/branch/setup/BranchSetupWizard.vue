<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { branchesApi, companiesApi, usersApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";
import { generateSecureRandomPassword } from "@/helpers/generate-password";
import { notifySuccess } from "@/helpers/notify";
import type { BranchScheduleRulePayloadItem } from "@/api/resources/branches";

const emit = defineEmits<{ (e: "completed"): void }>();

const authStore = useAuthStore();

const TOTAL_STEPS = 7;
const currentStep = ref(1);
const saving = ref(false);
const saveError = ref("");
const showEmployeePassword = ref(false);
const showEmployeePasswordConfirm = ref(false);
const showEmployeeEmailHelp = ref(false);

const branchId = computed(() => {
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.id ?? 0);
});
const companyId = computed(() => {
  const fromContext = Number(authStore.activeContext?.company_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.company_id ?? 0);
});

const state = reactive({
  weekdays: [1, 2, 3, 4, 5, 6] as number[],
  weekExpStart: "08:00",
  weekExpEnd: "18:00",

  weekStoreOpen: "09:00",
  weekStoreClose: "18:00",

  sundayClosed: false,
  sunExpStart: "09:00",
  sunExpEnd: "17:00",
  sunStoreOpen: "09:00",
  sunStoreClose: "17:00",

  dailyWorkHhMm: "08:48",
  breakHhMm: "01:00",

  sectorInput: "",

  empName: "",
  empEmail: "",
  empJobTitle: "",
  empPassword: "",
  empPasswordConfirm: "",
});

function applyGeneratedEmployeePassword(): void {
  const p = generateSecureRandomPassword(12);
  state.empPassword = p;
  state.empPasswordConfirm = p;
}

/** Domínio sintético da empresa (ex.: nomedaempresa.com), igual ao cadastro de funcionários. */
const tenantEmailDomain = ref<string | null>(null);

async function loadCompanyEmailDomain() {
  const cid = companyId.value;
  if (cid <= 0) {
    tenantEmailDomain.value = null;
    return;
  }
  try {
    const res = await companiesApi.getById(cid);
    const d = (res.company?.internal_email_domain ?? "").trim();
    tenantEmailDomain.value = d || null;
  } catch {
    tenantEmailDomain.value = null;
  }
}

onMounted(() => {
  void loadCompanyEmailDomain();
});
watch(companyId, () => {
  void loadCompanyEmailDomain();
});

const tenantDomainNormalized = computed(() => (tenantEmailDomain.value ?? "").trim().toLowerCase());
const useSplitTenantEmail = computed(() => Boolean(tenantDomainNormalized.value));

const WEEKDAYS_OPT = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
] as const;

function hhMmToMinutes(v: string): number {
  const m = String(v ?? "").match(/^(\d+):(\d{2})/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

function toggleWeekday(day: number) {
  const s = new Set(state.weekdays);
  if (s.has(day)) s.delete(day);
  else s.add(day);
  state.weekdays = [...s].sort((a, b) => a - b);
}

function addSector() {
  const name = state.sectorInput.trim();
  if (!name) return;
  state.sectorInput = name;
}

const canonicalSectorName = computed(() => state.sectorInput.trim());

/** Alinhado ao backend: setor + nº utilizador + ordem da filial (2 dígitos cada até 99, depois cresce). */
const previewEmployeeEmail = ref("");

const previewEmployeeEmailLocal = computed(() => {
  const full = previewEmployeeEmail.value;
  const dom = tenantDomainNormalized.value;
  if (!full || !dom) return "";
  const suf = `@${dom.toLowerCase()}`;
  if (!full.toLowerCase().endsWith(suf)) return full;
  return full.slice(0, full.length - suf.length);
});

async function refreshEmployeeEmailPreview() {
  const dom = tenantDomainNormalized.value;
  const bid = branchId.value;
  const sector = state.sectorInput.trim();
  if (!dom || bid <= 0 || !sector) {
    previewEmployeeEmail.value = "";
    return;
  }
  try {
    const res = await usersApi.syntheticEmailPreview({
      branch_id: bid,
      sector_name: sector,
    });
    previewEmployeeEmail.value = (res.preview?.email ?? "").trim();
  } catch {
    previewEmployeeEmail.value = "";
  }
}

watch(
  () => [currentStep.value, tenantDomainNormalized.value, branchId.value, state.sectorInput] as const,
  () => {
    if (currentStep.value === 7) void refreshEmployeeEmailPreview();
  },
  { immediate: true }
);

/** Texto do modal interno «Como funciona?» (e-mail do colaborador na filial). */
const employeeEmailHowItWorksText = computed(() => {
  const dom = tenantDomainNormalized.value;
  if (dom) {
    return (
      "O e-mail é gerado pelo sistema e não pode ser alterado: nome do setor normalizado " +
      "(sem acentos, só letras minúsculas e números) + número sequencial do utilizador na empresa " +
      "(global; 01…99, depois mais dígitos se precisar) + posição da filial (01…99, idem) + @ + domínio interno (" +
      dom +
      "). O número do utilizador é atribuído ao guardar."
    );
  }
  return "Sem domínio interno na empresa, este formato automático não está disponível. Configure o domínio nos dados da empresa.";
});

function syncEmployeeEmailFromRule() {
  if (!previewEmployeeEmail.value) return;
  state.empEmail = previewEmployeeEmail.value;
}

const stepError = computed<string>(() => {
  const s = currentStep.value;
  if (s === 1) {
    if (!state.weekdays.length) return "Selecione pelo menos um dia da semana.";
    if (!state.weekExpStart || !state.weekExpEnd) return "Defina início e fim do expediente.";
    if (state.weekExpStart >= state.weekExpEnd) return "Início deve ser antes do fim do expediente.";
  }
  if (s === 2) {
    if (!state.weekStoreOpen || !state.weekStoreClose) return "Defina o horário de abertura e fecho da loja.";
    if (state.weekStoreOpen >= state.weekStoreClose) return "Abertura deve ser antes do fecho.";
  }
  if (s === 3 && !state.sundayClosed) {
    if (!state.sunExpStart || !state.sunExpEnd) return "Defina horários do expediente de domingo.";
    if (state.sunExpStart >= state.sunExpEnd) return "Início do expediente de domingo deve ser antes do fim.";
    if (!state.sunStoreOpen || !state.sunStoreClose) return "Defina horários da loja de domingo.";
    if (state.sunStoreOpen >= state.sunStoreClose) return "Abertura da loja de domingo deve ser antes do fecho.";
  }
  if (s === 4 && !/^\d+:\d{2}$/.test(state.dailyWorkHhMm)) return "Insira a carga horária no formato HH:MM.";
  if (s === 5 && !/^\d+:\d{2}$/.test(state.breakHhMm)) return "Insira o tempo de refeição no formato HH:MM.";
  if (s === 6 && !state.sectorInput.trim()) return "Informe o nome do setor.";
  if (s === 7) {
    if (!state.empName.trim()) return "Nome do funcionário é obrigatório.";
    if (!previewEmployeeEmail.value) return "E-mail automático indisponível. Verifique setor e domínio.";
    if (state.empEmail.trim().toLowerCase() !== previewEmployeeEmail.value.toLowerCase()) {
      return `E-mail automático: ${previewEmployeeEmail.value}`;
    }
    if (!state.empJobTitle.trim()) return "Cargo é obrigatório.";
    if (!state.empPassword || state.empPassword.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres.";
    }
    if (state.empPassword !== state.empPasswordConfirm) {
      return "As senhas não coincidem.";
    }
  }
  return "";
});

watch([currentStep, () => previewEmployeeEmail.value], () => {
  if (currentStep.value === 7) syncEmployeeEmailFromRule();
});

watch(currentStep, (s) => {
  if (s !== 7) showEmployeeEmailHelp.value = false;
});

const progressPct = computed(() => Math.round((currentStep.value / TOTAL_STEPS) * 100));

const steps: { icon: string; title: string; subtitle: string }[] = [
  { icon: "iconoir-clock",      title: "Horário de Trabalho",    subtitle: "Defina o expediente dos colaboradores (Seg–Sáb)" },
  { icon: "iconoir-shop",       title: "Funcionamento da Loja",  subtitle: "Horário de atendimento ao público (Seg–Sáb)" },
  { icon: "iconoir-calendar",   title: "Horários de Domingo",    subtitle: "Defina os horários específicos para Domingos" },
  { icon: "iconoir-time-zone",  title: "Carga Horária",          subtitle: "Qual a carga horária diária padrão?" },
  { icon: "iconoir-timer",      title: "Tempo de Refeição",      subtitle: "Quanto tempo de intervalo para refeição?" },
  { icon: "iconoir-building",   title: "Criar Setor",            subtitle: "Defina o primeiro de setor da sua filial" },
  { icon: "iconoir-user-plus",  title: "Primeiro Funcionário",   subtitle: "Adicione o primeiro colaborador da filial" },
];

function next() {
  if (stepError.value) return;
  if (currentStep.value === 6) addSector();
  if (currentStep.value < TOTAL_STEPS) { currentStep.value++; saveError.value = ""; }
  else finish();
}

function prev() {
  if (currentStep.value > 1) { currentStep.value--; saveError.value = ""; }
}

async function finish() {
  if (stepError.value || !branchId.value) return;
  saving.value = true;
  saveError.value = "";
  try {
    const breakMins = hhMmToMinutes(state.breakHhMm) || null;
    const dailyMins = hhMmToMinutes(state.dailyWorkHhMm) || null;

    const scheduleRules: BranchScheduleRulePayloadItem[] = [
      {
        weekdays: state.weekdays,
        is_closed: false,
        expedient_start_time: state.weekExpStart,
        expedient_end_time: state.weekExpEnd,
        store_open_time: state.weekStoreOpen,
        store_close_time: state.weekStoreClose,
        break_duration_minutes: breakMins,
        daily_work_minutes: dailyMins,
        sort_order: 0,
      },
      {
        weekdays: [7],
        is_closed: state.sundayClosed,
        expedient_start_time: state.sundayClosed ? undefined : state.sunExpStart,
        expedient_end_time: state.sundayClosed ? undefined : state.sunExpEnd,
        store_open_time: state.sundayClosed ? undefined : state.sunStoreOpen,
        store_close_time: state.sundayClosed ? undefined : state.sunStoreClose,
        break_duration_minutes: state.sundayClosed ? null : breakMins,
        daily_work_minutes: state.sundayClosed ? null : dailyMins,
        sort_order: 1,
      },
    ];

    syncEmployeeEmailFromRule();
    if (!canonicalSectorName.value) {
      saveError.value = "Setor inválido.";
      return;
    }
    await branchesApi.submitSetup(branchId.value, {
      schedule_rules: scheduleRules,
      sector_name: canonicalSectorName.value,
      employee: {
        name: state.empName.trim(),
        email: previewEmployeeEmail.value,
        job_title: state.empJobTitle.trim(),
        password: state.empPassword,
        password_confirmation: state.empPasswordConfirm,
      },
    });
    notifySuccess("Configuração da filial concluída com sucesso!");
    emit("completed");
  } catch (err: unknown) {
    saveError.value =
      (err as { response?: { data?: { msg?: string } } })?.response?.data?.msg ??
      "Erro ao salvar. Verifique os dados e tente novamente.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <b-modal
    :model-value="true"
    size="lg"
    :no-close-on-backdrop="true"
    :no-close-on-esc="true"
    :hide-header-close="true"
    centered
    scrollable
    body-class="p-0"
    header-class="branch-setup-wizard-header border-0"
    footer-class="setup-modal-footer"
  >
    <!-- ── Header ── -->
    <template #header>
      <div class="setup-modal-header w-100">
        <!-- Linha superior: ícone + título + badge -->
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="setup-icon-box">
            <img src="/iconelogo.svg" alt="Logo Emplyon" class="setup-logo" />
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
              <span class="text-white fw-semibold fs-15">
                Configuração da Filial
              </span>
              <span class="badge rounded-pill bg-white text-primary fw-semibold">
                {{ progressPct }}%
              </span>
            </div>
            <p class="text-white text-opacity-75 mb-0" style="font-size: 0.78rem">
              Etapa {{ currentStep }} de {{ TOTAL_STEPS }} — {{ steps[currentStep - 1].title }}
            </p>
          </div>
        </div>

        <!-- Tabs de progresso (não clicáveis) -->
        <div class="setup-steps-track">
          <div
            v-for="n in TOTAL_STEPS"
            :key="n"
            class="setup-step-segment"
            :class="{
              'done':    n < currentStep,
              'current': n === currentStep,
            }"
          ></div>
        </div>
      </div>
    </template>

    <!-- ── Corpo ── -->
    <div class="p-4 branch-setup-body position-relative">
      <p class="text-muted mb-4" style="font-size: 0.82rem">
        {{ steps[currentStep - 1].subtitle }}
      </p>

      <!-- Etapa 1 – Expediente Seg–Sáb -->
      <div v-if="currentStep === 1">
        <div class="mb-4">
          <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Dias da semana</label>
          <div class="d-flex flex-wrap gap-2 mt-1">
            <button
              v-for="d in WEEKDAYS_OPT"
              :key="d.value"
              type="button"
              class="day-chip"
              :class="{ active: state.weekdays.includes(d.value) }"
              @click="toggleWeekday(d.value)"
            >{{ d.label }}</button>
          </div>
        </div>
        <b-row class="g-3">
          <b-col sm="6">
            <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Início do Expediente</label>
            <input v-model="state.weekExpStart" type="time" class="form-control form-control-lg time-field" />
          </b-col>
          <b-col sm="6">
            <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Fim do Expediente</label>
            <input v-model="state.weekExpEnd" type="time" class="form-control form-control-lg time-field" />
          </b-col>
        </b-row>
      </div>

      <!-- Etapa 2 – Loja Seg–Sáb -->
      <div v-else-if="currentStep === 2">
        <div class="mb-3 d-flex align-items-center gap-2">
          <i class="iconoir-calendar text-muted"></i>
          <span class="text-muted" style="font-size: 0.82rem">
            Dias: <strong class="text-body">{{ state.weekdays.map(d => WEEKDAYS_OPT.find(x => x.value === d)?.label).join(", ") }}</strong>
          </span>
        </div>
        <b-row class="g-3">
          <b-col sm="6">
            <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Abertura da Loja</label>
            <input v-model="state.weekStoreOpen" type="time" class="form-control form-control-lg time-field" />
          </b-col>
          <b-col sm="6">
            <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Fechamento da Loja</label>
            <input v-model="state.weekStoreClose" type="time" class="form-control form-control-lg time-field" />
          </b-col>
        </b-row>
      </div>

      <!-- Etapa 3 – Domingo -->
      <div v-else-if="currentStep === 3">
        <div class="form-check form-switch mb-4">
          <input
            id="sundayClosed"
            v-model="state.sundayClosed"
            class="form-check-input"
            type="checkbox"
            role="switch"
          />
          <label class="form-check-label fw-semibold" for="sundayClosed" style="color: var(--bs-label-color)">
            Domingo fechado
          </label>
        </div>

        <template v-if="!state.sundayClosed">
          <p class="fw-semibold mb-3 fs-13" style="color: var(--bs-heading-color)">Expediente Funcionários (Domingo)</p>
          <b-row class="g-3 mb-4">
            <b-col sm="6">
              <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Início</label>
              <input v-model="state.sunExpStart" type="time" class="form-control form-control-lg time-field" />
            </b-col>
            <b-col sm="6">
              <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Fim</label>
              <input v-model="state.sunExpEnd" type="time" class="form-control form-control-lg time-field" />
            </b-col>
          </b-row>
          <p class="fw-semibold mb-3 fs-13" style="color: var(--bs-heading-color)">Funcionamento Loja (Domingo)</p>
          <b-row class="g-3">
            <b-col sm="6">
              <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Abertura</label>
              <input v-model="state.sunStoreOpen" type="time" class="form-control form-control-lg time-field" />
            </b-col>
            <b-col sm="6">
              <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Fechamento</label>
              <input v-model="state.sunStoreClose" type="time" class="form-control form-control-lg time-field" />
            </b-col>
          </b-row>
        </template>

        <div v-else class="text-center py-5 text-muted">
          <i class="iconoir-calendar-minus d-block mb-2" style="font-size: 2.5rem"></i>
          <p class="mb-0 fs-14">Domingo marcado como fechado.</p>
        </div>
      </div>

      <!-- Etapa 4 – Carga Horária -->
      <div v-else-if="currentStep === 4" class="d-flex justify-content-center py-2">
        <div style="max-width: 280px; width: 100%">
          <label class="form-label fw-semibold d-block text-center mb-2" style="color: var(--bs-label-color)">Carga Horária Diária</label>
          <input
            v-model="state.dailyWorkHhMm"
            type="time"
            step="60"
            class="form-control form-control-lg time-field text-center"
          />
          <p class="text-muted text-center mt-2 fs-13">Ex: 08:48 para escalas padrão</p>
        </div>
      </div>

      <!-- Etapa 5 – Refeição -->
      <div v-else-if="currentStep === 5" class="d-flex justify-content-center py-2">
        <div style="max-width: 280px; width: 100%">
          <label class="form-label fw-semibold d-block text-center mb-2" style="color: var(--bs-label-color)">Tempo de Refeição</label>
          <input
            v-model="state.breakHhMm"
            type="time"
            step="60"
            class="form-control form-control-lg time-field text-center"
          />
          <p class="text-muted text-center mt-2 fs-13">Ex: 01:00 ou 01:10</p>
        </div>
      </div>

      <!-- Etapa 6 – Setores -->
      <div v-else-if="currentStep === 6">
        <div class="mb-2">
          <input
            v-model="state.sectorInput"
            type="text"
            class="form-control"
            placeholder="Nome do setor"
            maxlength="100"
            @keydown.enter.prevent="addSector"
            @blur="addSector"
          />
        </div>
        <p class="text-muted fs-13 mb-0">Será criado apenas 1 setor nesta etapa.</p>
      </div>

      <!-- Etapa 7 – Funcionário -->
      <div v-else-if="currentStep === 7">
        <b-row class="g-3">
          <b-col cols="12">
            <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Nome completo <span class="text-danger">*</span></label>
            <input v-model="state.empName" type="text" class="form-control" placeholder="Nome Completo" />
          </b-col>
          <b-col cols="12">
            <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-1">
              <label class="form-label fw-semibold mb-0" style="color: var(--bs-label-color)">
                E-mail (usuário)<span class="text-danger">*</span>
              </label>
              <button
                type="button"
                class="btn btn-link btn-sm text-primary text-decoration-underline p-0 align-baseline shadow-none"
                @click="showEmployeeEmailHelp = true"
              >
                Como funciona?
              </button>
            </div>
            <template v-if="useSplitTenantEmail">
              <b-input-group>
                <b-form-input
                  id="setup-emp-email-local"
                  :model-value="previewEmployeeEmailLocal"
                  type="text"
                  readonly
                  class="bg-body-secondary user-select-all"
                />
                <b-input-group-text class="text-body-secondary user-select-all">
                  @{{ tenantEmailDomain }}
                </b-input-group-text>
              </b-input-group>
              <p class="form-text mb-0 fs-13">Gerado automaticamente — setor + nº da filial.</p>
            </template>
            <template v-else>
              <input :value="previewEmployeeEmail" type="text" class="form-control bg-body-secondary" readonly />
              <p v-if="companyId > 0" class="form-text mb-0 fs-13 text-muted">Domínio da empresa indisponível.</p>
            </template>
          </b-col>
          <b-col sm="6">
            <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Cargo <span class="text-danger">*</span></label>
            <input v-model="state.empJobTitle" type="text" class="form-control" placeholder="Nome do Cargo" />
          </b-col>
          <b-col sm="6">
            <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Setor</label>
            <input :value="canonicalSectorName" type="text" class="form-control bg-body-secondary" readonly />
          </b-col>
          <b-col cols="12" sm="6">
            <label class="form-label fw-semibold" style="color: var(--bs-label-color)">
              Senha de acesso <span class="text-danger">*</span>
            </label>
            <b-input-group>
              <b-form-input
                id="branch-setup-emp-password"
                v-model="state.empPassword"
                :type="showEmployeePassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
              <b-button
                type="button"
                variant="outline-secondary"
                :title="showEmployeePassword ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-label="showEmployeePassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showEmployeePassword = !showEmployeePassword"
              >
                <i :class="showEmployeePassword ? 'iconoir-eye-closed' : 'iconoir-eye'"></i>
              </b-button>
              <b-button type="button" variant="outline-primary" title="Gerar senha forte" @click="applyGeneratedEmployeePassword">
                Gerar senha
              </b-button>
            </b-input-group>
          </b-col>
          <b-col cols="12" sm="6">
            <label class="form-label fw-semibold" style="color: var(--bs-label-color)">
              Confirmar senha <span class="text-danger">*</span>
            </label>
            <b-input-group>
              <b-form-input
                id="branch-setup-emp-password-confirm"
                v-model="state.empPasswordConfirm"
                :type="showEmployeePasswordConfirm ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Repita a senha"
              />
              <b-button
                type="button"
                variant="outline-secondary"
                :title="showEmployeePasswordConfirm ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-label="showEmployeePasswordConfirm ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showEmployeePasswordConfirm = !showEmployeePasswordConfirm"
              >
                <i :class="showEmployeePasswordConfirm ? 'iconoir-eye-closed' : 'iconoir-eye'"></i>
              </b-button>
            </b-input-group>
          </b-col>
        </b-row>
      </div>

      <!-- Aviso de validação -->
      <div v-if="stepError" class="alert alert-warning d-flex align-items-start gap-2 mt-4 mb-0 py-2 px-3">
        <i class="iconoir-warning-triangle mt-1 flex-shrink-0"></i>
        <span class="fs-13">{{ stepError }}</span>
      </div>

      <!-- Erro de salvamento -->
      <div v-if="saveError" class="alert alert-danger d-flex align-items-start gap-2 mt-3 mb-0 py-2 px-3">
        <i class="iconoir-xmark-circle mt-1 flex-shrink-0"></i>
        <span class="fs-13">{{ saveError }}</span>
      </div>

      <div
        v-if="showEmployeeEmailHelp && currentStep === 7"
        class="branch-setup-inner-modal-backdrop"
        role="presentation"
        @click.self="showEmployeeEmailHelp = false"
      >
        <div
          class="modal-content branch-setup-inner-dialog shadow"
          role="dialog"
          aria-modal="true"
          aria-labelledby="branch-email-help-title"
          tabindex="-1"
          @click.stop
        >
          <div class="modal-header py-3 border-bottom">
            <h2 id="branch-email-help-title" class="modal-title fs-6 mb-0">Como funciona o e-mail?</h2>
            <button
              type="button"
              class="btn-close"
              aria-label="Fechar"
              @click="showEmployeeEmailHelp = false"
            ></button>
          </div>
          <div class="modal-body py-3">
            <p class="mb-0 fs-13 text-body-secondary">{{ employeeEmailHowItWorksText }}</p>
          </div>
          <div class="modal-footer py-2 border-top">
            <b-button variant="primary" size="sm" @click="showEmployeeEmailHelp = false">Entendi</b-button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Footer ── -->
    <template #footer>
      <div class="d-flex align-items-center justify-content-between w-100">
        <!-- Voltar -->
        <b-button
          variant="link"
          class="text-muted text-decoration-none ps-0 fw-semibold"
          :disabled="currentStep === 1 || saving"
          @click="prev"
        >
          <i class="iconoir-nav-arrow-left me-1"></i>Voltar
        </b-button>

        <!-- Indicadores de passo -->
        <div class="d-flex align-items-center gap-1">
          <span
            v-for="n in TOTAL_STEPS"
            :key="n"
            class="step-dot"
            :class="{ active: n === currentStep, done: n < currentStep }"
          ></span>
        </div>

        <!-- Próximo / Concluir -->
        <b-button
          variant="primary"
          :disabled="!!stepError || saving"
          @click="next"
        >
          <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status"></span>
          <span v-if="currentStep < TOTAL_STEPS">Próximo <i class="iconoir-nav-arrow-right ms-1"></i></span>
          <span v-else><i class="iconoir-check me-1"></i>Concluir</span>
        </b-button>
      </div>
    </template>
  </b-modal>
</template>

<style scoped>
/* ── Header personalizado do modal ── */
:deep(.modal-header.branch-setup-wizard-header) {
  display: block;
  padding: 1.25rem 1.5rem 1rem;
  background-color: var(--bs-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.setup-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.setup-logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

/* Barra de segmentos de progresso */
.setup-steps-track {
  display: flex;
  gap: 4px;
}

.setup-step-segment {
  flex: 1;
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.3s;
}

.setup-step-segment.done {
  background: var(--bs-primary);
}

.setup-step-segment.current {
  background: #fff;
}

/* ── Chips de dias ── */
.day-chip {
  width: 48px;
  height: 36px;
  border-radius: 6px;
  border: 1.5px solid var(--bs-border-color);
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--bs-secondary-color);
  background: transparent;
  cursor: pointer;
  transition: all 0.12s;
  user-select: none;
}

.day-chip.active {
  background: var(--bs-primary);
  border-color: var(--bs-primary);
  color: #fff;
}

.day-chip:hover:not(.active):not(:disabled) {
  border-color: var(--bs-primary);
  color: var(--bs-primary);
}

/* ── Campo de hora ── */
.time-field {
  font-size: 1.15rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.05em;
  color: var(--bs-heading-color) !important;
}

/* ── Footer ── */
:deep(.setup-modal-footer) {
  padding: 0.875rem 1.5rem;
  border-top: 1px solid var(--bs-border-color);
  background: var(--bs-secondary-bg);
}

/* Indicadores de passo */
.step-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--bs-border-color);
  transition: all 0.2s;
}

.step-dot.done {
  background: var(--bs-primary);
  opacity: 0.55;
}

.step-dot.active {
  width: 18px;
  border-radius: 3px;
  background: var(--bs-primary);
}

.branch-setup-inner-modal-backdrop {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 0 0 var(--bs-modal-inner-border-radius, 0.5rem) var(--bs-modal-inner-border-radius, 0.5rem);
}

.branch-setup-inner-dialog {
  max-width: 420px;
  width: 100%;
  border-radius: var(--bs-border-radius-lg, 0.5rem);
}
</style>
