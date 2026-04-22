<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { branchesApi, companiesApi, rolesApi, usersApi } from "@/api/resources";
import InputMask from "@/components/InputMask.vue";
import { generateSecureRandomPassword } from "@/helpers/generate-password";
import { notifyError, notifySuccess } from "@/helpers/notify";
import type { CompanyRecord, RoleRecord } from "@/types/api";
import {
  branchInitialForm,
  validateBranchForm,
  type BranchFormData,
} from "@/core/schemas";

const props = defineProps<{ companyId: number }>();
const emit = defineEmits<{ (e: "completed" | "skipped"): void }>();

const TOTAL_STEPS = 2;
const currentStep = ref(1);
const saving = ref(false);
const saveError = ref("");
const loadError = ref("");
/** Explicação do e-mail em diálogo interno (dentro do modal do wizard). */
const showManagerEmailHelp = ref(false);

const company = ref<CompanyRecord | null>(null);
const createdBranchId = ref(0);
/** Ordem da filial na empresa (1ª = 1 → sufixo «01» no e-mail). */
const branchOrderIndex = ref(1);
/** Parte local do e-mail do gerente: gerentefilial + posição da filial (01–99, depois 3 dígitos se >99). */
const GERENTE_FILIAL_EMAIL_LOCAL_PREFIX = "gerentefilial";

function padBranchOrderForEmail(n: number): string {
  const v = Math.max(1, n);
  if (v <= 99) return String(v).padStart(2, "0");
  return String(v).padStart(3, "0");
}
const branchForm = reactive<BranchFormData>(branchInitialForm());

const searchingZipCode = ref(false);
const lastViaCepZipFetched = ref("");
let zipLookupDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function cleanZipCode(value: string): string {
  return value.replace(/\D/g, "");
}

async function fillAddressByZipCode(opts?: { manual?: boolean }): Promise<boolean> {
  const manual = !!opts?.manual;
  const zip = cleanZipCode(String(branchForm.zip_code ?? "").trim());
  if (zip.length !== 8) {
    if (manual) notifyError("Informe um CEP válido com 8 dígitos.");
    return false;
  }
  if (!manual && zip === lastViaCepZipFetched.value) {
    return true;
  }

  searchingZipCode.value = true;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
    if (!res.ok) {
      notifyError("Não foi possível consultar o CEP. Tente novamente.");
      return false;
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
      return false;
    }
    branchForm.street = data.logradouro ?? branchForm.street;
    branchForm.neighborhood = data.bairro ?? branchForm.neighborhood;
    branchForm.city = data.localidade ?? branchForm.city;
    const uf = (data.uf ?? branchForm.state ?? "").toString().toUpperCase().slice(0, 2);
    branchForm.state = uf || branchForm.state;
    lastViaCepZipFetched.value = zip;
    return true;
  } catch {
    notifyError("Erro ao buscar CEP. Verifique a ligação ou tente mais tarde.");
    return false;
  } finally {
    searchingZipCode.value = false;
  }
}

function onBranchZipCodeUpdate(raw: string) {
  branchForm.zip_code = raw;
  const zip = cleanZipCode(raw);
  if (zip.length < 8) {
    lastViaCepZipFetched.value = "";
  }
  if (zipLookupDebounceTimer) {
    clearTimeout(zipLookupDebounceTimer);
    zipLookupDebounceTimer = null;
  }
  if (zip.length !== 8) return;
  zipLookupDebounceTimer = setTimeout(() => {
    zipLookupDebounceTimer = null;
    void fillAddressByZipCode({ manual: false });
  }, 450);
}

function onBranchZipBlur() {
  void fillAddressByZipCode({ manual: false });
}

onBeforeUnmount(() => {
  if (zipLookupDebounceTimer) {
    clearTimeout(zipLookupDebounceTimer);
    zipLookupDebounceTimer = null;
  }
});

const userState = reactive({
  name: "",
  empEmail: "",
  password: "",
  passwordConfirm: "",
});

const showManagerPassword = ref(false);
const showManagerPasswordConfirm = ref(false);

function applyGeneratedManagerPassword(): void {
  const p = generateSecureRandomPassword(12);
  userState.password = p;
  userState.passwordConfirm = p;
}

const tenantEmailDomain = ref<string | null>(null);

function extractEmailDomain(emailLike: string | null | undefined): string {
  const raw = String(emailLike ?? "").trim().toLowerCase();
  if (!raw) return "";
  const at = raw.lastIndexOf("@");
  if (at < 0) return "";
  const host = raw.slice(at + 1).trim();
  if (!host || !host.includes(".")) return "";
  return host;
}

