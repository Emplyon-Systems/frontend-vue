<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ProfilePage from "@/views/panels/owner/users/profile/index.vue";
import { rolesApi, usersApi } from "@/api/resources";
import { userInitialForm, type UserFormData } from "@/core/schemas";
import type { UserRecord } from "@/types/api";
import { useAuthStore } from "@/stores/auth";

type PermissionItem = { name: string; slug: string };

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const profileRouteNames = computed(() => {
  const name = String(route.name ?? "");
  if (name.startsWith("company.")) return { view: "company.my-profile.view", edit: "company.my-profile.edit", back: "panels.company.dashboard" };
  if (name.startsWith("branch.")) return { view: "branch.my-profile.view", edit: "branch.my-profile.edit", back: "panels.branch.dashboard" };
  if (name.startsWith("employee.")) return { view: "employee.my-profile.view", edit: "employee.my-profile.edit", back: "panels.employee.dashboard" };
  return { view: "owner.my-profile.view", edit: "owner.my-profile.edit", back: "panels.owner.dashboard" };
});
const userId = computed(() => Number(authStore.user?.id ?? 0));

const loadingUser = ref(true);
const loadError = ref("");
const form = ref<UserFormData>(userInitialForm("edit"));
const companyNames = ref<string[]>([]);
const branchNames = ref<string[]>([]);
const sectorNames = ref<string[]>([]);
const branches = ref<UserRecord["branches"]>([]);
const sectors = ref<UserRecord["sectors"]>([]);
const permissions = ref<PermissionItem[]>([]);
const roleNames = ref<string[]>([]);
const primaryCompanyName = computed(() => companyNames.value[0] ?? "");

function back() {
  router.push({ name: profileRouteNames.value.back });
}

function goEdit() {
  router.push({ name: profileRouteNames.value.edit });
}

function fillFormFromUser(data: Awaited<ReturnType<typeof usersApi.getById>>) {
  const user = data.user as UserRecord | undefined;
  if (!user) return;
  form.value = {
    name: user.name ?? "",
    email: user.email ?? "",
    password: undefined,
    roles: (user.roles ?? []).map((r) => r.id),
    company_ids: (user.companies ?? []).map((c) => c.id),
    branch_ids: (user.branches ?? []).map((b) => b.id),
  };
  roleNames.value = (user.roles ?? []).map((r) => r.name).filter(Boolean);
  companyNames.value = (user.companies ?? []).map((c) => c.name).filter(Boolean) as string[];
  branchNames.value = (user.branches ?? []).map((b) => b.name).filter(Boolean) as string[];
  sectorNames.value = (user.sectors ?? []).map((s) => s.name).filter(Boolean) as string[];
  branches.value = user.branches ?? [];
  sectors.value = user.sectors ?? [];

  const map = new Map<string, PermissionItem>();
  for (const permission of (user.roles ?? []).flatMap((role) => role.permissions ?? [])) {
    if (!permission?.slug || !permission?.name) continue;
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
  if (!userId.value) {
    loadError.value = "Utilizador não identificado.";
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
    .catch(() => (loadError.value = "Não foi possível carregar o seu perfil."))
    .finally(() => (loadingUser.value = false));
}

onMounted(loadUser);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Meu perfil</h1>
          <p class="text-muted mb-0 small">Consulta dos seus dados de acesso.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingUser" class="text-muted">A carregar perfil...</div>
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
        :subtitle="primaryCompanyName || form.email"
        :onEdit="goEdit"
      />
    </div>
  </DefaultLayout>
</template>
