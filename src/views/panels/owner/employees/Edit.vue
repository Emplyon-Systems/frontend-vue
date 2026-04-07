<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ImageUploadCard from "@/components/ImageUploadCard.vue";
import DataForm from "./form/DataForm.vue";
import { employeesApi, branchesApi, companiesApi, usersApi, rolesApi } from "@/api/resources";
import { loadUsersForCompany, loadUsersAvailableForEmployeeLink } from "@/helpers/employeeCompanyUsers";
import { employeeInitialForm, validateEmployeeForm, type EmployeeFormData } from "@/core/schemas";
import { notifyError, notifySuccess } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";
import type { EmployeeRecord } from "@/types/api";

function formatCpfDisplay(digits: string): string {
  const d = String(digits ?? "").replace(/\D/g, "").slice(0, 11);
  if (d.length !== 11) return digits ?? "";
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const employeeId = computed(() => Number(route.params.id));
const routeName = computed(() => String(route.name ?? ""));
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));
const lockCompanyId = computed(() => {
  if (!companyScoped.value) return null;
  const c = authStore.user?.companies?.[0];
  return c?.id ? Number(c.id) : null;
});
const currentBranchId = computed(() => {
  if (!branchScoped.value) return 0;
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.id ?? 0);
});

function employeesListRoute() {
  return branchScoped.value ? "branch.employees" : companyScoped.value ? "company.employees" : "owner.employees";
}

const hideCompanyField = computed(() => companyScoped.value || branchScoped.value);
const hideBranchAssignmentField = computed(() => branchScoped.value);

const loading = ref(false);
const loadingEmployee = ref(true);
const loadError = ref("");
const form = ref<EmployeeFormData>(employeeInitialForm());
const { errors, clearError, resetErrors, onApiError } = useFormValidationErrors({
  notifyOnApiFieldErrors: false,
  notifyOnGenericApiMessage: false,
  notifyOnEmptyResponse: false,
});
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const branchOptions = ref<Array<{ id: number; name: string; company_id?: number }>>([]);
const userOptions = ref<Array<{ id: number; name: string; email: string }>>([]);
const branchUserFlow = computed(() => branchScoped.value);
const userAccessMode = ref<"link" | "create">("link");
const newUserPassword = ref("");
const newUserPasswordConfirm = ref("");
const newUserRoleId = ref(0);
const roleOptions = ref<Array<{ id: number; name: string }>>([]);
const employeePhotoUrl = ref<string | null>(null);
const employeePhotoUploading = ref(false);

const hideCreateUserOption = computed(() => form.value.user_id > 0);