function buildDomainFromCompanyName(nameLike: string | null | undefined): string {
  const base = String(nameLike ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  if (!base) return "";
  return `${base}.com`;
}

async function refreshBranchOrderIndex(): Promise<void> {
  const bid = createdBranchId.value;
  if (props.companyId <= 0) {
    branchOrderIndex.value = 1;
    return;
  }
  try {
    const res = await branchesApi.list({
      company_id: props.companyId,
      per_page: 500,
      order_by: "id",
      order_dir: "asc",
    });
    const rows = res.branches?.data ?? [];
    if (!bid) {
      // Quando a filial ainda não foi criada (fluxo de submit final),
      // usamos a próxima posição prevista para compor o e-mail.
      branchOrderIndex.value = Math.max(1, rows.length + 1);
      return;
    }
    const idx = rows.findIndex((b) => b.id === bid);
    branchOrderIndex.value = idx >= 0 ? idx + 1 : Math.max(1, rows.length);
  } catch {
    branchOrderIndex.value = 1;
  }
}

function syncUserEmailFromPattern(): void {
  const dom = tenantDomainNormalized.value;
  if (!dom) return;
  const local = `${GERENTE_FILIAL_EMAIL_LOCAL_PREFIX}${padBranchOrderForEmail(branchOrderIndex.value)}`;
  userState.empEmail = `${local}@${dom}`;
}

const canonicalEmailLocal = computed(() => {
  return `${GERENTE_FILIAL_EMAIL_LOCAL_PREFIX}${padBranchOrderForEmail(branchOrderIndex.value)}`;
});

const canonicalFullEmail = computed(() => {
  const d = tenantDomainNormalized.value;
  if (!d) return (userState.empEmail ?? "").trim().toLowerCase();
  return `${canonicalEmailLocal.value}@${d}`.toLowerCase();
});

async function loadCompany() {
  loadError.value = "";
  if (props.companyId <= 0) {
    loadError.value = "Empresa inválida.";
    return;
  }
  try {
    const res = await companiesApi.getById(props.companyId);
    company.value = res.company ?? null;
    const internalDomain = (res.company?.internal_email_domain ?? "").trim().toLowerCase();
    const fallbackEmailDomain = extractEmailDomain(res.company?.email);
    const fallbackCompanyDomain = buildDomainFromCompanyName(res.company?.name);
    tenantEmailDomain.value = internalDomain || fallbackCompanyDomain || fallbackEmailDomain || null;
    branchForm.company_id = props.companyId;

    const existing = company.value?.branches?.[0];
    if (existing?.id) {
      createdBranchId.value = existing.id;
      await refreshBranchOrderIndex();
    }
  } catch {
    loadError.value = "Não foi possível carregar a empresa.";
  }
}

onMounted(loadCompany);
watch(
  () => props.companyId,
  () => loadCompany()
);

const tenantDomainNormalized = computed(() => (tenantEmailDomain.value ?? "").trim().toLowerCase());
const useSplitTenantEmail = computed(() => Boolean(tenantDomainNormalized.value));

/** Texto da ajuda «Como funciona?» (modal interno). */
const managerEmailHowItWorksText = computed(() => {
  const dom = tenantDomainNormalized.value;
  if (dom) {
    return (
      `O e-mail é montado pelo sistema e não pode ser alterado: «${GERENTE_FILIAL_EMAIL_LOCAL_PREFIX}» ` +
      `+ posição da filial na empresa (01 = 1.ª, 02 = 2.ª; mais dígitos só com muitas filiais) + @ + domínio interno da empresa (${dom}).`
    );
  }
  return "Sem domínio interno na empresa, o padrão automático não se aplica; o e-mail exibido segue o valor definido pelo sistema.";
});

function parseEmailLocal(full: string, domain: string): string {
  const f = full.trim();
  const d = domain.toLowerCase();
  if (!f || !d) return f.replace(/@/g, "");
  const at = f.lastIndexOf("@");
  if (at < 0) return f.replace(/@/g, "");
  const host = f.slice(at + 1).toLowerCase();
  const local = f.slice(0, at);
  if (host === d) return local;
  return local.replace(/@/g, "");
}

function sanitizeEmailLocalInput(raw: string, domain: string): string {
  let s = String(raw ?? "").trim();
  const suffix = `@${domain.toLowerCase()}`;
  const lower = s.toLowerCase();
  if (lower.endsWith(suffix)) {
    s = s.slice(0, s.length - suffix.length).trim();
  }
  return s.replace(/@/g, "").trim();
}

watch([() => tenantDomainNormalized.value, currentStep, () => branchOrderIndex.value], () => {
  if (currentStep.value === 2) syncUserEmailFromPattern();
});

watch(currentStep, (s) => {
  if (s !== 2) showManagerEmailHelp.value = false;
});

const hasExistingBranch = computed(() => {
  const id = company.value?.branches?.[0]?.id;
  return typeof id === "number" && id > 0;
});

const existingBranchName = computed(() => company.value?.branches?.[0]?.name ?? "");

const progressPct = computed(() => Math.round((currentStep.value / TOTAL_STEPS) * 100));

const stepError = computed((): string => {
  if (currentStep.value === 1 && !hasExistingBranch.value) {
    const v = validateBranchForm(branchForm, "create");
    if (!v.success) {
      const e = v.errors;
      return (
        e.name ||
        e.cnpj ||
        e.zip_code ||
        e.street ||
        e.street_number ||
        e.neighborhood ||
        e.city ||
        e.state ||
        "Preencha os dados da filial."
      );
    }
  }
  if (currentStep.value === 2) {
    if (!userState.name.trim()) return "Nome do gerente é obrigatório.";
    const dom = tenantDomainNormalized.value;
    if (dom) {
      const expected = canonicalFullEmail.value;
      if (userState.empEmail.trim().toLowerCase() !== expected) {
        return `O e-mail do gerente é fixo: ${expected}`;
      }
    } else {
      if (!userState.empEmail.trim()) return "E-mail é obrigatório.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userState.empEmail.trim())) {
        return "E-mail inválido.";
      }
    }
    if (!userState.password || userState.password.length < 8) {
      return "Senha com pelo menos 8 caracteres.";
    }
    if (userState.password !== userState.passwordConfirm) {
      return "As senhas não coincidem.";
    }
  }
  return "";
});

