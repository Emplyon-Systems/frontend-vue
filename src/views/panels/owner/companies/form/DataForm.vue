<script setup lang="ts">
import { computed, ref, watch } from "vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import InputMask from "@/components/InputMask.vue";
import type { CompanyFormData } from "@/core/schemas";
import { notifyError } from "@/helpers/notify";

const props = withDefaults(defineProps<{
  modelValue: CompanyFormData;
  errors?: Record<string, string>;
  mode?: "create" | "edit" | "view";
}>(), {
  errors: () => ({}),
  mode: "create",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: CompanyFormData): void;
  (e: "clear-error", field: string): void;
}>();

const searchingZipCode = ref(false);
const useCompanyEmail = ref(true);
const showUserPassword = ref(false);

const isView = computed(() => props.mode === "view");
const showUserSection = computed(() => props.mode === "create");
const showLimitsSection = computed(() => !isView.value);

const localForm = computed({
  get: () => props.modelValue,
  set: (value: CompanyFormData) => emit("update:modelValue", value),
});

function updateField<K extends keyof CompanyFormData>(field: K, value: CompanyFormData[K]) {
  localForm.value = {
    ...localForm.value,
    [field]: value,
  };
  emit("clear-error", field);
}

function onLimitNumber(field: "branch_limit" | "user_limit", raw: unknown) {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  updateField(field, (Number.isFinite(n) ? n : 0) as CompanyFormData[typeof field]);
}

watch(
  () => localForm.value.email,
  (value) => {
    if (showUserSection.value && useCompanyEmail.value) {
      updateField("user_email", value);
    }
  }
);

watch(useCompanyEmail, (checked) => {
  if (checked && showUserSection.value) {
    updateField("user_email", localForm.value.email);
  }
});

