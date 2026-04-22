<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Selectr from "@/lib/selectr";
import UIComponentCard from "@/components/UIComponentCard.vue";
import InputMask from "@/components/InputMask.vue";
import BranchScheduleRulesFields from "./BranchScheduleRulesFields.vue";
import type { BranchFormData, BranchScheduleRuleFormRow } from "@/core/schemas";
import { notifyError } from "@/helpers/notify";

const props = withDefaults(
  defineProps<{
    modelValue: BranchFormData;
    errors?: Record<string, string>;
    mode?: "create" | "edit" | "view";
    companyOptions?: Array<{ id: number; name: string }>;
    lockCompanyId?: number | null;
    /** Expediente / horário da loja: só no fluxo do gerente de filial (configuração inicial). */
    showOperatingHours?: boolean;
    /** Editar com abas «Dados cadastrais» + «Horários» (com showOperatingHours). */
    editTabbed?: boolean;
  }>(),
  {
    errors: () => ({}),
    mode: "create",
    companyOptions: () => [],
    lockCompanyId: null,
    showOperatingHours: false,
    editTabbed: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: BranchFormData): void;
  (e: "clear-error", field: string): void;
}>();

const searchingZipCode = ref(false);
const isView = computed(() => props.mode === "view");
const useEditTabs = computed(() => !isView.value && props.editTabbed && props.showOperatingHours);
const isCompanyLocked = computed(() => Number(props.lockCompanyId ?? 0) > 0);
const companySelectRef = ref<HTMLSelectElement | null>(null);
let companySelectr: any = null;
const selectedCompanyName = computed(() => {
  const id = Number(props.modelValue.company_id ?? 0);
  if (!id) return "";
  return props.companyOptions.find((company) => company.id === id)?.name ?? "";
});

const localForm = computed({
  get: () => props.modelValue,
  set: (value: BranchFormData) => emit("update:modelValue", value),
});

function updateField<K extends keyof BranchFormData>(field: K, value: BranchFormData[K]) {
  localForm.value = {
    ...localForm.value,
    [field]: value,
  };
  emit("clear-error", field);
}

function onCompanyChange(event: Event) {
  const value = (event.target as HTMLSelectElement | null)?.value ?? "";
  updateField("company_id", value === "" ? 0 : Number(value));
}

function destroySelectrs() {
  companySelectr?.destroy?.();
  companySelectr = null;
}

function initSelectrs() {
  destroySelectrs();
  if (isView.value) return;
  if (!companySelectRef.value) return;

  companySelectr = new Selectr(companySelectRef.value, {
    searchable: true,
    multiple: false,
    placeholder: "Selecione uma empresa",
  });
  companySelectr.on("selectr.change", () => {
    const raw = companySelectr.getValue();
    updateField("company_id", raw === "" ? 0 : Number(raw));
  });
}

function cleanZipCode(value: string): string {
  return value.replace(/\D/g, "");
}

function formatTime(v: string): string {
  const m = String(v ?? "").match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "—";
}

const WEEKDAYS = [
  { value: 1, label: "Seg", long: "Segunda" },
  { value: 2, label: "Ter", long: "Terça" },
  { value: 3, label: "Qua", long: "Quarta" },
  { value: 4, label: "Qui", long: "Quinta" },
  { value: 5, label: "Sex", long: "Sexta" },
  { value: 6, label: "Sáb", long: "Sábado" },
  { value: 7, label: "Dom", long: "Domingo" },
] as const;

function scheduleRulesList(): BranchScheduleRuleFormRow[] {
  return props.modelValue.schedule_rules ?? [];
}

function dayLongLabel(d: number): string {
  return WEEKDAYS.find((x) => x.value === d)?.long ?? String(d);
}

function onScheduleRulesUpdate(rules: BranchScheduleRuleFormRow[]) {
  emit("update:modelValue", { ...localForm.value, schedule_rules: rules });
}