watch(
  () => form.value.user_id,
  (uid) => {
    if (uid > 0) userAccessMode.value = "link";
  }
);

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
  const exceptId = form.value.user_id > 0 ? form.value.user_id : undefined;
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
        exceptEmployeeUserId: exceptId,
      });
    } else {
      userOptions.value = await loadUsersForCompany(cid, { exceptEmployeeUserId: exceptId });
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
  if (form.value.user_id > 0) return "normal" as const;
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

const effectiveLockCompanyId = computed(() => {
  if (companyScoped.value && lockCompanyId.value) return lockCompanyId.value;
  if (branchScoped.value && currentBranchId.value > 0) {
    const fromForm = Number(form.value.company_id ?? 0);
    if (fromForm > 0) return fromForm;
    const cid = authStore.user?.branches?.find((b) => b.id === currentBranchId.value)?.company_id;
    return cid != null && Number(cid) > 0 ? Number(cid) : null;
  }
  return null;
});

function cancel() {
  router.push({ name: employeesListRoute() });
}

function fillFormFromEmployee(data: Awaited<ReturnType<typeof employeesApi.getById>>) {
  const e = data.employee as EmployeeRecord | undefined;
  if (!e) return;
  const assignments =
    (e.branches ?? []).length > 0
      ? (e.branches ?? []).map((b) => ({
          branch_id: b.id,
          sector_id: Number(b.pivot?.sector_id ?? 0),
          is_primary: !!b.pivot?.is_primary,
        }))
      : [{ branch_id: 0, sector_id: 0, is_primary: true }];
  form.value = {
    company_id: e.company_id ?? 0,
    user_id: e.user_id != null && Number(e.user_id) > 0 ? Number(e.user_id) : 0,
    name: e.name ?? "",
    cpf: formatCpfDisplay(e.cpf ?? ""),
    email: e.email ?? "",
    phone: e.phone ?? "",
    job_title: e.job_title ?? "",
    street: e.street ?? "",
    street_number: e.street_number ?? "",
    complement: e.complement ?? "",
    neighborhood: e.neighborhood ?? "",
    zip_code: e.zip_code ?? "",
    city: e.city ?? "",
    state: e.state ?? "",
    assignments,
  };
  const c = e.company;
  if (c?.id != null && (c.name ?? "").trim()) {
    companyOptions.value = [{ id: c.id, name: c.name!.trim() }];
  } else if (branchScoped.value && (e.company_id ?? 0) > 0) {
    companyOptions.value = [{ id: e.company_id, name: `Empresa #${e.company_id}` }];
  }
  employeePhotoUrl.value = e.photo_url ?? null;
}

async function onEmployeePhotoSelect(file: File) {
  if (Number.isNaN(employeeId.value) || employeeId.value <= 0) return;
  employeePhotoUploading.value = true;
  try {
    const res = await employeesApi.uploadPhoto(employeeId.value, file);
    employeePhotoUrl.value = res.employee?.photo_url ?? null;
    notifySuccess("Foto do funcionário atualizada.");
  } catch (e) {
    onApiError(e);
  } finally {
    employeePhotoUploading.value = false;
  }
}

function loadEmployee() {
  loadError.value = "";
  loadingEmployee.value = true;
  if (Number.isNaN(employeeId.value) || employeeId.value <= 0) {
    loadError.value = "Funcionário inválido.";
    loadingEmployee.value = false;
    return;
  }
  employeesApi
    .getById(employeeId.value)
    .then(async (data) => {
      fillFormFromEmployee(data);
      await nextTick();
    })
    .catch(() => (loadError.value = "Funcionário não encontrado."))
    .finally(() => (loadingEmployee.value = false));
}

function submit() {
  resetErrors();
  const validation = validateEmployeeForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }
  const d = validation.data;

  if (branchScoped.value) {
    if (branchAccessAccountState.value === "blocked") {
      notifyError(
        "Não é possível concluir: limite de usuárioes atingido e nenhum usuário disponível para vínculo nesta filial. Contacte a empresa Matriz."
      );
      return;
    }
    if (branchAccessAccountState.value === "pending") {
      notifyError("Aguarde a verificação de limites e de usuárioes disponíveis.");
      return;
    }
  }

  if (branchScoped.value && userAccessMode.value === "create") {
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
        return employeesApi.update(employeeId.value, {
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
        });
      })
      .then(() => {
        notifySuccess("Funcionário atualizado com sucesso.");
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

  if (branchScoped.value && userAccessMode.value === "link" && d.user_id <= 0) {
    errors.value = { ...errors.value, user_id: "Selecione um usuário ou crie uma conta." };
    return;
  }

  loading.value = true;
  employeesApi
    .update(employeeId.value, {
      company_id: d.company_id,
      user_id: d.user_id > 0 ? d.user_id : null,
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
    })
    .then(() => {
      notifySuccess("Funcionário atualizado com sucesso.");
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
    if (!branchName || !companyId) {
      try {
        const res = await branchesApi.getById(currentBranchId.value);
        branchName = res.branch?.name ?? `Filial #${currentBranchId.value}`;
        companyId = Number(res.branch?.company_id ?? 0);
      } catch {
        branchName = `Filial #${currentBranchId.value}`;
      }
    }
    branchOptions.value = [{ id: currentBranchId.value, name: branchName ?? `Filial #${currentBranchId.value}`, company_id: companyId }];
  } else if (companyScoped.value && lockCompanyId.value) {
    const branches = await branchesApi.plucks();
    branchOptions.value = (branches as { id: number; name?: string; company_id?: number }[])
      .filter((b) => b.company_id === lockCompanyId.value)
      .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}`, company_id: b.company_id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const [companies, branches] = await Promise.all([companiesApi.plucks(), branchesApi.plucks()]);
    companyOptions.value = (companies as { id: number; name?: string }[])
      .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
    branchOptions.value = (branches as { id: number; name?: string; company_id?: number }[])
      .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}`, company_id: b.company_id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  loadEmployee();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar funcionário</h1>
          <p class="text-muted mb-0 small">Atualizar dados e filiais.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingEmployee" class="text-muted">Carregando funcionário...</div>
      <b-form v-else @submit.prevent="submit">
        <ImageUploadCard
          class="mb-3"
          title="Foto do funcionário"
          description="Foto de perfil (armazenada na pasta da empresa, filial e funcionário no object storage)."
          variant="circle"
          :preview-url="employeePhotoUrl"
          :uploading="employeePhotoUploading"
          @select="onEmployeePhotoSelect"
        />
        <DataForm
          v-model="form"
          :errors="errors"
          :company-options="companyOptions"
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
          :hide-create-user-option="hideCreateUserOption"
          mode="edit"
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
