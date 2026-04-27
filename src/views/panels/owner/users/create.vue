<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import DataForm from "./form/DataForm.vue";
import { usersApi, rolesApi, sectorsApi, branchesApi, permissionsApi } from "@/api/resources";
import { userInitialForm, validateUserForm, type UserCreateData, type UserFormData } from "@/core/schemas";
import { notifySuccess, notifyError } from "@/helpers/notify";
import { useFormValidationErrors } from "@/composables/useFormValidationErrors";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

/** Perfis vêm de `rolesApi.list` filtrado por empresa/filial; sem `company_ids` o backend só devolve perfis globais (null company/branch). */
function buildInitialForm(): UserFormData {
  const base = userInitialForm("create");
  const qCid = route.query.company_id;
  const qBid = route.query.branch_id;
  if (qCid != null && String(qCid).trim() !== "") {
    const cid = Number(qCid);
    if (Number.isFinite(cid) && cid > 0) {
      let next: UserFormData = { ...base, company_ids: [cid] };
      if (qBid != null && String(qBid).trim() !== "") {
        const bid = Number(qBid);
        if (Number.isFinite(bid) && bid > 0) next = { ...next, branch_ids: [bid] };
      }
      return next;
    }
  }
  if (!authStore.hasRole("superadmin") && authStore.activeContext?.company_id) {
    const cid = Number(authStore.activeContext.company_id);
    if (Number.isFinite(cid) && cid > 0) {
      let next: UserFormData = { ...base, company_ids: [cid] };
      const bid = authStore.activeContext.branch_id != null ? Number(authStore.activeContext.branch_id) : 0;
      if (Number.isFinite(bid) && bid > 0) next = { ...next, branch_ids: [bid] };
      return next;
    }
  }
  return base;
}

const loading = ref(false);
const roleOptions = ref<{ id: number; name: string; slug?: string; permission_ids?: number[] }[]>([]);
const permissionOptions = ref<{ id: number; name: string; slug?: string }[]>([]);
const companyOptions = ref<{ id: number; name: string; internal_email_domain?: string }[]>([]);
const branchOptions = ref<{ id: number; company_id?: number; name: string; company_name?: string }[]>([]);
const sectorOptions = ref<{ id: number; branch_id: number; name: string; slug?: string }[]>([]);
const form = ref<UserFormData>(buildInitialForm());
const {
  errors,
  submitAttempt,
  clearError,
  resetErrors,
  bumpSubmitAttempt,
  onClientValidationFailed,
  onApiError,
} = useFormValidationErrors({
  toastFieldPriority: ["sector_ids", "roles", "company_ids", "general"],
  bumpSubmitAttemptOnApiError: true,
  bumpSubmitAttemptOnClientValidation: true,
});
const isSuperadmin = ref(false);
/** Em contexto filial, a filial vem fixa (pré-selecionada e bloqueada). */
const fixedBranchId = computed(() => authStore.activeContext?.branch_id ?? null);
const hasScopedCompanyFromRoute = computed(() => {
  const qCid = Number(route.query.company_id ?? 0);
  return Number.isFinite(qCid) && qCid > 0;
});
const showCompanySelector = computed(
  () => isSuperadmin.value && !fixedBranchId.value && !hasScopedCompanyFromRoute.value
);
const selectedCompanyIds = computed(() => (form.value.company_ids ?? []).filter((id) => Number.isFinite(id) && id > 0));
const selectedBranchIds = computed(() =>
  (form.value.branch_ids ?? []).filter((id) => Number.isFinite(id) && id > 0)
);
const filteredBranchOptions = computed(() => {
  if (fixedBranchId.value) {
    const branch = branchOptions.value.find((b) => b.id === fixedBranchId.value);
    return branch ? [branch] : [];
  }
  if (!isSuperadmin.value) return branchOptions.value;
  if (!selectedCompanyIds.value.length) return branchOptions.value;
  return branchOptions.value.filter((branch) =>
    selectedCompanyIds.value.includes(Number(branch.company_id ?? 0))
  );
});

