<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "./form/DataForm.vue";
import { employeesApi, branchesApi, companiesApi, usersApi, rolesApi } from "@/api/resources";
import type { EmployeeCreatePayload } from "@/api/resources/employees";
import { loadUsersForCompany, loadUsersAvailableForEmployeeLink } from "@/helpers/employeeCompanyUsers";
import { employeeInitialForm, validateEmployeeForm, type EmployeeFormData } from "@/core/schemas";
import { notifyError, notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const routeName = computed(() => String(route.name ?? ""));
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));
const currentBranchId = computed(() => {
  if (!branchScoped.value) return 0;
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.id ?? 0);
});
const lockCompanyId = computed(() => {
  if (!companyScoped.value) return null;
  const c = authStore.user?.companies?.[0];
  return c?.id ? Number(c.id) : null;
});
const loading = ref(false);
const form = ref<EmployeeFormData>(employeeInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});
const companyOptions = ref<Array<{ id: number; name: string; internal_email_domain?: string }>>([]);
const branchOptions = ref<Array<{ id: number; name: string; company_id?: number }>>([]);
const userOptions = ref<Array<{ id: number; name: string; email: string }>>([]);
const branchUserFlow = computed(() => branchScoped.value);
const userAccessMode = ref<"link" | "create">("link");
const newUserPassword = ref("");
const newUserPasswordConfirm = ref("");
const newUserRoleId = ref(0);
const roleOptions = ref<Array<{ id: number; name: string }>>([]);

const userLimitReached = ref(false);
const companyLimitChecked = ref(false);
const linkUsersLoading = ref(false);

async function refreshCompanyUserLimit() {
  if (!branchScoped.value) {
    companyLimitChecked.value = true;
    userLimitReached.value = false;
    return;
  }
  const cid = Number(form.value.company_id ?? 0);
  if (cid <= 0) {
    userLimitReached.value = false;
    companyLimitChecked.value = false;
    return;
  }
  try {
    const res = await companiesApi.getById(cid);
    const c = res.company;
    const limit = c?.user_limit ?? 0;
    const used = c?.users_used ?? c?.users?.length ?? 0;
    userLimitReached.value = limit > 0 && used >= limit;
  } catch {
    userLimitReached.value = false;
  } finally {
    companyLimitChecked.value = true;
  }
}

async function refreshUserOptions() {
  const cid = form.value.company_id;
  if (cid <= 0) {
    userOptions.value = [];
    return;
  }
  linkUsersLoading.value = true;
  try {
    if (branchScoped.value && currentBranchId.value > 0) {
      if (userAccessMode.value === "create") {
        userOptions.value = [];
        return;
      }
      userOptions.value = await loadUsersAvailableForEmployeeLink({
        companyId: cid,
        branchId: currentBranchId.value,
      });
    } else {
      userOptions.value = await loadUsersForCompany(cid);
    }
    if (form.value.user_id > 0 && !userOptions.value.some((u) => u.id === form.value.user_id)) {
      form.value.user_id = 0;
    }
  } finally {
    linkUsersLoading.value = false;
  }
}

const branchAccessAccountState = computed(() => {
  if (!branchScoped.value) return "normal" as const;
  const cid = Number(form.value.company_id ?? 0);
  if (cid <= 0) return "normal" as const;
  if (!companyLimitChecked.value || linkUsersLoading.value) return "pending" as const;
  if (!userLimitReached.value) return "normal" as const;
  if (userOptions.value.length > 0) return "link_only" as const;
  return "blocked" as const;
});

/** Chave primitiva: evita reexecutar a cada tecla (getter com objeto novo disparava o watch sempre). */
const employeeUserOptionsWatchKey = () =>
  `${form.value.company_id}|${branchScoped.value ? 1 : 0}|${currentBranchId.value}|${userAccessMode.value}`;

watch(
  employeeUserOptionsWatchKey,
  async (sig, prevSig) => {
    if (prevSig != null && prevSig !== sig) {
      const prevCid = Number(prevSig.split("|")[0] ?? 0);
      const nextCid = Number(sig.split("|")[0] ?? 0);
      if (prevCid > 0 && nextCid !== prevCid) {
        form.value.user_id = 0;
      }
    }
    await refreshCompanyUserLimit();
    if (branchScoped.value && userLimitReached.value) {
      userAccessMode.value = "link";
    }
    await refreshUserOptions();
  },
  { immediate: true }
);

watch(userAccessMode, (m) => {
  if (branchScoped.value && m === "create") {
    form.value.user_id = 0;
  }
});

function primeBranchEmployeeCreateContext() {
  if (!branchScoped.value || currentBranchId.value <= 0) return;
  const br = authStore.user?.branches?.find((b) => b.id === currentBranchId.value);
  const cid = br?.company_id != null ? Number(br.company_id) : 0;
  if (cid <= 0) return;
  form.value.company_id = cid;
  const nm =
    authStore.activeContext?.branch_id === currentBranchId.value
      ? authStore.activeContext?.company_name?.trim() || ""
      : "";
  companyOptions.value = [{ id: cid, name: nm || `Empresa #${cid}` }];
}
primeBranchEmployeeCreateContext();

