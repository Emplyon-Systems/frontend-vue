<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import { usersApi } from "@/api/resources";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const userId = computed(() => Number(authStore.user?.id ?? 0));

const loading = ref(false);
const loadingUser = ref(true);
const loadError = ref("");
const form = ref({
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
});
const errors = ref<Record<string, string>>({});

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
  router.push({ name: "employee.my-profile.view" });
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
    .then((data) => {
      const u = data.user;
      if (!u) return;
      form.value = {
        name: u.name ?? "",
        email: u.email ?? "",
        password: "",
        password_confirmation: "",
      };
    })
    .catch(() => (loadError.value = "Não foi possível carregar o seu perfil."))
    .finally(() => (loadingUser.value = false));
}

function submit() {
  errors.value = {};
  if (!form.value.name.trim()) {
    errors.value.name = "Nome é obrigatório.";
    return;
  }
  if (!form.value.email.trim()) {
    errors.value.email = "E-mail é obrigatório.";
    return;
  }
  if (form.value.password && form.value.password !== form.value.password_confirmation) {
    errors.value.password_confirmation = "A confirmação da palavra-passe não confere.";
    return;
  }

  loading.value = true;
  usersApi
    .update(userId.value, {
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      ...(form.value.password ? { password: form.value.password } : {}),
    })
    .then(() => {
      notifySuccess("Perfil atualizado com sucesso.");
      router.push({ name: "employee.my-profile.view" });
    })
    .catch(mapApiErrors)
    .finally(() => (loading.value = false));
}

onMounted(loadUser);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar meu perfil</h1>
          <p class="text-muted mb-0 small">Atualize seus dados pessoais de acesso.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingUser" class="text-muted">A carregar perfil...</div>

      <UIComponentCard v-else title="Dados do perfil">
        <b-form @submit.prevent="submit">
          <b-row>
            <b-col md="6">
              <b-form-group label="Nome" class="mb-3">
                <b-form-input
                  v-model="form.name"
                  :state="errors.name ? false : null"
                  @input="clearError('name')"
                />
                <b-form-invalid-feedback v-if="errors.name">{{ errors.name }}</b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="E-mail" class="mb-3">
                <b-form-input
                  v-model="form.email"
                  type="email"
                  :state="errors.email ? false : null"
                  @input="clearError('email')"
                />
                <b-form-invalid-feedback v-if="errors.email">{{ errors.email }}</b-form-invalid-feedback>
              </b-form-group>
            </b-col>
          </b-row>

          <b-row>
            <b-col md="6">
              <b-form-group label="Nova palavra-passe" class="mb-3">
                <b-form-input
                  v-model="form.password"
                  type="password"
                  placeholder="Deixe em branco para não alterar"
                  :state="errors.password ? false : null"
                  @input="clearError('password')"
                />
                <b-form-invalid-feedback v-if="errors.password">{{ errors.password }}</b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Confirmar palavra-passe" class="mb-3">
                <b-form-input
                  v-model="form.password_confirmation"
                  type="password"
                  placeholder="Repita a nova palavra-passe"
                  :state="errors.password_confirmation ? false : null"
                  @input="clearError('password_confirmation')"
                />
                <b-form-invalid-feedback v-if="errors.password_confirmation">
                  {{ errors.password_confirmation }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
          </b-row>

          <div class="d-flex gap-2">
            <b-button type="submit" variant="primary" :disabled="loading">
              {{ loading ? "A guardar..." : "Guardar" }}
            </b-button>
            <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
          </div>
        </b-form>
      </UIComponentCard>
    </div>
  </DefaultLayout>
</template>
