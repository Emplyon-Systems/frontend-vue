<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import * as usersApi from "@/api/resources/users";
import * as rolesApi from "@/api/resources/roles";

const router = useRouter();
const loading = ref(false);
const roleOptions = ref<{ id: number; name: string }[]>([]);
const form = ref({
  name: "",
  email: "",
  password: "",
  roles: [] as number[],
});
const errors = ref<Record<string, string>>({});

function submit() {
  errors.value = {};
  if (!form.value.name.trim()) errors.value.name = "Nome é obrigatório.";
  if (!form.value.email.trim()) errors.value.email = "E-mail é obrigatório.";
  if (!form.value.password) errors.value.password = "Palavra-passe é obrigatória.";
  if (Object.keys(errors.value).length) return;

  loading.value = true;
  usersApi
    .create({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      roles: form.value.roles.length ? form.value.roles : undefined,
    })
    .then(() => router.push({ name: "owner.users" }))
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
  router.push({ name: "owner.users" });
}

onMounted(() => {
  rolesApi.plucks().then((opts) => (roleOptions.value = opts));
});
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
          <b-row>
            <b-col md="6">
              <b-form-group label="Nome" label-for="name" class="mb-3">
                <b-form-input
                  id="name"
                  v-model="form.name"
                  type="text"
                  placeholder="Nome completo"
                  :state="errors.name ? false : null"
                />
                <b-form-invalid-feedback v-if="errors.name">{{ errors.name }}</b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="E-mail" label-for="email" class="mb-3">
                <b-form-input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="email@exemplo.com"
                  :state="errors.email ? false : null"
                />
                <b-form-invalid-feedback v-if="errors.email">{{ errors.email }}</b-form-invalid-feedback>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col md="6">
              <b-form-group label="Palavra-passe" label-for="password" class="mb-3">
                <b-form-input
                  id="password"
                  v-model="form.password"
                  type="password"
                  placeholder="••••••••"
                  :state="errors.password ? false : null"
                />
                <b-form-invalid-feedback v-if="errors.password">{{ errors.password }}</b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Perfis" class="mb-3">
                <div class="d-flex flex-column gap-2">
                  <b-form-checkbox
                    v-for="role in roleOptions"
                    :key="role.id"
                    v-model="form.roles"
                    :value="role.id"
                  >
                    {{ role.name }}
                  </b-form-checkbox>
                </div>
                <small class="text-muted d-block mt-1">Selecione um ou mais perfis para vincular ao utilizador.</small>
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
  </DefaultLayout>
</template>
