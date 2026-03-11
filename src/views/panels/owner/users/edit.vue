<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import DataForm from "./form/DataForm.vue";
import { usersApi, rolesApi, sectorsApi, branchesApi } from "@/api/resources";
import { userInitialForm, validateUserForm, type UserFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const id = computed(() => Number(route.params.id));
const loading = ref(false);
const loadError = ref("");
const roleOptions = ref<{ id: number; name: string; slug?: string }[]>([]);
const companyOptions = ref<{ id: number; name: string }[]>([]);
const branchOptions = ref<{ id: number; company_id?: number; name: string; company_name?: string }[]>([]);
const sectorOptions = ref<{ id: number; branch_id: number; name: string; slug?: string }[]>([]);
const form = ref<UserFormData>(userInitialForm("edit"));
const userLoaded = ref(false);
const formReady = ref(false);
const userRolesRef = ref<{ id: number; name?: string; slug?: string }[]>([]);
const userSectorsRef = ref<{ id: number; branch_id?: number; name?: string }[]>([]);
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

function submit() {
  errors.value = {};
  const validation = validateUserForm(form.value, "edit");
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
  const payload = {
    name: validation.data.name,
    email: validation.data.email,
    roles: validation.data.roles.length ? validation.data.roles : undefined,
    company_ids: validation.data.company_ids.length ? validation.data.company_ids : undefined,
    branch_ids: validation.data.branch_ids.length ? validation.data.branch_ids : undefined,
    sector_ids: validation.data.sector_ids?.length ? validation.data.sector_ids : undefined,
  } as { name: string; email: string; roles?: number[]; company_ids?: number[]; branch_ids?: number[]; sector_ids?: number[]; password?: string };
  if (validation.data.password) payload.password = validation.data.password;

  usersApi
    .update(id.value, payload)
    .then(() => {
      notifySuccess("Utilizador atualizado com sucesso.");
      router.push({ name: "owner.users" });
    })
    .catch(mapApiErrors)
    .finally(() => (loading.value = false));
}

function cancel() {
  router.push({ name: "owner.users" });
}

async function loadRoleOptions(companyIds: number[], branchIds: number[]) {
  if (branchIds.length === 1) return rolesApi.plucks({ branch_id: branchIds[0] });
  if (branchIds.length > 1) return rolesApi.plucks({ branch_ids: branchIds });
  if (companyIds.length) return rolesApi.plucks({ company_ids: companyIds });
  return rolesApi.plucks();
}

let roleRequestSeq = 0;

function formatRoleLabel(role: { name: string; branch_name?: string | null }) {
  if (!role.branch_name) return role.name;
  return `${role.name} (${role.branch_name})`;
}

onMounted(() => {
  loadError.value = "";
  if (Number.isNaN(id.value)) {
    loadError.value = "Utilizador inválido.";
    return;
  }
  Promise.all([usersApi.plucks(), usersApi.getById(id.value)])
    .then(async ([plucks, userData]) => {
      const u = userData.user;
      if (!u) {
        loadError.value = "Utilizador não encontrado.";
        return;
      }
      isSuperadmin.value = authStore.hasRole("superadmin");
      companyOptions.value = (plucks.companies ?? [])
        .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
        .sort((a, b) => a.name.localeCompare(b.name));
      const companyMap = new Map((plucks.companies ?? []).map((c) => [c.id, c.name ?? `Empresa #${c.id}`]));
      const userCompanyIds = new Set((authStore.user?.companies ?? []).map((c) => c.id));
      const isGlobal = authStore.hasRole("superadmin") || authStore.hasRole("owner");
      const fromPlucks = (plucks.branches ?? [])
        .filter((b) => isGlobal || userCompanyIds.has(Number(b.company_id ?? 0)))
        .map((b) => ({
          id: b.id,
          company_id: b.company_id,
          name: b.name ?? `Filial #${b.id}`,
          company_name: companyMap.get(Number(b.company_id ?? 0)),
        }));
      const existingIds = new Set(fromPlucks.map((b) => b.id));
      const fromUser = (u.branches ?? [])
        .filter((b) => !existingIds.has(b.id))
        .map((b) => {
          const cid = b.company_id ?? (b.company as { id?: number })?.id;
          return {
            id: b.id,
            company_id: cid,
            name: b.name ?? `Filial #${b.id}`,
            company_name: companyMap.get(Number(cid ?? 0)) ?? (b.company as { name?: string })?.name,
          };
        });
      branchOptions.value = [...fromPlucks, ...fromUser].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "")
      );

      if (fixedBranchId.value) {
        const existing = branchOptions.value.find((b) => b.id === fixedBranchId.value);
        const needsName = !existing || existing.name.startsWith("Filial #");
        if (needsName) {
          let branchName =
            authStore.activeContext?.branch_id === fixedBranchId.value
              ? authStore.activeContext?.branch_name
              : authStore.user?.branches?.find((b) => b.id === fixedBranchId.value)?.name;
          if (!branchName) {
            try {
              const res = await branchesApi.getById(fixedBranchId.value);
              branchName = res.branch?.name ?? `Filial #${fixedBranchId.value}`;
            } catch {
              branchName = `Filial #${fixedBranchId.value}`;
            }
          }
          if (existing) {
            branchOptions.value = branchOptions.value.map((b) =>
              b.id === fixedBranchId.value ? { ...b, name: branchName ?? b.name } : b
            );
          } else {
            branchOptions.value = [
              ...branchOptions.value,
              { id: fixedBranchId.value, company_id: undefined, name: branchName, company_name: undefined },
            ].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
          }
        }
      }

      const branchIds = fixedBranchId.value ? [fixedBranchId.value] : (u.branches ?? []).map((b) => b.id);
      userRolesRef.value = (u.roles ?? []).map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
      userSectorsRef.value = (u.sectors ?? []).map((s) => ({
        id: s.id,
        branch_id: s.branch?.id ?? 0,
        name: s.name,
      }));
      form.value = {
        name: u.name ?? "",
        email: u.email ?? "",
        password: undefined,
        roles: userRolesRef.value.map((r) => r.id),
        company_ids: (u.companies ?? []).map((c) => c.id),
        branch_ids: branchIds,
        sector_ids: (u.sectors ?? []).map((s) => s.id),
      };
      userLoaded.value = true;
    })
    .catch(() => (loadError.value = "Utilizador não encontrado."));
});