function pickFilialGerenteRoleId(roles: RoleRecord[], branchId: number): number | null {
  const expectedSlug = `filial-b${branchId}`;
  const r = roles.find(
    (x) => x.branch_id === branchId && x.slug === expectedSlug
  );
  return r?.id ?? null;
}

async function goNext() {
  if (stepError.value || saving.value) return;
  saveError.value = "";

  if (currentStep.value === 1) {
    if (hasExistingBranch.value) {
      const id = company.value?.branches?.[0]?.id;
      createdBranchId.value = id ?? 0;
      await refreshBranchOrderIndex();
      syncUserEmailFromPattern();
      currentStep.value = 2;
      return;
    }
    await refreshBranchOrderIndex();
    currentStep.value = 2;
    syncUserEmailFromPattern();
    return;
  }

  await finish();
}

function goPrev() {
  if (currentStep.value > 1 && !saving.value) {
    currentStep.value--;
    saveError.value = "";
  }
}

async function skipSetup() {
  if (saving.value) return;
  saveError.value = "";
  notifySuccess("Primeiros passos ignorados por agora.");
  emit("skipped");
}

async function finish() {
  if (stepError.value) return;

  saving.value = true;
  saveError.value = "";
  try {
    let bid = createdBranchId.value;
    if (!bid) {
      if (hasExistingBranch.value) {
        bid = company.value?.branches?.[0]?.id ?? 0;
      } else {
        const v = validateBranchForm(branchForm, "create");
        if (!v.success) {
          saveError.value = "Dados da filial inválidos.";
          return;
        }
        const branchRes = await branchesApi.create(v.data);
        bid = branchRes.branch?.id ?? 0;
        if (!bid) {
          saveError.value = "Filial criada mas resposta sem ID.";
          return;
        }
      }
      createdBranchId.value = bid;
      await refreshBranchOrderIndex();
    }
    if (!bid) {
      saveError.value = "Filial não identificada.";
      return;
    }

    const rolesRes = await rolesApi.list({ branch_id: bid, per_page: 50 });
    const list = rolesRes.roles?.data ?? [];
    const roleId = pickFilialGerenteRoleId(list, bid);
    if (!roleId) {
      saveError.value =
        "Perfil «Gerente filial» não encontrado para esta filial. Verifique os templates de perfil no sistema.";
      return;
    }

    const dom = tenantDomainNormalized.value;
    const email = dom
      ? `${sanitizeEmailLocalInput(parseEmailLocal(userState.empEmail, dom), dom)}@${dom}`
      : userState.empEmail.trim();

    await usersApi.create({
      name: userState.name.trim(),
      email,
      password: userState.password,
      roles: [roleId],
      branch_ids: [bid],
    });

    await companiesApi.completeSetup(props.companyId);
    notifySuccess("Primeiros passos concluídos! O gerente já pode aceder ao painel da filial.");
    emit("completed");
  } catch (err: unknown) {
    const data = (err as { response?: { data?: { errors?: Record<string, string[]>; msg?: string } } })?.response
      ?.data;
    if (data?.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors)[0];
      saveError.value = Array.isArray(first) ? String(first[0]) : "Erro ao criar utilizador.";
    } else {
      saveError.value = data?.msg ?? "Erro ao guardar. Tente novamente.";
    }
  } finally {
    saving.value = false;
  }
}