/** Uma única empresa (direta ou inferida pelas filiais) → domínio sintético usuario@slug.com. */
const resolvedTenantEmailDomain = computed((): string | null => {
  if (selectedCompanyIds.value.length === 1) {
    const c = companyOptions.value.find((x) => x.id === selectedCompanyIds.value[0]);
    const d = (c?.internal_email_domain ?? "").trim();
    return d || null;
  }
  const branchCompanyIds = new Set<number>();
  for (const bid of selectedBranchIds.value) {
    const b = filteredBranchOptions.value.find((x) => x.id === bid);
    const cid = Number(b?.company_id ?? 0);
    if (cid > 0) branchCompanyIds.add(cid);
  }
  if (branchCompanyIds.size === 1) {
    const cid = [...branchCompanyIds][0];
    const c = companyOptions.value.find((x) => x.id === cid);
    const d = (c?.internal_email_domain ?? "").trim();
    return d || null;
  }
  return null;
});

const shouldRequireSectorForSyntheticEmail = computed(() => {
  if (!resolvedTenantEmailDomain.value) return false;
  if (fixedBranchId.value) return true;
  return selectedBranchIds.value.length === 1;
});

function cancel() {
  router.push({ name: "owner.users" });
}

function submit() {
  resetErrors();
  const hasSelectedProfiles = (form.value.roles?.length ?? 0) > 0;
  const hasSelectedDirectPermissions = (form.value.direct_permission_ids?.length ?? 0) > 0;
  if (!hasSelectedProfiles && !hasSelectedDirectPermissions) {
    errors.value = {
      ...errors.value,
      roles: "Selecione pelo menos um perfil ou uma permissão individual na aba Permissões.",
    };
    bumpSubmitAttempt();
    notifyError(errors.value.roles);
    return;
  }

  const validation = validateUserForm(form.value, "create", {
    tenantEmailDomain: resolvedTenantEmailDomain.value,
    requireSectorIds: shouldRequireSectorForSyntheticEmail.value,
  });
  if (!validation.success) {
    onClientValidationFailed(validation.errors);
    return;
  }

  const data = validation.data as UserCreateData;

  const selectedRoleIds = new Set(data.roles ?? []);
  const selectedRoles = roleOptions.value.filter((role) => selectedRoleIds.has(role.id));
  const hasManager = selectedRoles.some(
    (role) =>
      role.slug === "branch_manager" ||
      role.slug?.startsWith("filial-b") ||
      role.slug?.startsWith("setor-b")
  );
  const hasCollaborator = selectedRoles.some((role) => role.slug === "colaborador" || role.slug?.startsWith("colaborador-b"));
  if (hasManager && hasCollaborator) {
    errors.value = {
      ...errors.value,
      roles: "Não é permitido combinar perfis de Gerente de Filial com Colaborador no mesmo usuário.",
    };
    bumpSubmitAttempt();
    notifyError(errors.value.roles);
    return;
  }

  loading.value = true;
  usersApi
    .create({
      name: data.name,
      email: data.email,
      password: data.password,
      status: data.status,
      roles: data.roles.length ? data.roles : undefined,
      direct_permission_ids: data.direct_permission_ids?.length ? data.direct_permission_ids : undefined,
      company_ids: data.company_ids.length ? data.company_ids : undefined,
      branch_ids: data.branch_ids.length ? data.branch_ids : undefined,
      sector_ids: data.sector_ids?.length ? data.sector_ids : undefined,
    })
    .then(() => {
      notifySuccess("Usuário criado com sucesso.");
      router.push({ name: "owner.users" });
    })
    .catch(onApiError)
    .finally(() => (loading.value = false));
}

async function loadRoleOptions(companyIds: number[], branchIds: number[]) {
  if (branchIds.length === 1) {
    const res = await rolesApi.list({ branch_id: branchIds[0], per_page: 500 });
    return res.roles?.data ?? [];
  }
  if (branchIds.length > 1) {
    const res = await rolesApi.list({ branch_ids: branchIds, per_page: 500 });
    return res.roles?.data ?? [];
  }
  if (companyIds.length) {
    const res = await rolesApi.list({ company_ids: companyIds, per_page: 500 });
    return res.roles?.data ?? [];
  }
  const res = await rolesApi.list({ per_page: 500 });
  return res.roles?.data ?? [];
}