const effectiveLockCompanyId = computed(() => {
  if (companyScoped.value && lockCompanyId.value) return lockCompanyId.value;
  if (branchScoped.value) {
    const cid = Number(form.value.company_id ?? 0);
    return cid > 0 ? cid : null;
  }
  return null;
});

function employeesListRoute() {
  return branchScoped.value ? "branch.employees" : companyScoped.value ? "company.employees" : "owner.employees";
}

/** Contexto empresa ou filial: sem campo Empresa (implícito). */
const hideCompanyField = computed(() => companyScoped.value || branchScoped.value);
/** Contexto filial: sem coluna Filial; só setor. */
const hideBranchAssignmentField = computed(() => branchScoped.value);

const resolvedTenantEmailDomain = computed((): string | null => {
  const cid = Number(form.value.company_id ?? 0);
  if (cid <= 0) return null;
  const c = companyOptions.value.find((x) => x.id === cid);
  const d = (c?.internal_email_domain ?? "").trim();
  return d || null;
});

watch(
  () => form.value.company_id,
  async (cid) => {
    if (cid <= 0) return;
    const row = companyOptions.value.find((c) => c.id === cid);
    if (row?.internal_email_domain) return;
    try {
      const res = await companiesApi.getById(cid);
      const dom = res.company?.internal_email_domain?.trim();
      const name = res.company?.name?.trim() ?? `Empresa #${cid}`;
      if (!companyOptions.value.some((c) => c.id === cid)) {
        companyOptions.value = [...companyOptions.value, { id: cid, name, internal_email_domain: dom }];
      } else {
        companyOptions.value = companyOptions.value.map((c) =>
          c.id === cid ? { ...c, name: c.name || name, internal_email_domain: dom || c.internal_email_domain } : c
        );
      }
    } catch {
      //
    }
  },
  { immediate: true }
);

function cancel() {
  router.push({ name: employeesListRoute() });
}