defineExpose({
  skipSetup,
});
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
    header-class="company-first-steps-header border-0"
    footer-class="company-setup-modal-footer"
  >
    <template #header>
      <div class="company-setup-modal-header w-100">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="company-setup-icon-box">
            <img src="/iconelogo.svg" alt="Logo Emplyon" class="company-setup-logo" />
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
              <span class="text-white fw-semibold fs-15">Primeiros Passos da empresa</span>
              <span class="badge rounded-pill bg-white text-primary fw-semibold">{{ progressPct }}%</span>
            </div>
            <p class="text-white text-opacity-75 mb-0" style="font-size: 0.78rem">
              Etapa {{ currentStep }} de {{ TOTAL_STEPS }}
              —
              <template v-if="currentStep === 1">Criar a primeira filial</template>
              <template v-else>Gerente da filial (e-mail automático)</template>
            </p>
          </div>
        </div>
        <div class="company-setup-steps-track">
          <div
            class="company-setup-step-segment"
            :class="{ done: currentStep > 1, current: currentStep === 1 }"
          ></div>
          <div
            class="company-setup-step-segment"
            :class="{ done: false, current: currentStep === 2 }"
          ></div>
        </div>
      </div>
    </template>

    <div class="p-4 company-first-steps-body position-relative">
      <div v-if="loadError" class="alert alert-danger py-2">{{ loadError }}</div>

      <template v-else>
        <!-- Etapa 1 -->
        <div v-if="currentStep === 1">
          <p class="text-muted mb-4 fs-13">
            Serão criados filial e utilizador gerente. O primeiro setor (e colaboradores) fica para a
            <strong>configuração da filial</strong>
            após o login.
          </p>

          <template v-if="hasExistingBranch">
            <!-- BAlert usa v-model (modelValue); o atributo `show` não activa a visibilidade. -->
            <b-alert :model-value="true" variant="info" class="mb-0">
              Já existe uma filial registada:
              <strong>{{ existingBranchName }}</strong>
              . Avance para criar o gerente da filial.
            </b-alert>
          </template>

          <template v-else>
            <b-row class="g-3">
              <b-col cols="12">
                <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Nome da filial <span class="text-danger">*</span></label>
                <input v-model="branchForm.name" type="text" class="form-control" maxlength="255" />
              </b-col>
              <b-col md="6">
                <label class="form-label fw-semibold" for="company-first-steps-cnpj" style="color: var(--bs-label-color)">
                  CNPJ <span class="text-danger">*</span>
                </label>
                <InputMask
                  id="company-first-steps-cnpj"
                  mask="99.999.999/9999-99"
                  class="flex-grow-1 min-w-0"
                  placeholder="00.000.000/0000-00"
                  :model-value="branchForm.cnpj ?? ''"
                  @update:model-value="branchForm.cnpj = String($event ?? '')"
                />
              </b-col>
              <b-col md="6">
                <label class="form-label fw-semibold" style="color: var(--bs-label-color)">CEP <span class="text-danger">*</span></label>
                <b-input-group>
                  <InputMask
                    id="company-first-steps-zip"
                    mask="99999-999"
                    class="flex-grow-1 min-w-0"
                    placeholder="Ex.: 01310-100"
                    :model-value="branchForm.zip_code ?? ''"
                    @update:model-value="onBranchZipCodeUpdate"
                    @blur="onBranchZipBlur"
                  />
                  <b-button
                    type="button"
                    variant="outline-primary"
                    :disabled="searchingZipCode"
                    @click="fillAddressByZipCode({ manual: true })"
                  >
                    <b-spinner v-if="searchingZipCode" small class="align-middle" />
                    <span v-else>Buscar CEP</span>
                  </b-button>
                </b-input-group>
                <p class="text-muted small mb-0 mt-1">
                  Ao completar o CEP, o endereço é preenchido automaticamente; use o botão para consultar de novo.
                </p>
              </b-col>
              <b-col md="8">
                <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Logradouro <span class="text-danger">*</span></label>
                <input v-model="branchForm.street" type="text" class="form-control" />
              </b-col>
              <b-col md="4">
                <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Número <span class="text-danger">*</span></label>
                <input v-model="branchForm.street_number" type="text" class="form-control" maxlength="20" />
              </b-col>
              <b-col md="6">
                <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Bairro <span class="text-danger">*</span></label>
                <input v-model="branchForm.neighborhood" type="text" class="form-control" />
              </b-col>
              <b-col md="4">
                <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Município <span class="text-danger">*</span></label>
                <input v-model="branchForm.city" type="text" class="form-control" />
              </b-col>
              <b-col md="2">
                <label class="form-label fw-semibold" style="color: var(--bs-label-color)">UF <span class="text-danger">*</span></label>
                <input v-model="branchForm.state" type="text" class="form-control text-uppercase" maxlength="2" />
              </b-col>
            </b-row>
          </template>
        </div>

        <!-- Etapa 2: gerente -->
        <div v-else-if="currentStep === 2">
          <p class="text-muted mb-3 fs-13">
            Dados de acesso do <strong>gerente da filial</strong> (e-mail automático + senha).
          </p>
          <b-row class="g-3">
            <b-col cols="12">
              <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Nome completo <span class="text-danger">*</span></label>
              <input v-model="userState.name" type="text" class="form-control" placeholder="Nome completo" />
            </b-col>
            <b-col cols="12">
              <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-1">
                <label class="form-label fw-semibold mb-0" style="color: var(--bs-label-color)">
                  E-mail de acesso <span class="text-danger">*</span>
                </label>
                <button
                  type="button"
                  class="btn btn-link btn-sm text-primary text-decoration-underline p-0 align-baseline shadow-none"
                  @click="showManagerEmailHelp = true"
                >
                  Como funciona?
                </button>
              </div>
              <template v-if="useSplitTenantEmail">
                <b-input-group class="manager-email-static">
                  <div
                    class="form-control bg-body-secondary user-select-all manager-email-static-local d-flex align-items-center"
                  >
                    {{ canonicalEmailLocal }}
                  </div>
                  <b-input-group-text class="text-body-secondary user-select-all">@{{ tenantEmailDomain }}</b-input-group-text>
                </b-input-group>
                <p class="form-text mb-0 fs-13">Gerado automaticamente — não editável.</p>
              </template>
              <template v-else>
                <div class="form-control bg-body-secondary user-select-all manager-email-static-full">
                  {{ userState.empEmail || "—" }}
                </div>
                <p class="form-text mb-0 fs-13">Gerado automaticamente — não editável.</p>
              </template>
            </b-col>
            <b-col md="6">
              <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Senha <span class="text-danger">*</span></label>
              <b-input-group>
                <b-form-input
                  id="company-first-steps-password"
                  v-model="userState.password"
                  :type="showManagerPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                />
                <b-button
                  type="button"
                  variant="outline-secondary"
                  :title="showManagerPassword ? 'Ocultar senha' : 'Mostrar senha'"
                  :aria-label="showManagerPassword ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="showManagerPassword = !showManagerPassword"
                >
                  <i :class="showManagerPassword ? 'iconoir-eye-closed' : 'iconoir-eye'"></i>
                </b-button>
                <b-button type="button" variant="outline-primary" title="Gerar senha forte" @click="applyGeneratedManagerPassword">
                  Gerar senha
                </b-button>
              </b-input-group>
            </b-col>
            <b-col md="6">
              <label class="form-label fw-semibold" style="color: var(--bs-label-color)">Confirmar senha <span class="text-danger">*</span></label>
              <b-input-group>
                <b-form-input
                  id="company-first-steps-password-confirm"
                  v-model="userState.passwordConfirm"
                  :type="showManagerPasswordConfirm ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Repita a senha"
                />
                <b-button
                  type="button"
                  variant="outline-secondary"
                  :title="showManagerPasswordConfirm ? 'Ocultar senha' : 'Mostrar senha'"
                  :aria-label="showManagerPasswordConfirm ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="showManagerPasswordConfirm = !showManagerPasswordConfirm"
                >
                  <i :class="showManagerPasswordConfirm ? 'iconoir-eye-closed' : 'iconoir-eye'"></i>
                </b-button>
              </b-input-group>
            </b-col>
          </b-row>
        </div>

        <div v-if="stepError" class="alert alert-warning d-flex align-items-start gap-2 mt-4 mb-0 py-2 px-3">
          <i class="iconoir-warning-triangle mt-1 flex-shrink-0"></i>
          <span class="fs-13">{{ stepError }}</span>
        </div>

        <div v-if="saveError" class="alert alert-danger d-flex align-items-start gap-2 mt-3 mb-0 py-2 px-3">
          <i class="iconoir-xmark-circle mt-1 flex-shrink-0"></i>
          <span class="fs-13">{{ saveError }}</span>
        </div>
      </template>

      <!-- Modal interno: explicação do e-mail (só sobre a área do corpo do wizard) -->
      <div
        v-if="showManagerEmailHelp && currentStep === 2"
        class="company-first-steps-inner-modal-backdrop"
        role="presentation"
        @click.self="showManagerEmailHelp = false"
      >
        <div
          class="modal-content company-first-steps-inner-dialog shadow"
          role="dialog"
          aria-modal="true"
          aria-labelledby="company-email-help-title"
          tabindex="-1"
          @click.stop
        >
          <div class="modal-header py-3 border-bottom">
            <h2 id="company-email-help-title" class="modal-title fs-6 mb-0">Como funciona o e-mail?</h2>
            <button
              type="button"
              class="btn-close"
              aria-label="Fechar"
              @click="showManagerEmailHelp = false"
            ></button>
          </div>
          <div class="modal-body py-3">
            <p class="mb-0 fs-13 text-body-secondary">{{ managerEmailHowItWorksText }}</p>
          </div>
          <div class="modal-footer py-2 border-top">
            <b-button variant="primary" size="sm" @click="showManagerEmailHelp = false">Entendi</b-button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="d-flex align-items-center justify-content-between w-100">
        <b-button
          variant="link"
          class="text-muted text-decoration-none ps-0 fw-semibold"
          :disabled="currentStep === 1 || saving"
          @click="goPrev"
        >
          <i class="iconoir-nav-arrow-left me-1"></i>Voltar
        </b-button>
        <div class="d-flex align-items-center gap-1">
          <span class="step-dot" :class="{ active: currentStep === 1, done: currentStep > 1 }"></span>
          <span class="step-dot" :class="{ active: currentStep === 2 }"></span>
        </div>
        <b-button variant="primary" :disabled="!!stepError || !!loadError || saving" @click="goNext">
          <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status"></span>
          <span v-if="currentStep < 2">Próximo <i class="iconoir-nav-arrow-right ms-1"></i></span>
          <span v-else><i class="iconoir-check me-1"></i>Concluir</span>
        </b-button>
      </div>
    </template>
  </b-modal>
