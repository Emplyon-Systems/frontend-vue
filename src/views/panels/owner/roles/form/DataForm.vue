<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import AppAlert from "@/components/AppAlert.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import { rolesApi, permissionsApi } from "@/api/resources";
import { roleInitialForm, validateRoleForm, type RoleFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const props = defineProps<{
  roleId: number | null;
}>();

const router = useRouter();
const authStore = useAuthStore();
const isEdit = computed(() => props.roleId !== null);

/** Slug carregado na edição (para detetar perfil de sistema); o backend gera o slug na criação. */
const loadedRoleSlug = ref("");
/** Perfil criado automaticamente pela filial (filial-b{id}). */
const isSystemBranchRole = computed(() => (loadedRoleSlug.value ?? "").startsWith("filial-b"));
/** Empresa (contexto empresa) ou superadmin podem editar perfis das filiais. */
const isCompanyContext = computed(
  () => !!authStore.activeContext?.company_id && authStore.activeContext?.branch_id == null
);
/** Usuário tem opção de contexto empresa (pode editar Gerente Filial mesmo em filial). */
const hasCompanyLevelAccess = computed(() =>
  authStore.getContextOptions().some((o) => o.branch_id == null)
);
const isSuperadmin = computed(() => authStore.hasRole("superadmin"));
/** Bloqueado só quando é perfil-filial e o usuário não é empresa nem superadmin. */
const isRoleLocked = computed(
  () =>
    isSystemBranchRole.value &&
    !isCompanyContext.value &&
    !isSuperadmin.value &&
    !hasCompanyLevelAccess.value
);
const loading = ref(false);
const loadError = ref("");
const permissionOptions = ref<{ id: number; name: string; slug: string }[]>([]);
const form = ref<RoleFormData>(roleInitialForm());
const errors = ref<Record<string, string>>({});
const permissionSearch = ref("");
const moduleOpenState = ref<Record<string, boolean>>({});
const permissionModuleLabels: Record<string, string> = {
  audits: "Auditoria",
  branches: "Filiais",
  companies: "Empresas",
  employees: "Funcionários",
  modality_types: "Modalidades",
  permissions: "Permissões",
  scale_types: "Tipos de escala",
  roles: "Perfis",
  sectors: "Setores",
  shifts: "Turnos",
  users: "Usuários",
};

function getPermissionModuleLabel(moduleName: string): string {
  return permissionModuleLabels[moduleName] ?? moduleName;
}

const groupedPermissions = computed(() => {
  const term = permissionSearch.value.trim().toLowerCase();
  const groups = new Map<string, { id: number; label: string }[]>();
  const selected = new Set(form.value.permissions);

  for (const permission of permissionOptions.value) {
    const moduleName = permission.slug?.split(".")?.[0] || "geral";
    const label = `${permission.name} (${permission.slug})`;
    if (term && !label.toLowerCase().includes(term)) continue;

    if (!groups.has(moduleName)) groups.set(moduleName, []);
    groups.get(moduleName)!.push({ id: permission.id, label });
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([moduleName, options]) => {
      const sorted = options.sort((a, b) => a.label.localeCompare(b.label));
      const selectedCount = sorted.filter((option) => selected.has(option.id)).length;
      return {
        moduleName,
        moduleLabel: getPermissionModuleLabel(moduleName),
        options: sorted,
        total: sorted.length,
        selected: selectedCount,
      };
    });
});

const totalVisiblePermissions = computed(() =>
  groupedPermissions.value.reduce((sum, group) => sum + group.total, 0)
);
const totalVisibleSelectedPermissions = computed(() =>
  groupedPermissions.value.reduce((sum, group) => sum + group.selected, 0)
);

function isPermissionSelected(permissionId: number): boolean {
  return (form.value.permissions ?? []).includes(permissionId);
}

function togglePermission(permissionId: number, checked: boolean) {
  const current = new Set(form.value.permissions);
  if (checked) current.add(permissionId);
  else current.delete(permissionId);
  form.value.permissions = [...current];
  errors.value.permissions = "";
}

function toggleModule(moduleName: string, checked: boolean) {
  const target = groupedPermissions.value.find((group) => group.moduleName === moduleName);
  if (!target) return;

  const current = new Set(form.value.permissions);
  for (const permission of target.options) {
    if (checked) current.add(permission.id);
    else current.delete(permission.id);
  }

  form.value.permissions = [...current];
  errors.value.permissions = "";
}

function toggleAllVisible(checked: boolean) {
  const current = new Set(form.value.permissions);
  for (const group of groupedPermissions.value) {
    for (const permission of group.options) {
      if (checked) current.add(permission.id);
      else current.delete(permission.id);
    }
  }
  form.value.permissions = [...current];
  errors.value.permissions = "";
}

function onModuleToggle(moduleName: string, event: Event) {
  const element = event.target;
  if (!(element instanceof HTMLDetailsElement)) return;
  moduleOpenState.value[moduleName] = element.open;
}

function loadRole() {
  if (props.roleId == null) {
    loadedRoleSlug.value = "";
    return Promise.resolve();
  }
  loadError.value = "";
  return rolesApi
    .getById(props.roleId)
    .then((data) => {
      const r = data.role;
      if (!r) return;
      loadedRoleSlug.value = r.slug ?? "";
      form.value = {
        name: r.name ?? "",
        description: r.description ?? "",
        permissions: (r.permissions ?? []).map((p) => p.id),
      };
    })
    .catch(() => (loadError.value = "Perfil não encontrado."));
}

function submit() {
  errors.value = {};
  const validation = validateRoleForm(form.value);
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  const payload = {
    name: validation.data.name,
    description: validation.data.description || undefined,
    permissions: validation.data.permissions.length ? validation.data.permissions : undefined,
  };

  const promise = isEdit.value
    ? rolesApi.update(props.roleId!, { ...payload, permissions: validation.data.permissions })
    : rolesApi.create(payload);

  promise
    .then(() => {
      notifySuccess(
        isEdit.value ? "Perfil atualizado com sucesso." : "Perfil criado com sucesso."
      );
      router.push({ name: "owner.roles" });
    })
    .catch((err: { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      const data = err.response?.data?.errors;
      if (data) {
        const map: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) map[k] = Array.isArray(v) ? v[0] : String(v);
        errors.value = map;
      }
    })
    .finally(() => (loading.value = false));
}

function cancel() {
  router.push({ name: "owner.roles" });
}

onMounted(async () => {
  const opts = await permissionsApi.plucks();
  permissionOptions.value = opts;
  await loadRole();
});

watch(
  () => props.roleId,
  async () => {
    await loadRole();
  }
);
</script>

<template>
  <div>
    <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>

    <UIComponentCard v-else title="Dados do perfil">
      <AppAlert v-if="isRoleLocked" variant="info" class="mb-3">
        Este perfil é gerido automaticamente pela filial e não pode ser editado nem eliminado.
      </AppAlert>
      <b-form @submit.prevent="submit">
        <b-row class="g-3 role-profile-fields-row">
          <b-col cols="12" md="auto" class="role-profile-name-col">
            <b-form-group label="Nome" label-for="name" class="mb-3 mb-md-0">
              <b-form-input
                id="name"
                v-model="form.name"
                type="text"
                placeholder="Ex: Administrador"
                :readonly="isRoleLocked"
                :state="errors.name ? false : null"
              />
              <b-form-invalid-feedback v-if="errors.name">{{ errors.name }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="12" md="auto" class="role-profile-desc-col">
            <b-form-group label="Descrição" label-for="description" class="mb-3 mb-md-0">
              <b-form-input
                id="description"
                v-model="form.description"
                type="text"
                placeholder="Descrição opcional"
                :readonly="isRoleLocked"
              />
            </b-form-group>
          </b-col>
        </b-row>
        <b-row class="mt-4">
          <b-col>
            <b-form-group label="Permissões" label-for="permissions-select" class="mb-3">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <b-form-input
                  v-model="permissionSearch"
                  type="text"
                  placeholder="Pesquisar permissões..."
                  style="max-width: 360px;"
                />
                <b-form-checkbox
                  :model-value="totalVisiblePermissions > 0 && totalVisibleSelectedPermissions === totalVisiblePermissions"
                  :disabled="isRoleLocked"
                  @update:model-value="toggleAllVisible(Boolean($event))"
                >
                  Selecionar todas visíveis
                </b-form-checkbox>
              </div>

              <div v-if="groupedPermissions.length" class="border rounded">
                <details
                  v-for="group in groupedPermissions"
                  :key="group.moduleName"
                  :open="moduleOpenState[group.moduleName] ?? group.selected > 0"
                  class="border-bottom"
                  @toggle="onModuleToggle(group.moduleName, $event)"
                >
                  <summary class="d-flex align-items-center justify-content-between px-3 py-2 cursor-pointer">
                    <strong>{{ group.moduleLabel }}</strong>
                    <span class="badge bg-light text-dark border">{{ group.selected }}/{{ group.total }}</span>
                  </summary>
                  <div class="px-3 pb-3">
                    <b-form-checkbox
                      class="mb-2"
                      :model-value="group.selected > 0 && group.selected === group.total"
                      :disabled="isRoleLocked"
                      @update:model-value="toggleModule(group.moduleName, Boolean($event))"
                    >
                      Marcar todo módulo
                    </b-form-checkbox>
                    <b-row>
                      <b-col
                        v-for="permission in group.options"
                        :key="permission.id"
                        cols="12"
                        md="6"
                        lg="4"
                        class="mb-1"
                      >
                        <b-form-checkbox
                          :model-value="isPermissionSelected(permission.id)"
                          :disabled="isRoleLocked"
                          @update:model-value="togglePermission(permission.id, Boolean($event))"
                        >
                          {{ permission.label }}
                        </b-form-checkbox>
                      </b-col>
                    </b-row>
                  </div>
                </details>
              </div>
              <p v-else class="text-muted mb-0">Nenhuma permissão encontrada com esse filtro.</p>

              <b-form-invalid-feedback v-if="errors.permissions" class="d-block">
                {{ errors.permissions }}
              </b-form-invalid-feedback>
              <small class="text-muted">
                Selecione permissões por módulo em dropdown.
              </small>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col class="d-flex gap-2">
            <b-button v-if="!isRoleLocked" type="submit" variant="primary" :disabled="loading">
              {{ loading ? "A guardar..." : "Guardar" }}
            </b-button>
            <b-button type="button" variant="outline-secondary" @click="cancel">
              {{ isRoleLocked ? "Voltar" : "Cancelar" }}
            </b-button>
          </b-col>
        </b-row>
      </b-form>
    </UIComponentCard>
  </div>
</template>

<style scoped>
@media (min-width: 768px) {
  .role-profile-fields-row {
    flex-wrap: nowrap;
  }
  .role-profile-desc-col {
    flex: 0 0 60%;
    max-width: 60%;
  }
  .role-profile-name-col {
    flex: 0 0 40%;
    max-width: 40%;
  }
}
</style>