let roleRequestSeq = 0;

function formatRoleLabel(role: { name: string; branch?: { name?: string } | null }) {
  if (!role.branch?.name) return role.name;
  return `${role.name} (${role.branch.name})`;
}

async function ensureFixedBranchName(branchId: number) {
  const existing = branchOptions.value.find((b) => b.id === branchId);
  if (existing && !existing.name.startsWith("Filial #")) return;
  let branchName =
    authStore.activeContext?.branch_id === branchId
      ? authStore.activeContext?.branch_name
      : authStore.user?.branches?.find((b) => b.id === branchId)?.name;
  if (!branchName) {
    try {
      const res = await branchesApi.getById(branchId);
      branchName = res.branch?.name ?? `Filial #${branchId}`;
    } catch {
      branchName = `Filial #${branchId}`;
    }
  }
  if (existing) {
    branchOptions.value = branchOptions.value.map((b) =>
      b.id === branchId ? { ...b, name: branchName ?? b.name } : b
    );
  } else {
    const cid = Number(authStore.activeContext?.company_id ?? 0);
    branchOptions.value = [
      ...branchOptions.value,
      {
        id: branchId,
        company_id: cid > 0 ? cid : undefined,
        name: branchName,
        company_name: undefined,
      },
    ].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }
}

/** Ordem da filial na empresa (1 = 1.ª, 2 = 2.ª…) para sufixo do e-mail sintético (ex.: financeiro01). */
const branchOrderIndexForSyntheticEmail = computed(() => {
  const bid = fixedBranchId.value;
  if (!bid) return 1;
  const row = branchOptions.value.find((x) => x.id === bid);
  let cid = Number(row?.company_id ?? 0);
  if (!cid && form.value.company_ids?.length) cid = form.value.company_ids[0];
  if (!cid) return 1;
  const sameCompany = branchOptions.value
    .filter((x) => Number(x.company_id ?? 0) === cid)
    .sort((a, b) => a.id - b.id);
  const idx = sameCompany.findIndex((x) => x.id === bid);
  return idx >= 0 ? idx + 1 : 1;
});

