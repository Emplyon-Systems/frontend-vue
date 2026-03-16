<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import DataForm from "./form/DataForm.vue";
import { usersApi, rolesApi, sectorsApi, branchesApi, permissionsApi } from "@/api/resources";
import { userInitialForm, validateUserForm, type UserFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const roleOptions = ref<{ id: number; name: string; slug?: string; permission_ids?: number[] }[]>([]);
const permissionOptions = ref<{ id: number; name: string; slug?: string }[]>([]);
const companyOptions = ref<{ id: number; name: string }[]>([]);
const branchOptions = ref<{ id: number; company_id?: number; name: string; company_name?: string }[]>([]);
const sectorOptions = ref<{ id: number; branch_id: number; name: string; slug?: string }[]>([]);
const form = ref<UserFormData>(userInitialForm("create"));
const errors = ref<Record<string, string>>({});
const isSuperadmin = ref(false);
/** Em contexto filial, a filial vem fixa (pré-selecionada e bloqueada). */
const fixedBranchId = computed(() => authStore.activeContext?.branch_id ?? null);
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

function mapApiErrors(err: { response?: { data?: { errors?: Record<string, string[]> } } }) {
  const data = err.response?.data?.errors;
  if (!data) return;
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) map[k] = Array.isArray(v) ? v[0] : String(v);
  errors.value = map;
}

function clearError(field: string) {
  if (!errors.value[field]) return;
  const next = { ...errors.value };
  delete next[field];
  errors.value = next;
}

function cancel() {
  router.push({ name: "owner.users" });
}

function submit() {
  errors.value = {};
  const validation = validateUserForm(form.value, "create");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  const selectedRoleIds = new Set(validation.data.roles ?? []);
  const selectedRoles = roleOptions.value.filter((role) => selectedRoleIds.has(role.id));
  const hasManager = selectedRoles.some((role) => role.slug === "branch_manager" || role.slug?.startsWith("filial-b"));
  const hasCollaborator = selectedRoles.some((role) => role.slug === "colaborador" || role.slug?.startsWith("colaborador-b"));
  if (hasManager && hasCollaborator) {
    errors.value = {
      ...errors.value,
      roles: "Não é permitido combinar perfis de Gerente de Filial com Colaborador no mesmo utilizador.",
    };
    return;
  }

  loading.value = true;
  usersApi
    .create({
      name: validation.data.name,
      email: validation.data.email,
      password: validation.data.password,
      status: validation.data.status,
      roles: validation.data.roles.length ? validation.data.roles : undefined,
      direct_permission_ids: validation.data.direct_permission_ids?.length ? validation.data.direct_permission_ids : undefined,
      company_ids: validation.data.company_ids.length ? validation.data.company_ids : undefined,
      branch_ids: validation.data.branch_ids.length ? validation.data.branch_ids : undefined,
      sector_ids: validation.data.sector_ids?.length ? validation.data.sector_ids : undefined,
    })
    .then(() => {
      notifySuccess("Utilizador criado com sucesso.");
      router.push({ name: "owner.users" });
    })
    .catch(mapApiErrors)
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
    branchOptions.value = [...branchOptions.value, { id: branchId, company_id: undefined, name: branchName, company_name: undefined }].sort(
      (a, b) => (a.name ?? "").localeCompare(b.name ?? "")
    );
  }
}

onMounted(() => {
  Promise.all([usersApi.plucks(), permissionsApi.plucks().catch(() => [])]).then(async ([plucks, permissions]) => {
    isSuperadmin.value = authStore.hasRole("superadmin");
    permissionOptions.value = (permissions ?? []).map((p) => ({ id: p.id, name: p.name, slug: p.slug }));
    companyOptions.value = (plucks.companies ?? [])
      .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
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
          <h1 class="h4 mb-1">Novo utilizador</h1>
          <p class="text-muted mb-0 small">Criar utilizador e vincular perfis.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <UIComponentCard title="Dados do utilizador">
        <b-form @submit.prevent="submit">
          <DataForm
            v-model="form"
            :errors="errors"
            mode="create"
            :role-options="roleOptions"
            :permission-options="permissionOptions"
            :company-options="companyOptions"
            :branch-options="filteredBranchOptions"
            :sector-options="sectorOptions"
            :fixed-branch-id="fixedBranchId"
            :show-company-selector="isSuperadmin"
            @clear-error="clearError"
          />
          <b-row>
            <b-col class="d-flex gap-2">
              <b-button type="submit" variant="primary" :disabled="loading">
                {{ loading ? "A guardar..." : "Guardar" }}
              </b-button>
              <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
            </b-col>
          </b-row>
        </b-form>
      </UIComponentCard>
    </div>
  </DefaultLayout>
</template>