watch(
  [
    () => selectedCompanyIds.value,
    () => selectedBranchIds.value,
    () => isSuperadmin.value,
    () => filteredBranchOptions.value.map((b) => b.id),
    () => userLoaded.value,
  ],
  async ([companyIds, branchIds, superadmin, filteredBranchIds]) => {
    const requestSeq = ++roleRequestSeq;
    const roles = await loadRoleOptions(companyIds ?? [], branchIds ?? []);
    if (requestSeq !== roleRequestSeq) return;
    const fromApi = roles.map((role) => ({
      id: role.id,
      slug: role.slug,
      name: formatRoleLabel(role),
    }));
    const existingRoleIds = new Set(fromApi.map((r) => r.id));
    const fromUser = userLoaded.value
      ? (form.value.roles ?? [])
          .filter((rid) => !existingRoleIds.has(rid))
          .map((rid) => {
            const ur = userRolesRef.value.find((r) => r.id === rid);
            return { id: rid, name: ur?.name ?? `Perfil #${rid}`, slug: ur?.slug ?? "" };
          })
      : [];
    roleOptions.value = fromUser.length ? [...fromApi, ...fromUser] : fromApi;

    const validRoleIds = new Set(roleOptions.value.map((r) => r.id));
    const kept = (form.value.roles ?? []).filter((roleId) => validRoleIds.has(roleId));
    const shouldNormalizeBranches = userLoaded.value && (Boolean(superadmin) || (filteredBranchIds?.length ?? 0) > 0);
    const validBranchIds = new Set(filteredBranchIds ?? []);
    let nextBranchIds = (form.value.branch_ids ?? []);
    if (shouldNormalizeBranches) {
      nextBranchIds = nextBranchIds.filter((bid) => validBranchIds.has(bid));
    }
    if (fixedBranchId.value) nextBranchIds = [fixedBranchId.value];

    if ((branchIds?.length ?? 0) > 0) {
      const plucks = await sectorsApi.plucks(
        branchIds.length === 1 ? { branch_id: branchIds[0] } : { branch_ids: branchIds }
      );
      const fromApi = plucks;
      const existingSectorIds = new Set(fromApi.map((s) => s.id));
      const fromUserSectors = form.value.sector_ids ?? [];
      const fromUser = userLoaded.value
        ? fromUserSectors
            .filter((sid) => !existingSectorIds.has(sid))
            .map((sid) => {
              const us = userSectorsRef.value.find((s) => s.id === sid);
              return {
                id: sid,
                branch_id: us?.branch_id ?? 0,
                name: us?.name ?? `Setor #${sid}`,
                slug: undefined,
              };
            })
        : [];
      sectorOptions.value = fromUser.length ? [...fromApi, ...fromUser] : fromApi;
    } else if (userLoaded.value) {
      sectorOptions.value = [];
    }

    const validSectorIds = new Set(sectorOptions.value.map((s) => s.id));
    const nextSectorIds = (form.value.sector_ids ?? []).filter((sid) => validSectorIds.has(sid));
    const nextCompanyIds = form.value.company_ids ?? [];
    form.value = { ...form.value, company_ids: nextCompanyIds, roles: kept, branch_ids: nextBranchIds, sector_ids: nextSectorIds };
    if (userLoaded.value) formReady.value = true;
  },
  { immediate: true }
);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar utilizador</h1>
          <p class="text-muted mb-0 small">Alterar dados e perfis do utilizador.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>

      <UIComponentCard v-else title="Dados do utilizador">
        <b-form @submit.prevent="submit">
          <div v-if="!formReady" class="py-4 text-center text-muted">
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            A carregar dados do utilizador...
          </div>
          <DataForm
            v-else
            :key="id"
            v-model="form"
            :errors="errors"
            mode="edit"
            :role-options="roleOptions"
            :company-options="companyOptions"
            :branch-options="filteredBranchOptions"
            :sector-options="sectorOptions"
            :fixed-branch-id="fixedBranchId"
            :show-company-selector="isSuperadmin"
            @clear-error="clearError"
          />
          <b-row v-if="formReady">
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
