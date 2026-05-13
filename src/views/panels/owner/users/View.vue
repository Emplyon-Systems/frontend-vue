<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ProfilePage from "./profile/index.vue";
import { rolesApi, usersApi } from "@/api/resources";
import { userInitialForm, type UserFormData } from "@/core/schemas";
import type { UserRecord } from "@/types/api";

type PermissionItem = {
  name: string;
  slug: string;
};

const route = useRoute();
const router = useRouter();
const userId = computed(() => Number(route.params.id));

const loadingUser = ref(true);
const loadError = ref("");
const form = ref<UserFormData>(userInitialForm("edit"));
const companyNames = ref<string[]>([]);
const branchNames = ref<string[]>([]);
const sectorNames = ref<string[]>([]);
const branches = ref<UserRecord["branches"]>([]);
const sectors = ref<UserRecord["sectors"]>([]);
const permissions = ref<PermissionItem[]>([]);
const directPermissions = ref<PermissionItem[]>([]);

const roleNames = ref<string[]>([]);
const primaryCompanyName = computed(() => companyNames.value[0] ?? "");

function back() {
  router.push({ name: "owner.users" });
}

function goEdit() {
  router.push({ name: "owner.users.edit", params: { id: String(userId.value) } });
}

function fillFormFromUser(data: Awaited<ReturnType<typeof usersApi.getById>>) {
  const user = data.user as UserRecord | undefined;
  if (!user) return;
  form.value = {
    name: user.name ?? "",
    email: user.email ?? "",
    status: (user.status === "inactive" ? "inactive" : "active"),
    password: undefined,
    roles: (user.roles ?? []).map((r) => r.id),
    direct_permission_ids: (user.permissions ?? []).map((p) => p.id),
    company_ids: (user.companies ?? []).map((c) => c.id),
    branch_ids: (user.branches ?? []).map((b) => b.id),
    sector_ids: (user.sectors ?? []).map((s) => s.id),
  };

  roleNames.value = (user.roles ?? []).map((r) => r.name).filter(Boolean);
  companyNames.value = (user.companies ?? []).map((c) => c.name).filter(Boolean) as string[];
  branchNames.value = (user.branches ?? []).map((b) => b.name).filter(Boolean) as string[];
  sectorNames.value = (user.sectors ?? []).map((s) => s.name).filter(Boolean);
  branches.value = user.branches ?? [];
  sectors.value = user.sectors ?? [];

  const map = new Map<string, PermissionItem>();
  for (const permission of (user.roles ?? []).flatMap((role) => role.permissions ?? [])) {
    if (!permission?.slug || !permission?.name) continue;
    map.set(permission.slug, { slug: permission.slug, name: permission.name });
  }
  directPermissions.value = (user.permissions ?? [])
    .filter((permission) => !!permission?.slug && !!permission?.name)
    .map((permission) => ({ slug: permission.slug, name: permission.name }));
  for (const permission of directPermissions.value) {
    map.set(permission.slug, { slug: permission.slug, name: permission.name });
  }
  permissions.value = [...map.values()];
}

async function hydratePermissionsByRoles(roleIds: number[]) {
  if (!roleIds.length) return;

  const roleResponses = await Promise.all(roleIds.map((id) => rolesApi.getById(id)));
  const map = new Map<string, PermissionItem>();
  for (const permission of roleResponses.flatMap((res) => res.role?.permissions ?? [])) {
    if (!permission?.slug || !permission?.name) continue;
    map.set(permission.slug, { slug: permission.slug, name: permission.name });
  }
  permissions.value = [...map.values()];
}

function loadUser() {
  loadError.value = "";
  loadingUser.value = true;

  if (Number.isNaN(userId.value)) {
    loadError.value = "Usuário inválido.";
    loadingUser.value = false;
    return;
  }

  usersApi
    .getById(userId.value)
    .then(async (userData) => {
      fillFormFromUser(userData);
      if (!permissions.value.length && form.value.roles.length) {
        await hydratePermissionsByRoles(form.value.roles);
      }
    })
    .catch(() => (loadError.value = "Usuário não encontrado."))
    .finally(() => (loadingUser.value = false));
}

onMounted(loadUser);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Visualizar usuário</h1>
          <p class="text-muted mb-0 small">Consulta dos dados do usuário.</p>
        </div>
        <b-button variant="outline-secondary" @click="back">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingUser" class="text-muted">Carregando usuário...</div>
      <ProfilePage
        v-else
        :name="form.name"
        :email="form.email"
        :role-names="roleNames"
        :company-names="companyNames"
        :branch-names="branchNames"
        :sector-names="sectorNames"
        :branches="branches"
        :sectors="sectors"
        :permissions="permissions"
        :direct-permissions="directPermissions"
        :subtitle="primaryCompanyName || form.email"
        :onEdit="goEdit"
      />
    </div>
  </DefaultLayout>
</template>
