<template>
  <b-col cols="12">
    <b-card no-body class="h-100">
      <b-card-header class="pb-2">
        <b-card-title class="mb-1">Permissões efetivas</b-card-title>
        <p class="text-muted mb-0 small">Permissões herdadas do perfil e permissões individuais do utilizador.</p>
      </b-card-header>
      <b-card-body>
        <div class="mb-3">
          <h6 class="mb-1">Permissões individuais</h6>
          <div v-if="directPermissions.length" class="d-flex flex-wrap gap-1">
            <b-badge
              v-for="permission in directPermissions"
              :key="permission.slug"
              variant="primary"
              class="fw-normal"
            >
              {{ permission.name }}
            </b-badge>
          </div>
          <p v-else class="text-muted mb-0 small">Sem permissões individuais atribuídas.</p>
        </div>

        <hr class="my-3" />
        <h6 class="mb-2">Permissões por perfil</h6>
        <div v-if="groupedPermissions.length" class="border rounded">
          <details
            v-for="group in groupedPermissions"
            :key="group.moduleName"
            :open="isGroupOpen(group.moduleName)"
            class="border-bottom"
            @toggle="onGroupToggle(group.moduleName, $event)"
          >
            <summary class="d-flex align-items-center justify-content-between px-3 py-2 cursor-pointer user-select-none">
              <strong>{{ group.moduleLabel }}</strong>
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-light text-dark border">{{ group.permissions.length }}</span>
                <i
                  class="iconoir-nav-arrow-down"
                  :style="{
                    transform: isGroupOpen(group.moduleName) ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }"
                ></i>
              </div>
            </summary>
            <div class="px-3 pb-3">
              <b-row>
                <b-col
                  v-for="permission in group.permissions"
                  :key="permission.slug"
                  cols="12"
                  md="6"
                  lg="4"
                  class="mb-2"
                >
                  <div class="border rounded px-2 py-1 h-100">
                    <p class="mb-0 fw-medium">{{ permission.name }}</p>
                    <small class="text-muted">{{ permission.slug }}</small>
                  </div>
                </b-col>
              </b-row>
            </div>
          </details>
        </div>
        <p v-else class="text-muted mb-0">Nenhuma permissão encontrada para este utilizador.</p>
      </b-card-body>
    </b-card>
  </b-col>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

type PermissionItem = { name: string; slug: string };

const permissionModuleLabels: Record<string, string> = {
  audits: "Auditoria",
  branches: "Filiais",
  companies: "Empresas",
  modality_types: "Modalidades",
  permissions: "Permissões",
  scale_types: "Tipos de escala",
  roles: "Perfis",
  sectors: "Setores",
  shifts: "Turnos",
  users: "Usuários",
};

function getModuleLabel(moduleName: string): string {
  return permissionModuleLabels[moduleName] ?? moduleName;
}

const props = withDefaults(
  defineProps<{
    permissions?: PermissionItem[];
    directPermissions?: PermissionItem[];
  }>(),
  {
    permissions: () => [],
    directPermissions: () => [],
  }
);
const groupOpenState = ref<Record<string, boolean>>({});

function isGroupOpen(moduleName: string): boolean {
  return groupOpenState.value[moduleName] ?? false;
}

function onGroupToggle(moduleName: string, event: Event): void {
  const element = event.target;
  if (!(element instanceof HTMLDetailsElement)) return;
  groupOpenState.value[moduleName] = element.open;
}

const groupedPermissions = computed(() => {
  const directSlugs = new Set((props.directPermissions ?? []).map((p) => p.slug));
  const groups = new Map<string, PermissionItem[]>();
  for (const permission of props.permissions) {
    if (directSlugs.has(permission.slug)) continue;
    const moduleName = permission.slug?.split(".")?.[0] || "geral";
    if (!groups.has(moduleName)) groups.set(moduleName, []);
    groups.get(moduleName)!.push(permission);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => getModuleLabel(a).localeCompare(getModuleLabel(b)))
    .map(([moduleName, permissions]) => ({
      moduleName,
      moduleLabel: getModuleLabel(moduleName),
      permissions: [...permissions].sort((a, b) => a.name.localeCompare(b.name)),
    }));
});
</script>