function cleanZipCode(value: string): string {
  return value.replace(/\D/g, "");
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

    // Atualizar todos os campos de endereço numa única emissão para evitar perda de dados
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

function generateRandomPassword(length = 12): void {
  if (isView.value) return;

  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*";
  const all = `${upper}${lower}${numbers}${symbols}`;
  const randomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  const passwordChars = [
    randomChar(upper),
    randomChar(lower),
    randomChar(numbers),
    randomChar(symbols),
  ];

  for (let i = passwordChars.length; i < length; i += 1) passwordChars.push(randomChar(all));
  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  updateField("user_password", passwordChars.join(""));
}
</script>

<template>
  <div>
    <UIComponentCard title="Dados da empresa">
      <b-row>
        <b-col md="6">
          <b-form-group label-for="name" class="mb-3">
            <template #label>Nome <span class="text-danger">*</span></template>
            <b-form-input
              id="name"
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
          <b-form-group label-for="company-cnpj" class="mb-3">
            <template #label>CNPJ <span class="text-danger">*</span></template>
            <InputMask
              id="company-cnpj"
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
        <b-col md="4">
          <b-form-group label-for="zip_code" class="mb-3">
            <template #label>CEP <span class="text-danger">*</span></template>
            <b-input-group>
              <b-form-input
                id="zip_code"
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
        <b-col md="6">
          <b-form-group label-for="street" class="mb-3">
            <template #label>Logradouro <span class="text-danger">*</span></template>
            <b-form-input
              id="street"
              :model-value="localForm.street"
              type="text"
              :disabled="isView"
              :state="errors.street ? false : null"
              @update:model-value="updateField('street', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.street">{{ errors.street }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="2">
          <b-form-group label-for="street_number" class="mb-3">
            <template #label>Número <span class="text-danger">*</span></template>
            <b-form-input
              id="street_number"
              :model-value="localForm.street_number"
              type="text"
              :disabled="isView"
              placeholder="Nº"
              maxlength="20"
              :state="errors.street_number ? false : null"
              @update:model-value="updateField('street_number', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.street_number">{{ errors.street_number }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
      </b-row>

      <b-row>
        <b-col md="4">
          <b-form-group label-for="neighborhood" class="mb-3">
            <template #label>Bairro <span class="text-danger">*</span></template>
            <b-form-input
              id="neighborhood"
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
          <b-form-group label-for="city" class="mb-3">
            <template #label>Município <span class="text-danger">*</span></template>
            <b-form-input
              id="city"
              :model-value="localForm.city"
              type="text"
              :disabled="isView"
              :state="errors.city ? false : null"
              @update:model-value="updateField('city', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.city">{{ errors.city }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="4">
          <b-form-group label-for="state" class="mb-3">
            <template #label>Estado (UF) <span class="text-danger">*</span></template>
            <b-form-input
              id="state"
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

      <b-row>
        <b-col md="6">
          <b-form-group label-for="email" class="mb-3">
            <template #label>E-mail <span class="text-danger">*</span></template>
            <b-form-input
              id="email"
              :model-value="localForm.email"
              type="email"
              :disabled="isView"
              :state="errors.email ? false : null"
              @update:model-value="updateField('email', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.email">{{ errors.email }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group label-for="company-phone" class="mb-3">
            <template #label>Telefone <span class="text-danger">*</span></template>
            <InputMask
              id="company-phone"
              mask="(99) 9999[9]-9999"
              :model-value="localForm.phone"
              :disabled="isView"
              placeholder="(11) 98888-7777"
              :state="errors.phone ? false : null"
              @update:model-value="updateField('phone', String($event ?? ''))"
            />
            <b-form-invalid-feedback v-if="errors.phone">{{ errors.phone }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
      </b-row>

      <b-row v-if="showLimitsSection">
        <b-col md="6">
          <b-form-group label-for="branch_limit" class="mb-3">
            <template #label>Limite de filiais <span class="text-danger">*</span></template>
            <b-form-input
              id="branch_limit"
              type="number"
              min="1"
              step="1"
              :model-value="localForm.branch_limit"
              :disabled="isView"
              :state="errors.branch_limit ? false : null"
              @update:model-value="onLimitNumber('branch_limit', $event)"
            />
            <small class="text-muted d-block mt-1">Máximo de filiais permitidas para esta empresa.</small>
            <b-form-invalid-feedback v-if="errors.branch_limit">{{ errors.branch_limit }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group label-for="user_limit" class="mb-3">
            <template #label>Limite de usuários <span class="text-danger">*</span></template>
            <b-form-input
              id="user_limit"
              type="number"
              min="1"
              step="1"
              :model-value="localForm.user_limit"
              :disabled="isView"
              :state="errors.user_limit ? false : null"
              @update:model-value="onLimitNumber('user_limit', $event)"
            />
            <small class="text-muted d-block mt-1">Máximo de usuários (inclui vínculos por empresa ou filial).</small>
            <b-form-invalid-feedback v-if="errors.user_limit">{{ errors.user_limit }}</b-form-invalid-feedback>
          </b-form-group>
        </b-col>
      </b-row>

      <div v-if="!showUserSection" class="d-flex gap-2">
        <slot name="actions" />
      </div>
    </UIComponentCard>

    <b-card v-if="showUserSection" no-body class="mb-3">
      <b-card-header>
        <b-card-title class="mb-0">Usuário principal da empresa</b-card-title>
      </b-card-header>
      <b-card-body class="pt-3">
        <b-form-checkbox v-model="useCompanyEmail" class="mb-3" :disabled="isView">
          Usar e-mail da empresa no usuário
        </b-form-checkbox>

        <b-row>
          <b-col md="4">
            <b-form-group label-for="user_name" class="mb-3">
              <template #label>Nome do usuário <span class="text-danger">*</span></template>
              <b-form-input
                id="user_name"
                :model-value="localForm.user_name"
                type="text"
                :disabled="isView"
                :state="errors.user_name ? false : null"
                @update:model-value="updateField('user_name', String($event ?? ''))"
              />
              <b-form-invalid-feedback v-if="errors.user_name">{{ errors.user_name }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label-for="user_email" class="mb-3">
              <template #label>E-mail do usuário <span class="text-danger">*</span></template>
              <b-form-input
                id="user_email"
                :model-value="localForm.user_email"
                type="email"
                :disabled="isView || useCompanyEmail"
                :state="errors.user_email ? false : null"
                @update:model-value="updateField('user_email', String($event ?? ''))"
              />
              <b-form-invalid-feedback v-if="errors.user_email">{{ errors.user_email }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label-for="user_password" class="mb-3">
              <template #label>Palavra-passe do usuário <span class="text-danger">*</span></template>
              <b-input-group>
                <b-form-input
                  id="user_password"
                  :model-value="localForm.user_password"
                  :type="showUserPassword ? 'text' : 'password'"
                  :disabled="isView"
                  :state="errors.user_password ? false : null"
                  @update:model-value="updateField('user_password', String($event ?? ''))"
                />
                <b-button
                  type="button"
                  variant="outline-secondary"
                  :title="showUserPassword ? 'Ocultar senha' : 'Mostrar senha'"
                  :disabled="isView"
                  @click="showUserPassword = !showUserPassword"
                >
                  <i :class="showUserPassword ? 'iconoir-eye-closed' : 'iconoir-eye'"></i>
                </b-button>
                <b-button type="button" variant="outline-primary" :disabled="isView" @click="generateRandomPassword()">
                  Gerar senha
                </b-button>
              </b-input-group>
              <b-form-invalid-feedback v-if="errors.user_password">{{ errors.user_password }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col md="4" class="ms-auto">
            <b-form-group label-for="user_password_confirmation" class="mb-3">
              <template #label>Confirmar palavra-passe <span class="text-danger">*</span></template>
              <b-form-input
                id="user_password_confirmation"
                :model-value="localForm.user_password_confirmation"
                :type="showUserPassword ? 'text' : 'password'"
                :disabled="isView"
                :state="errors.user_password_confirmation ? false : null"
                @update:model-value="updateField('user_password_confirmation', String($event ?? ''))"
              />
              <b-form-invalid-feedback v-if="errors.user_password_confirmation">
                {{ errors.user_password_confirmation }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="d-flex gap-2">
          <slot name="actions" />
        </div>
      </b-card-body>
    </b-card>
  </div>
</template>
