<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { required, email } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import httpClient from "@/helpers/http-client";
import { useAuthStore } from "@/stores/auth";
import { useRoute } from "vue-router";
import router from "@/router";
import { getPanelHomeForUser } from "@/config/panels";
import type { LoginResponse } from "@/types/auth";

const credentials = reactive({
  email: "",
  password: "",
  remember: false,
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
      const roles = data.user.roles;
      if (!roles?.length) {
        error.value = "Utilizador sem acesso. Nenhum perfil atribuído.";
        return;
      }
      authStore.saveSession(data.user, data.token);
      const from = route.query.redirectedFrom;
      if (isInternalPath(from)) {
        await router.push(from);
      } else if (
        !authStore.hasRole("superadmin") &&
        authStore.hasMultipleContexts()
      ) {
        await router.push({ name: "auth.select-context" });
      } else {
        const opts = authStore.getContextOptions();
        const selected = opts.length === 1 ? opts[0] : null;
        if (selected) authStore.selectContext(selected);
        await router.push(getPanelHomeForUser(data.user, selected) || "/");
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
  <div class="login-page">
    <!-- Coluna esquerda: formulário -->
    <div class="login-form-col">
      <div class="login-form-inner">
        <router-link to="/" class="login-form-logo">
          <img src="/logohorizontal.svg" alt="Emplyon" class="login-form-logo-img" />
        </router-link>
        <p class="login-subtitle">
          Inicie sessão na sua conta para começar a usar a Emplyon
        </p>

        <b-form class="login-form" @submit.prevent="handleLogin">
          <b-form-group label="E-mail" label-for="email" class="mb-3">
            <b-form-input
              id="email"
              type="email"
              placeholder="exemplo@email.pt"
              v-model="v.email.$model"
              class="login-input"
              :class="{ 'is-invalid': v.email.$error }"
            />
            <div v-if="v.email.$error" class="invalid-feedback d-block">
              <span v-for="(err, idx) in v.email.$errors" :key="idx">
                {{ err.$message }}
              </span>
            </div>
          </b-form-group>

          <b-form-group label="Palavra-passe" label-for="userpassword" class="mb-3">
            <b-input-group>
              <b-form-input
                id="userpassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                v-model="v.password.$model"
                class="login-input"
                :class="{ 'is-invalid': v.password.$error }"
              />
              <template #append>
                <span
                  class="input-group-text login-input-append cursor-pointer"
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
            <div v-if="v.password.$error" class="invalid-feedback d-block">
              <span v-for="(err, idx) in v.password.$errors" :key="idx">
                {{ err.$message }}
              </span>
            </div>
          </b-form-group>

          <div v-if="error" class="alert alert-danger py-2 mb-3">{{ error }}</div>

          <div class="d-flex justify-content-between align-items-center mb-3">
            <b-form-checkbox v-model="credentials.remember" class="login-remember">
              Lembrar a minha preferência
            </b-form-checkbox>
            <router-link to="/auth/reset-pass" class="login-link">
              Esqueceu a palavra-passe?
            </router-link>
          </div>

          <b-button
            type="submit"
            variant="primary"
            class="login-btn w-100"
            :disabled="loading"
          >
            <span v-if="loading">A iniciar sessão…</span>
            <span v-else>Entrar</span>
          </b-button>
        </b-form>

        <!-- Entrar com redes sociais (desativado)
        <div class="login-divider">
          <span>Ou continue com</span>
        </div>
        <div class="login-social">
          <a href="#" class="login-social-btn" aria-label="Facebook" title="Facebook">
            <i class="fab fa-facebook-f"></i>
          </a>
          <a href="#" class="login-social-btn login-social-google" aria-label="Google" title="Google">
            <i class="fab fa-google-plus-g"></i>
          </a>
          <a href="#" class="login-social-btn login-social-linkedin" aria-label="LinkedIn" title="LinkedIn">
            <i class="fab fa-linkedin-in"></i>
          </a>
          <a href="#" class="login-social-btn login-social-twitter" aria-label="Twitter" title="Twitter">
            <i class="fab fa-twitter"></i>
          </a>
        </div>
        -->

        <!-- Registo (oculto)
        <p class="login-register mt-4 mb-0">
          Ainda não está registado?
          <router-link to="/auth/register" class="login-link">Registe-se</router-link>
        </p>
        -->

        <p class="login-doc-link mt-4 mb-0 text-center">
          <router-link to="/documentation" class="login-link">Documentação do projeto</router-link>
        </p>
      </div>
    </div>

    <!-- Coluna direita: apenas a imagem -->
    <div class="login-brand-col">
      <div class="login-brand-image-wrap">
        <img src="/loginimage.png" alt="" class="login-brand-image" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  background: #fff;
}

.login-form-col {
  flex: 0 0 50%;
  max-width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #fff;
}

.login-form-inner {
  width: 100%;
  max-width: 400px;
}

.login-form-logo {
  display: inline-block;
  margin-bottom: 1.5rem;
}

.login-form-logo-img {
  height: 56px;
  width: auto;
  display: block;
}

.login-subtitle {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

.login-input,
.login-input:focus {
  border-radius: 8px;
  border: 1px solid #dee2e6;
  padding: 0.6rem 0.9rem;
}
.login-input:focus {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 3px rgba(1, 121, 254, 0.15);
}

.login-input-append {
  border-radius: 0 8px 8px 0;
  border: 1px solid #dee2e6;
  border-left: 0;
  background: #fff;
}

.login-remember {
  font-size: 0.9rem;
  color: #495057;
}

.login-link {
  color: var(--bs-primary);
  font-size: 0.9rem;
  text-decoration: none;
  font-weight: 500;
  &:hover {
    color: var(--bs-primary);
    text-decoration: underline;
  }
}

.login-btn {
  padding: 0.65rem 1rem;
  font-weight: 600;
  border-radius: 8px;
}

.login-divider {
  display: flex;
  align-items: center;
  margin-top: 1.5rem;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #dee2e6;
  }
  span {
    padding: 0 1rem;
    font-size: 0.85rem;
    color: #6c757d;
  }
}

.login-social {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1rem;
}

.login-social-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-decoration: none;
  transition: opacity 0.2s;
  background: #1877f2; /* Facebook */
  &:hover {
    opacity: 0.9;
    color: #fff;
  }
}
.login-social-google {
  background: #db4437;
}
.login-social-linkedin {
  background: #0a66c2;
}
.login-social-twitter {
  background: #1da1f2;
}

.login-register {
  font-size: 0.95rem;
  color: #6c757d;
}

.login-doc-link {
  font-size: 0.875rem;
  color: #6c757d;
}

/* Coluna direita: apenas a imagem */
.login-brand-col {
  flex: 0 0 50%;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  padding: 2.5rem;
}

.login-brand-image-wrap {
  flex: 1;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 0;
}

.login-brand-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

@media (max-width: 991.98px) {
  .login-page {
    flex-direction: column;
  }
  .login-form-col,
  .login-brand-col {
    flex: 1 1 auto;
    max-width: 100%;
  }
  .login-brand-col {
    min-height: 0;
    padding-top: 1.5rem;
  }
  .login-brand-empty {
    min-height: 80px;
  }
}
</style>
