<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import Selectr from "mobius1-selectr";
import UIComponentCard from "@/components/UIComponentCard.vue";
import * as rolesApi from "@/api/resources/roles";
import * as permissionsApi from "@/api/resources/permissions";

const props = defineProps<{
  roleId: number | null;
}>();

const router = useRouter();
const isEdit = computed(() => props.roleId !== null);
const loading = ref(false);
const loadError = ref("");
const permissionOptions = ref<{ id: number; name: string; slug: string }[]>([]);
const form = ref({
  name: "",
  slug: "",
  description: "",
  permissions: [] as number[],
});
const errors = ref<Record<string, string>>({});
let permissionsSelectr: InstanceType<typeof Selectr> | null = null;

function loadRole() {
  if (props.roleId == null) return Promise.resolve();
  loadError.value = "";
  return rolesApi
    .getById(props.roleId)
    .then((data) => {
      const r = data.role;
      if (!r) return;
      form.value = {
        name: r.name ?? "",
        slug: r.slug ?? "",
        description: r.description ?? "",
        permissions: (r.permissions ?? []).map((p) => p.id),
      };
    })
    .catch(() => (loadError.value = "Perfil não encontrado."));
}

function submit() {
  errors.value = {};
  if (!form.value.name.trim()) errors.value.name = "Nome é obrigatório.";
  if (!form.value.slug.trim()) errors.value.slug = "Slug é obrigatório.";
  if (Object.keys(errors.value).length) return;

  loading.value = true;
  const payload = {
    name: form.value.name.trim(),
    slug: form.value.slug.trim(),
    description: form.value.description.trim() || undefined,
    permissions: form.value.permissions.length ? form.value.permissions : undefined,
  };

  const promise = isEdit.value
    ? rolesApi.update(props.roleId!, { ...payload, permissions: form.value.permissions })
    : rolesApi.create(payload);

  promise
    .then(() => router.push({ name: "owner.roles" }))
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

function initSelectr() {
  const el = document.getElementById("permissions-select");
  if (!el || permissionsSelectr) return;
  permissionsSelectr = new Selectr(el, {
    multiple: true,
    searchable: true,
    clearable: true,
  });
  if (isEdit.value && form.value.permissions.length) {
    permissionsSelectr.setValue(form.value.permissions);
  }
  permissionsSelectr.on("change", () => {
    const vals = permissionsSelectr!.getValue() as string[];
    form.value.permissions = vals.map((v) => Number(v));
  });
}

onMounted(async () => {
  const opts = await permissionsApi.plucks();
  permissionOptions.value = opts;
  await loadRole();
  await nextTick();
  initSelectr();
});

watch(
  () => props.roleId,
  async () => {
    await loadRole();
    await nextTick();
    if (permissionsSelectr) {
      permissionsSelectr.destroy();
      permissionsSelectr = null;
    }
    await nextTick();
    initSelectr();
  }
);

onBeforeUnmount(() => {
  if (permissionsSelectr) {
    permissionsSelectr.destroy();
    permissionsSelectr = null;
  }
});
</script>

<template>
  <div>
    <b-alert v-if="loadError" variant="danger" show>{{ loadError }}</b-alert>

    <UIComponentCard v-else title="Dados do perfil">
      <b-form @submit.prevent="submit">
        <b-row>
          <b-col md="6">
            <b-form-group label="Nome" label-for="name" class="mb-3">
              <b-form-input
                id="name"
                v-model="form.name"
                type="text"
                placeholder="Ex: Administrador"
                :state="errors.name ? false : null"
              />
              <b-form-invalid-feedback v-if="errors.name">{{ errors.name }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Slug" label-for="slug" class="mb-3">
              <b-form-input
                id="slug"
                v-model="form.slug"
                type="text"
                placeholder="Ex: admin"
                :state="errors.slug ? false : null"
              />
              <b-form-invalid-feedback v-if="errors.slug">{{ errors.slug }}</b-form-invalid-feedback>
              <small class="text-muted">Identificador único (ex.: admin, superadmin).</small>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-group label="Descrição" label-for="description" class="mb-3">
              <b-form-input
                id="description"
                v-model="form.description"
                type="text"
                placeholder="Descrição opcional"
              />
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-group label="Permissões" label-for="permissions-select" class="mb-3">
              <select
                id="permissions-select"
                class="form-select"
                multiple
                :aria-label="'Permissões vinculadas a este perfil'"
              >
                <option
                  v-for="o in permissionOptions"
                  :key="o.id"
                  :value="o.id"
                >
                  {{ o.name }} ({{ o.slug }})
                </option>
              </select>
              <small class="text-muted">Permissões vinculadas a este perfil. Use a pesquisa para filtrar.</small>
            </b-form-group>
          </b-col>
        </b-row>
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
</template>