async function fillAddressByZipCode() {
  if (isView.value) return;

  const zip = cleanZipCode(String(localForm.value.zip_code ?? "").trim());
  if (zip.length !== 8) {
    notifyError("Informe um CEP válido com 8 dígitos.");
    return;
  }

  searchingZipCode.value = true;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
    if (!res.ok) {
      notifyError("Não foi possível consultar o CEP. Tente novamente.");
      return;
    }
    const data = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };

    if (data.erro) {
      notifyError("CEP não encontrado.");
      return;
    }

    const next = { ...localForm.value };
    next.street = data.logradouro ?? next.street;
    next.neighborhood = data.bairro ?? next.neighborhood;
    next.city = data.localidade ?? next.city;
    next.state = data.uf ?? next.state;
    emit("update:modelValue", next);
    emit("clear-error", "street");
    emit("clear-error", "street_number");
    emit("clear-error", "neighborhood");
    emit("clear-error", "city");
    emit("clear-error", "state");
  } catch {
    notifyError("Erro ao buscar CEP. Verifique a ligação ou tente mais tarde.");
  } finally {
    searchingZipCode.value = false;
  }
}

if (isCompanyLocked.value && props.lockCompanyId) {
  if (props.modelValue.company_id !== props.lockCompanyId) {
    emit("update:modelValue", {
      ...props.modelValue,
      company_id: props.lockCompanyId,
    });
  }
}

