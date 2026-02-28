<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { required, email } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import AuthLayout from "@/layouts/AuthLayout.vue";
import httpClient from "@/helpers/http-client";
import { useAuthStore } from "@/stores/auth";
import { useRoute } from "vue-router";
import router from "@/router";
import { getPanelHomeForUser } from "@/config/panels";
import type { LoginResponse } from "@/types/auth";

const credentials = reactive({
  email: "",
  password: "",
});

const vuelidateRules = computed(() => ({
  email: { required, email },
  password: { required },
}));

const v = useVuelidate(vuelidateRules, credentials);
const authStore = useAuthStore();
const route = useRoute();
const error = ref("");
const loading = ref(false);
const showPassword = ref(false);

/** Só aceita paths internos (evita open redirect). */
function isInternalPath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  const p = path.trim();
  return p.startsWith("/") && !p.startsWith("//") && !p.includes("\\");
}

async function handleLogin() {
  const valid = await v.value.$validate();
  if (!valid) return;
  error.value = "";
  loading.value = true;
  try {
    const res = await httpClient.post<LoginResponse>("/login", {
      email: credentials.email,
      password: credentials.password,
    });
    const data = res.data;
    if (data.user && data.token) {
      authStore.saveSession(data.user, data.token);
      const from = route.query.redirectedFrom;
      if (isInternalPath(from)) {
        await router.push(from);
      } else {
        await router.push(getPanelHomeForUser(data.user.roles) || "/");
      }
    } else {
      error.value = data.msg || "Resposta inválida.";
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { msg?: string; message?: string } } };
    error.value =
      err.response?.data?.msg ||
      err.response?.data?.message ||
      "Erro ao iniciar sessão. Tente novamente.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <b-col lg="4" class="mx-auto">
      <b-card no-body>
        <b-card-body class="p-0 bg-black auth-header-box rounded-top">
          <div class="text-center p-3">
            <router-link to="/" class="logo logo-admin">
              <img src="/logovertical.svg" height="70" alt="logo" class="auth-logo" />
            </router-link>
            <h4 class="mt-3 mb-1 fw-semibold text-white fs-18">
              Let's Get Started Emplyon
            </h4>
            <p class="text-muted fw-medium mb-0">
              Sign in to continue to Emplyon.
            </p>
          </div>
        </b-card-body>
        <b-card-body class="pt-0">
          <b-form class="my-4" @submit.prevent="handleLogin">
            <b-form-group class="mb-2" label="Email" label-for="email">
              <b-form-input
                type="email"
                placeholder="Enter email"
                id="email"
                v-model="v.email.$model"
              />
              <div v-if="v.email.$error" class="text-danger">
                <span v-for="(err, idx) in v.email.$errors" :key="idx">
                  {{ err.$message }}
                </span>
              </div>
            </b-form-group>

            <b-form-group
              class="mb-2"
              label="Password"
              label-for="userpassword"
            >
              <b-input-group>
                <b-form-input
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter password"
                  id="userpassword"
                  v-model="v.password.$model"
                />
                <template #append>
                  <span
                    class="input-group-text cursor-pointer"
                    role="button"
                    tabindex="0"
                    :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                    @click="showPassword = !showPassword"
                    @keydown.enter.space.prevent="showPassword = !showPassword"
                  >
                    <i :class="showPassword ? 'iconoir-eye-closed' : 'iconoir-eye'"></i>
                  </span>
                </template>
              </b-input-group>
              <div v-if="v.password.$errors" class="text-danger">
                <span v-for="(err, idx) in v.password.$errors" :key="idx">
                  {{ err.$message }}
                </span>
              </div>
            </b-form-group>

            <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

            <div class="form-group row mt-3">
              <b-col sm="6">
                <div class="form-switch-success">
                  <b-form-checkbox switch>Remember me</b-form-checkbox>
                </div>
              </b-col>
              <b-col sm="6" class="text-end">
                <router-link to="/auth/reset-pass" class="text-muted font-13"
                  ><i class="dripicons-lock"></i> Forgot password?</router-link
                >
              </b-col>
            </div>

            <b-form-group class="mb-0 row">
              <b-col cols="12">
                <div class="d-grid mt-3">
                  <b-button
                    variant="primary"
                    type="submit"
                    :disabled="loading"
                  >
                    <span v-if="loading">A iniciar sessão…</span>
                    <span v-else>Log In <i class="fas fa-sign-in-alt ms-1"></i></span>
                  </b-button>
                </div>
              </b-col>
            </b-form-group>
          </b-form>
        </b-card-body>
      </b-card>
    </b-col>
  </AuthLayout>
</template>
