<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import AppAlert from "@/components/AppAlert.vue";
import { permissionsApi, roleTemplatesApi } from "@/api/resources";
import { notifySuccess, notifyError } from "@/helpers/notify";

const router = useRouter();

const loading = ref(false);
const loadingPerms = ref(true);
const name = ref("");
const description = ref("");
const provisionScope = ref<"branch" | "company">("branch");
const assignsCompanyOwner = ref(false);
const permissionOptions = ref<{ id: number; name: string; slug: string }[]>([]);
const selectedPermissionIds = ref<number[]>([]);
const permissionSearch = ref("");
const fieldErrors = ref<Record<string, string>>({});

const descriptionHint = computed(() =>
  provisionScope.value === "branch"
    ? "Opcional. Pode usar {branch_name} na descrição."
    : "Opcional. Pode usar {company_name} na descrição."
);

const permissionModuleLabels: Record<string, string> = {
  audits: "Auditoria",
  branches: "Filiais",
  companies: "Empresas",
  employees: "Funcionários",
  modality_types: "Modalidades",
  permissions: "Permissões",
  role_templates: "Templates de perfil",
  scale_types: "Tipos de escala",
  roles: "Perfis",
  sectors: "Setores",
  shifts: "Turnos",
  users: "Usuários",
};

const groupedPermissions = computed(() => {
  const term = permissionSearch.value.trim().toLowerCase();
  const groups = new Map<string, { id: number; label: string }[]>();
  const selected = new Set(selectedPermissionIds.value);

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
      const selectedCount = sorted.filter((o) => selected.has(o.id)).length;
      return {
        moduleName,
        moduleLabel: permissionModuleLabels[moduleName] ?? moduleName,
        options: sorted,
        total: sorted.length,
        selected: selectedCount,
      };
    });
});

const totalVisible = computed(() =>
  groupedPermissions.value.reduce((s, g) => s + g.total, 0)
);
const totalSelectedVisible = computed(() =>
  groupedPermissions.value.reduce((s, g) => s + g.selected, 0)
);

function isSelected(id: number) {
  return selectedPermissionIds.value.includes(id);
}

function togglePermission(id: number, checked: boolean) {
  const s = new Set(selectedPermissionIds.value);
  if (checked) s.add(id);
  else s.delete(id);
  selectedPermissionIds.value = [...s];
}

function toggleModule(moduleName: string, checked: boolean) {
  const g = groupedPermissions.value.find((x) => x.moduleName === moduleName);
  if (!g) return;
  const s = new Set(selectedPermissionIds.value);
  for (const o of g.options) {
    if (checked) s.add(o.id);
    else s.delete(o.id);
  }
  selectedPermissionIds.value = [...s];
}

function toggleAllVisible(checked: boolean) {
  const s = new Set(selectedPermissionIds.value);
  for (const g of groupedPermissions.value) {
    for (const o of g.options) {
      if (checked) s.add(o.id);
      else s.delete(o.id);
    }
  }
  selectedPermissionIds.value = [...s];
}

function mapApiErrors(err: unknown) {
  const e = err as { response?: { data?: { errors?: Record<string, string[]> } } };
  const raw = e.response?.data?.errors;
  if (!raw) return;
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    next[k] = Array.isArray(v) ? v[0] : String(v);
  }
  fieldErrors.value = next;
}

function submit() {
  fieldErrors.value = {};
  loading.value = true;
  roleTemplatesApi
    .create({
      name: name.value.trim(),
      description: description.value.trim() || null,
      provision_scope: provisionScope.value,
      auto_provision: true,
      assigns_company_owner:
        provisionScope.value === "company" ? assignsCompanyOwner.value : undefined,
      permissions: selectedPermissionIds.value,
    })
    .then(() => {
      notifySuccess("Template criado.");
      router.push({ name: "owner.role-templates" });
    })
    .catch((err: unknown) => {
      mapApiErrors(err);
      notifyError("Não foi possível criar o template. Verifique os campos.");
    })
    .finally(() => {
      loading.value = false;
    });
}

function cancel() {
  router.push({ name: "owner.role-templates" });
}

onMounted(async () => {
  const opts = await permissionsApi.plucks();
  permissionOptions.value = opts;
  loadingPerms.value = false;
});
</script>