</template>

<style scoped>
/* Sobrescreve o .modal-header global (cinza escuro) pelo azul do sistema */
:deep(.modal-header.company-first-steps-header) {
  display: block;
  padding: 1.25rem 1.5rem 1rem;
  background-color: var(--bs-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.company-setup-modal-header {
  padding-bottom: 0.5rem;
}

.company-setup-icon-box {
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

.company-setup-logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.company-setup-steps-track {
  display: flex;
  gap: 4px;
}

.company-setup-step-segment {
  flex: 1;
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.3s;
}

.company-setup-step-segment.done {
  background: var(--bs-primary);
}

.company-setup-step-segment.current {
  background: #fff;
}

:deep(.company-setup-modal-footer) {
  padding: 0.875rem 1.5rem;
  border-top: 1px solid var(--bs-border-color);
  background: var(--bs-secondary-bg);
}

.step-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bs-border-color);
  transition: all 0.2s;
}

.step-dot.done {
  background: var(--bs-primary);
  opacity: 0.55;
}

.step-dot.active {
  width: 20px;
  border-radius: 4px;
  background: var(--bs-primary);
}

/* E-mail só texto: sem foco de input nem aparência de campo editável. */
.manager-email-static .manager-email-static-local,
.manager-email-static-full {
  cursor: default;
  min-height: calc(1.5em + 0.75rem + 2px);
}

/* Diálogo tipo modal só dentro do corpo do wizard (sem segundo backdrop a nível da página). */
.company-first-steps-inner-modal-backdrop {
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

.company-first-steps-inner-dialog {
  max-width: 420px;
  width: 100%;
  border-radius: var(--bs-border-radius-lg, 0.5rem);
}
</style>