const selectSignature = computed(() =>
  JSON.stringify({
    mode: props.mode,
    lockCompanyId: props.lockCompanyId,
    company_id: props.modelValue.company_id,
    companies: props.companyOptions.map((item) => item.id),
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
  <b-card v-if="isView" no-body class="h-100">
    <b-card-header class="pb-2">
      <b-card-title class="mb-1">Informação da filial</b-card-title>
      <p class="text-muted mb-0 small">Dados principais, vínculo com empresa e localização.</p>
    </b-card-header>
    <b-card-body>
      <b-row class="g-3">
        <b-col cols="12" md="6">
          <div class="border rounded p-3 h-100">
            <h6 class="mb-3">Identificação</h6>
            <div class="d-flex align-items-start mb-2">
              <i class="iconoir-git-branch me-2 text-secondary fs-18"></i>
              <div>
                <p class="text-muted mb-0 small">Nome</p>
                <p class="mb-0 fw-medium">{{ localForm.name || "—" }}</p>
              </div>
            </div>
            <div class="d-flex align-items-start">
              <i class="iconoir-copy me-2 text-secondary fs-18"></i>
              <div>
                <p class="text-muted mb-0 small">CNPJ</p>
                <p class="mb-0 fw-medium">{{ localForm.cnpj || "—" }}</p>
              </div>
            </div>
          </div>
        </b-col>

        <b-col cols="12" md="6">
          <div class="border rounded p-3 h-100">
            <h6 class="mb-3">Vinculação</h6>
            <div class="d-flex align-items-start">
              <i class="iconoir-building me-2 text-secondary fs-18"></i>
              <div>
                <p class="text-muted mb-0 small">Empresa vinculada</p>
                <p class="mb-0 fw-medium">{{ selectedCompanyName || "—" }}</p>
              </div>
            </div>
          </div>
        </b-col>

        <b-col cols="12">
          <div class="border rounded p-3">
            <h6 class="mb-3">Endereço</h6>
            <b-row class="g-3">
              <b-col cols="12" md="4">
                <p class="text-muted mb-0 small">CEP</p>
                <p class="mb-0 fw-medium">{{ localForm.zip_code || "—" }}</p>
              </b-col>
              <b-col cols="12" md="5">
                <p class="text-muted mb-0 small">Logradouro</p>
                <p class="mb-0 fw-medium">{{ localForm.street || "—" }}</p>
              </b-col>
              <b-col cols="12" md="3">
                <p class="text-muted mb-0 small">Número</p>
                <p class="mb-0 fw-medium">{{ localForm.street_number || "—" }}</p>
              </b-col>
              <b-col cols="12" md="4">
                <p class="text-muted mb-0 small">Bairro</p>
                <p class="mb-0 fw-medium">{{ localForm.neighborhood || "—" }}</p>
              </b-col>
              <b-col cols="12" md="4">
                <p class="text-muted mb-0 small">Município</p>
                <p class="mb-0 fw-medium">{{ localForm.city || "—" }}</p>
              </b-col>
              <b-col cols="12" md="4">
                <p class="text-muted mb-0 small">Estado</p>
                <p class="mb-0 fw-medium">{{ localForm.state || "—" }}</p>
              </b-col>
              <b-col v-if="showOperatingHours" cols="12">
                <div class="border rounded p-3 mt-1">
                  <h6 class="mb-2">Horários por período</h6>
                  <p class="text-muted small mb-3">1 = segunda … 7 = domingo. Cada dia numa única regra.</p>
                  <div
                    v-for="(rule, ri) in scheduleRulesList()"
                    :key="ri"
                    class="mb-3 pb-3 border-bottom"
                    :class="{ 'border-0 mb-0 pb-0': ri === scheduleRulesList().length - 1 }"
                  >
                    <p class="fw-medium mb-1">Período {{ ri + 1 }}</p>
                    <p class="text-muted small mb-2">
                      Dias:
                      {{ rule.weekdays.length ? rule.weekdays.map(dayLongLabel).join(", ") : "—" }}
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
              </b-col>
            </b-row>
          </div>
        </b-col>
      </b-row>
    </b-card-body>
  </b-card>
  <UIComponentCard v-else :title="useEditTabs ? 'Editar filial' : 'Dados da filial'">
    <b-alert v-if="errors.branch" :model-value="true" variant="danger" class="mb-3">{{ errors.branch }}</b-alert>
    <b-tabs v-if="useEditTabs" content-class="pt-2">
      <b-tab title="Dados cadastrais">
    <b-row>
      <b-col v-if="!isCompanyLocked" md="12">
        <b-form-group label-for="branch-company-id" class="mb-3">
          <template #label>Empresa vinculada <span class="text-danger">*</span></template>
          <select
            id="branch-company-id"
            ref="companySelectRef"
            class="form-select"
            :disabled="isView"
            :class="{ 'is-invalid': !!errors.company_id }"
            @change="onCompanyChange"
          >
            <option value="" :selected="!localForm.company_id">Selecione uma empresa</option>
            <option
              v-for="company in companyOptions"
              :key="company.id"
              :value="company.id"
              :selected="Number(localForm.company_id || 0) === company.id"
            >
              {{ company.name }}
            </option>
          </select>
          <b-form-invalid-feedback v-if="errors.company_id">{{ errors.company_id }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-row>

    <b-row>
      <b-col md="6">
        <b-form-group label-for="branch-name" class="mb-3">
          <template #label>Nome <span class="text-danger">*</span></template>
          <b-form-input
            id="branch-name"
            :model-value="localForm.name"
            type="text"
            :disabled="isView"
            :state="errors.name ? false : null"
            @update:model-value="updateField('name', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors.name">{{ errors.name }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label-for="branch-cnpj" class="mb-3">
          <template #label>CNPJ <span class="text-danger">*</span></template>
          <InputMask
            id="branch-cnpj"
            mask="99.999.999/9999-99"
            :model-value="localForm.cnpj"
            :disabled="isView"
            :state="errors.cnpj ? false : null"
            @update:model-value="updateField('cnpj', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors.cnpj">{{ errors.cnpj }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-row>

    <b-row>
      <b-col md="3">
        <b-form-group label-for="branch-zip" class="mb-3">
          <template #label>CEP <span class="text-danger">*</span></template>
          <b-input-group>
            <b-form-input
              id="branch-zip"
              :model-value="localForm.zip_code"
              type="text"
              :disabled="isView"
              :state="errors.zip_code ? false : null"
              @update:model-value="updateField('zip_code', String($event ?? ''))"
              @blur="fillAddressByZipCode"
            />
            <b-button
              type="button"
              variant="outline-primary"
              :disabled="searchingZipCode || isView"
              @click="fillAddressByZipCode"
            >
              {{ searchingZipCode ? "Buscando..." : "Buscar CEP" }}
            </b-button>
          </b-input-group>
          <b-form-invalid-feedback v-if="errors.zip_code">{{ errors.zip_code }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="9">
        <b-form-group label-for="branch-street" class="mb-3">
          <template #label>Logradouro <span class="text-danger">*</span></template>
          <b-form-input
            id="branch-street"
            :model-value="localForm.street"
            type="text"
            :disabled="isView"
            :state="errors.street ? false : null"
            @update:model-value="updateField('street', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors.street">{{ errors.street }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-row>

    <b-row>
      <b-col md="2">
        <b-form-group label-for="branch-street-number" class="mb-3">
          <template #label>Número <span class="text-danger">*</span></template>
          <b-form-input
            id="branch-street-number"
            :model-value="localForm.street_number"
            type="text"
            maxlength="20"
            :disabled="isView"
            :state="errors.street_number ? false : null"
            @update:model-value="updateField('street_number', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors.street_number">{{ errors.street_number }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="4">
        <b-form-group label-for="branch-neighborhood" class="mb-3">
          <template #label>Bairro <span class="text-danger">*</span></template>
          <b-form-input
            id="branch-neighborhood"
            :model-value="localForm.neighborhood"
            type="text"
            :disabled="isView"
            :state="errors.neighborhood ? false : null"
            @update:model-value="updateField('neighborhood', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors.neighborhood">{{ errors.neighborhood }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="4">
        <b-form-group label-for="branch-city" class="mb-3">
          <template #label>Município <span class="text-danger">*</span></template>
          <b-form-input
            id="branch-city"
            :model-value="localForm.city"
            type="text"
            :disabled="isView"
            :state="errors.city ? false : null"
            @update:model-value="updateField('city', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors.city">{{ errors.city }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
      <b-col md="2">
        <b-form-group label-for="branch-state" class="mb-3">
          <template #label>Estado (UF) <span class="text-danger">*</span></template>
          <b-form-input
            id="branch-state"
            :model-value="localForm.state"
            type="text"
            maxlength="2"
            :disabled="isView"
            :state="errors.state ? false : null"
            @update:model-value="updateField('state', String($event ?? ''))"
          />
          <b-form-invalid-feedback v-if="errors.state">{{ errors.state }}</b-form-invalid-feedback>
        </b-form-group>
      </b-col>
    </b-row>

      </b-tab>
      <b-tab title="Horários">
        <BranchScheduleRulesFields
          :rules="scheduleRulesList()"
          :errors="errors"
          :disabled="isView"
          @update:rules="onScheduleRulesUpdate"
          @clear-error="emit('clear-error', $event)"
        />
      </b-tab>
    </b-tabs>
    <template v-else>
      <b-row>
        <b-col v-if="!isCompanyLocked" md="12">
          <b-form-group label-for="branch-company-id-else" class="mb-3">
            <template #label>Empresa vinculada <span class="text-danger">*</span></template>
            <select
              id="branch-company-id-else"
              ref="companySelectRef"
              class="form-select"
              :disabled="isView"
              :class="{ 'is-invalid': !!errors.company_id }"
              @change="onCompanyChange"
            >
              <option value="" :selected="!localForm.company_id">Selecione uma empresa</option>
              <option
                v-for="company in companyOptions"
                :key="company.id"
                :value="company.id"
                :selected="Number(localForm.company_id || 0) === company.id"
              >
                {{ company.name }}
              </option>
            </select>
            <b-form-invalid-feedback v-if="errors.company_id">{{ errors.company_id }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
      </b-row>

      <b-row>
        <b-col md="6">
          <b-form-group label-for="branch-name-else" class="mb-3">
            <template #label>Nome <span class="text-danger">*</span></template>
            <b-form-input
              id="branch-name-else"
              :model-value="localForm.name"
              type="text"
              :disabled="isView"
              :state="errors.name ? false : null"
              @update:model-value="updateField('name', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.name">{{ errors.name }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group label-for="branch-cnpj-else" class="mb-3">
            <template #label>CNPJ <span class="text-danger">*</span></template>
            <InputMask
              id="branch-cnpj-else"
              mask="99.999.999/9999-99"
              :model-value="localForm.cnpj"
              :disabled="isView"
              :state="errors.cnpj ? false : null"
              @update:model-value="updateField('cnpj', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.cnpj">{{ errors.cnpj }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
      </b-row>

      <b-row>
        <b-col md="3">
          <b-form-group label-for="branch-zip-else" class="mb-3">
            <template #label>CEP <span class="text-danger">*</span></template>
            <b-input-group>
              <b-form-input
                id="branch-zip-else"
                :model-value="localForm.zip_code"
                type="text"
                :disabled="isView"
                :state="errors.zip_code ? false : null"
                @update:model-value="updateField('zip_code', String($event ?? ''))"
                @blur="fillAddressByZipCode"
              />
              <b-button
                type="button"
                variant="outline-primary"
                :disabled="searchingZipCode || isView"
                @click="fillAddressByZipCode"
              >
                {{ searchingZipCode ? "Buscando..." : "Buscar CEP" }}
              </b-button>
            </b-input-group>
            <b-form-invalid-feedback v-if="errors.zip_code">{{ errors.zip_code }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="9">
          <b-form-group label-for="branch-street-else" class="mb-3">
            <template #label>Logradouro <span class="text-danger">*</span></template>
            <b-form-input
              id="branch-street-else"
              :model-value="localForm.street"
              type="text"
              :disabled="isView"
              :state="errors.street ? false : null"
              @update:model-value="updateField('street', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.street">{{ errors.street }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
      </b-row>

      <b-row>
        <b-col md="2">
          <b-form-group label-for="branch-street-number-else" class="mb-3">
            <template #label>Número <span class="text-danger">*</span></template>
            <b-form-input
              id="branch-street-number-else"
              :model-value="localForm.street_number"
              type="text"
              maxlength="20"
              :disabled="isView"
              :state="errors.street_number ? false : null"
              @update:model-value="updateField('street_number', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.street_number">{{ errors.street_number }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="4">
          <b-form-group label-for="branch-neighborhood-else" class="mb-3">
            <template #label>Bairro <span class="text-danger">*</span></template>
            <b-form-input
              id="branch-neighborhood-else"
              :model-value="localForm.neighborhood"
              type="text"
              :disabled="isView"
              :state="errors.neighborhood ? false : null"
              @update:model-value="updateField('neighborhood', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.neighborhood">{{ errors.neighborhood }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="4">
          <b-form-group label-for="branch-city-else" class="mb-3">
            <template #label>Município <span class="text-danger">*</span></template>
            <b-form-input
              id="branch-city-else"
              :model-value="localForm.city"
              type="text"
              :disabled="isView"
              :state="errors.city ? false : null"
              @update:model-value="updateField('city', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.city">{{ errors.city }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="2">
          <b-form-group label-for="branch-state-else" class="mb-3">
            <template #label>Estado (UF) <span class="text-danger">*</span></template>
            <b-form-input
              id="branch-state-else"
              :model-value="localForm.state"
              type="text"
              maxlength="2"
              :disabled="isView"
              :state="errors.state ? false : null"
              @update:model-value="updateField('state', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.state">{{ errors.state }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
      </b-row>

      <BranchScheduleRulesFields
        v-if="showOperatingHours"
        :rules="scheduleRulesList()"
        :errors="errors"
        :disabled="isView"
        @update:rules="onScheduleRulesUpdate"
        @clear-error="emit('clear-error', $event)"
      />
    </template>

    <div class="d-flex gap-2" :class="{ 'mt-3 pt-3 border-top': useEditTabs }">
      <slot name="actions" />
    </div>
  </UIComponentCard>
</template>