<template>
  <DefaultLayout>
    <UIComponentCard title="Novo template de perfil">
      <p class="text-muted small mb-3">
        A chave e o prefixo do slug são gerados no servidor a partir do nome. Escolha se o perfil se aplica a
        <strong>cada filial</strong> nova ou a <strong>cada empresa</strong> nova.
      </p>

      <b-form v-if="!loadingPerms" @submit.prevent="submit">
        <b-row class="g-3">
          <b-col cols="12">
            <b-form-group label="Nome do perfil" label-for="rt-name">
              <b-form-input
                id="rt-name"
                v-model="name"
                type="text"
                required
                placeholder="Ex.: Receção, Gestor de loja…"
                :state="fieldErrors.name ? false : null"
              />
              <b-form-invalid-feedback v-if="fieldErrors.name">{{ fieldErrors.name }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="12" md="6">
            <b-form-group label="Aplica-se a" label-for="rt-scope-rg">
              <b-form-radio-group id="rt-scope-rg" v-model="provisionScope" stacked class="mb-0">
                <b-form-radio value="branch">Filial (repete em cada nova filial)</b-form-radio>
                <b-form-radio value="company">Empresa (repete em cada nova empresa)</b-form-radio>
              </b-form-radio-group>
            </b-form-group>
          </b-col>
          <b-col v-if="provisionScope === 'company'" cols="12" md="6">
            <b-form-group label="Dono da empresa">
              <b-form-checkbox v-model="assignsCompanyOwner">Atribuir ao criador da empresa</b-form-checkbox>
            </b-form-group>
          </b-col>
          <b-col cols="12">
            <b-form-group label="Descrição" label-for="rt-desc">
              <b-form-textarea id="rt-desc" v-model="description" rows="2" />
              <small class="text-muted">{{ descriptionHint }}</small>
            </b-form-group>
          </b-col>
        </b-row>

        <h6 class="mt-4 mb-2">Permissões</h6>
        <div class="d-flex align-items-center justify-content-between mb-2">
          <b-form-input
            v-model="permissionSearch"
            type="text"
            placeholder="Pesquisar permissões..."
            style="max-width: 360px;"
          />
          <b-form-checkbox
            :model-value="totalVisible > 0 && totalSelectedVisible === totalVisible"
            @update:model-value="toggleAllVisible(Boolean($event))"
          >
            Selecionar todas visíveis
          </b-form-checkbox>
        </div>

        <div v-if="groupedPermissions.length" class="border rounded mb-4">
          <details
            v-for="group in groupedPermissions"
            :key="group.moduleName"
            :open="group.selected > 0"
            class="border-bottom"
          >
            <summary class="d-flex align-items-center justify-content-between px-3 py-2 cursor-pointer">
              <strong>{{ group.moduleLabel }}</strong>
              <span class="badge bg-light text-dark border">{{ group.selected }}/{{ group.total }}</span>
            </summary>
            <div class="px-3 pb-3">
              <b-form-checkbox
                class="mb-2"
                :model-value="group.selected > 0 && group.selected === group.total"
                @update:model-value="toggleModule(group.moduleName, Boolean($event))"
              >
                Marcar todo o módulo
              </b-form-checkbox>
              <b-row>
                <b-col
                  v-for="opt in group.options"
                  :key="opt.id"
                  cols="12"
                  md="6"
                  lg="4"
                  class="mb-1"
                >
                  <b-form-checkbox
                    :model-value="isSelected(opt.id)"
                    @update:model-value="togglePermission(opt.id, Boolean($event))"
                  >
                    {{ opt.label }}
                  </b-form-checkbox>
                </b-col>
              </b-row>
            </div>
          </details>
        </div>

        <AppAlert v-if="fieldErrors.permissions" variant="danger" class="mb-3">{{ fieldErrors.permissions }}</AppAlert>

        <div class="d-flex gap-2">
          <b-button type="submit" variant="primary" :disabled="loading">
            {{ loading ? "A criar…" : "Criar template" }}
          </b-button>
          <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
        </div>
      </b-form>
      <p v-else class="text-muted">A carregar permissões…</p>
    </UIComponentCard>
  </DefaultLayout>
</template>