function submit() {
  resetErrors();
  const validation = validateEmployeeForm(form.value, "create", {
    tenantEmailDomain: resolvedTenantEmailDomain.value,
  });
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }
  const d = validation.data;

  if (branchScoped.value) {
    if (branchAccessAccountState.value === "blocked") {
      notifyError(
        "Não é possível concluir o cadastro: limite de usuárioes atingido e nenhum usuário disponível para vínculo nesta filial. Contacte a empresa Matriz."
      );
      return;
    }
    if (branchAccessAccountState.value === "pending") {
      notifyError("Aguarde a verificação de limites e de usuárioes disponíveis.");
      return;
    }
    if (userAccessMode.value === "link") {
      if (d.user_id <= 0) {
        errors.value = { ...errors.value, user_id: "Selecione um usuário ou crie uma conta." };
        return;
      }
    } else {
      if (!newUserPassword.value.trim()) {
        errors.value = { ...errors.value, new_user_password: "Defina senha." };
        return;
      }
      if (newUserPassword.value !== newUserPasswordConfirm.value) {
        errors.value = { ...errors.value, new_user_password: "As senhas não coincidem." };
        return;
      }
      if (newUserRoleId.value <= 0) {
        errors.value = { ...errors.value, new_user_role: "Selecione um perfil." };
        return;
      }
      const primary = d.assignments.find((a) => a.is_primary) ?? d.assignments[0];
      if (!primary || primary.sector_id <= 0) {
        errors.value = { ...errors.value, assignments: "Selecione o setor na filial." };
        return;
      }
      let userIdCreatedForRollback: number | null = null;
      loading.value = true;
      usersApi
        .create({
          name: d.name.trim(),
          email: d.email.trim(),
          password: newUserPassword.value,
          roles: [newUserRoleId.value],
          branch_ids: [currentBranchId.value],
          sector_ids: [primary.sector_id],
        })
        .then((res) => {
          const uid = res.user?.id;
          if (!uid) {
            throw new Error("Resposta sem usuário.");
          }
          userIdCreatedForRollback = uid;
          const payload: EmployeeCreatePayload = {
            company_id: d.company_id,
            user_id: uid,
            name: d.name,
            cpf: d.cpf,
            email: d.email,
            phone: d.phone,
            job_title: d.job_title,
            street: d.street,
            street_number: d.street_number,
            complement: d.complement,
            neighborhood: d.neighborhood,
            zip_code: d.zip_code,
            city: d.city,
            state: d.state,
            assignments: d.assignments.map((a) => ({
              branch_id: a.branch_id,
              sector_id: a.sector_id,
              is_primary: !!a.is_primary,
            })),
          };
          return employeesApi.create(payload);
        })
        .then(() => {
          notifySuccess("Funcionário criado com sucesso.");
          router.push({ name: employeesListRoute() });
        })
        .catch((err) => {
          if (userIdCreatedForRollback != null) {
            usersApi.remove(userIdCreatedForRollback).catch(() => {});
          }
          onApiError(err);
        })
        .finally(() => (loading.value = false));
      return;
    }
  }

  const payload: EmployeeCreatePayload = {
    company_id: d.company_id,
    name: d.name,
    cpf: d.cpf,
    email: d.email,
    phone: d.phone,
    job_title: d.job_title,
    street: d.street,
    street_number: d.street_number,
    complement: d.complement,
    neighborhood: d.neighborhood,
    zip_code: d.zip_code,
    city: d.city,
    state: d.state,
    assignments: d.assignments.map((a) => ({
      branch_id: a.branch_id,
      sector_id: a.sector_id,
      is_primary: !!a.is_primary,
    })),
  };
  if (d.user_id > 0) {
    payload.user_id = d.user_id;
  }
  loading.value = true;
  employeesApi
    .create(payload)
    .then(() => {
      notifySuccess("Funcionário criado com sucesso.");
      router.push({ name: employeesListRoute() });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  if (branchScoped.value && currentBranchId.value > 0) {
    try {
      const pl = await rolesApi.plucks({ branch_id: currentBranchId.value });
      roleOptions.value = pl.map((r) => ({ id: r.id, name: r.name }));
    } catch {
      roleOptions.value = [];
    }
    let branchName =
      authStore.activeContext?.branch_id === currentBranchId.value
        ? authStore.activeContext?.branch_name
        : authStore.user?.branches?.find((b) => b.id === currentBranchId.value)?.name;
    let companyId = authStore.user?.branches?.find((b) => b.id === currentBranchId.value)?.company_id ?? 0;
    let apiCompanyName = "";
    if (!branchName || !companyId) {
      try {
        const res = await branchesApi.getById(currentBranchId.value);
        branchName = res.branch?.name ?? `Filial #${currentBranchId.value}`;
        companyId = Number(res.branch?.company_id ?? 0);
        apiCompanyName = res.branch?.company?.name?.trim() ?? "";
      } catch {
        branchName = `Filial #${currentBranchId.value}`;
      }
    }
    branchOptions.value = [{ id: currentBranchId.value, name: branchName ?? `Filial #${currentBranchId.value}`, company_id: companyId }];
    form.value.assignments = [{ branch_id: currentBranchId.value, sector_id: 0, is_primary: true }];
    if (companyId > 0) {
      form.value.company_id = companyId;
      const nm =
        apiCompanyName ||
        companyOptions.value.find((c) => c.id === companyId)?.name ||
        `Empresa #${companyId}`;
      try {
        const cr = await companiesApi.getById(companyId);
        const dom = cr.company?.internal_email_domain?.trim();
        companyOptions.value = [{ id: companyId, name: nm, internal_email_domain: dom }];
      } catch {
        companyOptions.value = [{ id: companyId, name: nm }];
      }
    }
    return;
  }
  if (companyScoped.value && lockCompanyId.value) {
    form.value.company_id = lockCompanyId.value;
    const branches = await branchesApi.plucks();
    branchOptions.value = (branches as { id: number; name?: string; company_id?: number }[])
      .filter((b) => b.company_id === lockCompanyId.value)
      .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}`, company_id: b.company_id }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return;
  }
  const [companies, branches] = await Promise.all([companiesApi.plucks(), branchesApi.plucks()]);
  companyOptions.value = (companies as { id: number; name?: string; internal_email_domain?: string }[])
    .map((c) => ({
      id: c.id,
      name: c.name ?? `Empresa #${c.id}`,
      internal_email_domain: c.internal_email_domain,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  branchOptions.value = (branches as { id: number; name?: string; company_id?: number }[])
    .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}`, company_id: b.company_id }))
    .sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Novo funcionário</h1>
          <p class="text-muted mb-0 small">Dados pessoais e endereço opcional, setor na filial e conta de acesso.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <b-form @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :company-options="companyOptions"
          :tenant-email-domain="resolvedTenantEmailDomain"
          :branch-options="branchOptions"
          :user-options="userOptions"
          :lock-company-id="effectiveLockCompanyId"
          :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null"
          :hide-company-field="hideCompanyField"
          :hide-branch-assignment-field="hideBranchAssignmentField"
          :branch-user-flow="branchUserFlow"
          :branch-access-account-state="branchAccessAccountState"
          :user-access-mode="userAccessMode"
          :new-user-password="newUserPassword"
          :new-user-password-confirm="newUserPasswordConfirm"
          :new-user-role-id="newUserRoleId"
          :role-options="roleOptions"
          mode="create"
          @clear-error="clearError"
          @update:user-access-mode="userAccessMode = $event"
          @update:new-user-password="newUserPassword = $event"
          @update:new-user-password-confirm="newUserPasswordConfirm = $event"
          @update:new-user-role-id="newUserRoleId = $event"
        >
          <template #actions>
            <b-button
              type="submit"
              variant="primary"
              :disabled="
                loading ||
                branchAccessAccountState === 'blocked' ||
                branchAccessAccountState === 'pending'
              "
            >
              {{ loading ? "Salvando..." : "Salvar" }}
            </b-button>
            <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
          </template>
        </DataForm>
      </b-form>
    </div>
  </DefaultLayout>
</template>