onMounted(() => {
  Promise.all([usersApi.plucks(), permissionsApi.plucks().catch(() => [])]).then(async ([plucks, permissions]) => {
    isSuperadmin.value = authStore.hasRole("superadmin");
    permissionOptions.value = (permissions ?? []).map((p) => ({ id: p.id, name: p.name, slug: p.slug }));
    companyOptions.value = (plucks.companies ?? [])
      .map((c) => ({
        id: c.id,
        name: c.name ?? `Empresa #${c.id}`,
        internal_email_domain: c.internal_email_domain,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const companyMap = new Map((plucks.companies ?? []).map((c) => [c.id, c.name ?? `Empresa #${c.id}`]));
    const userCompanyIds = new Set((authStore.user?.companies ?? []).map((c) => c.id));
    const isGlobal = authStore.hasRole("superadmin") || authStore.hasRole("owner");
    branchOptions.value = (plucks.branches ?? [])
      .filter((b) => isGlobal || userCompanyIds.has(Number(b.company_id ?? 0)))
      .map((b) => ({
        id: b.id,
        company_id: b.company_id,
        name: b.name ?? `Filial #${b.id}`,
        company_name: companyMap.get(Number(b.company_id ?? 0)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (fixedBranchId.value) {
      await ensureFixedBranchName(fixedBranchId.value);
      form.value = { ...form.value, branch_ids: [fixedBranchId.value] };
    }

    if (!authStore.hasRole("superadmin") && authStore.activeContext?.company_id) {
      const cid = Number(authStore.activeContext.company_id);
      if (cid > 0) {
        try {
          const { companiesApi } = await import("@/api/resources");
          const res = await companiesApi.getById(cid);
          const c = res.company;
          const used = c?.users_used ?? c?.users?.length ?? 0;
          const limit = c?.user_limit ?? 0;
          if (limit > 0 && used >= limit) {
            notifyError("Limite de usuários atingido para esta empresa (inclui vínculos por filiais).");
            router.replace({ name: "owner.users" });
          }
        } catch {
          //
        }
      }
    }
  });
});

watch(
  [
    () => selectedCompanyIds.value,
    () => selectedBranchIds.value,
    () => isSuperadmin.value,
    () => filteredBranchOptions.value.map((b) => b.id),
  ],
  async ([companyIds, branchIds, superadmin, filteredBranchIds]) => {
    const requestSeq = ++roleRequestSeq;
    const roles = await loadRoleOptions(companyIds ?? [], branchIds ?? []);
    if (requestSeq !== roleRequestSeq) return;
    roleOptions.value = roles.map((role) => ({
      id: role.id,
      slug: role.slug,
      name: formatRoleLabel(role),
      permission_ids: (role.permissions ?? []).map((p) => p.id),
    }));

    const validRoleIds = new Set(roles.map((r) => r.id));
    const kept = (form.value.roles ?? []).filter((roleId) => validRoleIds.has(roleId));
    let nextRoles = kept;

    const companyId = companyIds?.length ? companyIds[0] : null;
    if (!nextRoles.length && companyId && !(branchIds?.length ?? 0) && superadmin) {
      const defaultRole = roles.find((r) => r.slug === `empresa-c${companyId}`) ?? roles.find((r) => r.name === "Empresa");
      if (defaultRole) nextRoles = [defaultRole.id];
    }

    const fixedId = fixedBranchId.value;
    const shouldNormalizeBranches = Boolean(superadmin) || (filteredBranchIds?.length ?? 0) > 0;
    const validBranchIds = new Set(filteredBranchIds ?? []);
    let nextBranchIds = shouldNormalizeBranches
      ? (form.value.branch_ids ?? []).filter((bid) => validBranchIds.has(bid))
      : (form.value.branch_ids ?? []);
    if (fixedId) nextBranchIds = [fixedId];

    if ((branchIds?.length ?? 0) > 0) {
      const plucks = await sectorsApi.plucks(
        branchIds.length === 1 ? { branch_id: branchIds[0] } : { branch_ids: branchIds }
      );
      sectorOptions.value = plucks;
    } else {
      sectorOptions.value = [];
    }

    const validSectorIds = new Set(sectorOptions.value.map((s) => s.id));
    const nextSectorIds = (form.value.sector_ids ?? []).filter((sid) => validSectorIds.has(sid));
    const nextCompanyIds = form.value.company_ids ?? [];
    form.value = { ...form.value, company_ids: nextCompanyIds, roles: nextRoles, branch_ids: nextBranchIds, sector_ids: nextSectorIds };
  },
  { immediate: true }
);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Novo usuário</h1>
          <p class="text-muted mb-0 small">Criar usuário e vincular perfis.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <UIComponentCard title="Dados do usuário">
        <b-form @submit.prevent="submit">
          <DataForm
            v-model="form"
            :errors="errors"
            :submit-attempt="submitAttempt"
            mode="create"
            :role-options="roleOptions"
            :permission-options="permissionOptions"
            :company-options="companyOptions"
            :branch-options="filteredBranchOptions"
            :sector-options="sectorOptions"
            :fixed-branch-id="fixedBranchId"
            :show-company-selector="showCompanySelector"
            :tenant-email-domain="resolvedTenantEmailDomain"
            :branch-order-index="branchOrderIndexForSyntheticEmail"
            @clear-error="clearError"
          />
          <b-row>
            <b-col class="d-flex gap-2">
              <b-button type="submit" variant="primary" :disabled="loading">
                {{ loading ? "Salvando..." : "Salvar" }}
              </b-button>
              <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
            </b-col>
          </b-row>
        </b-form>
      </UIComponentCard>
    </div>
  </DefaultLayout>
</template>
