<script setup lang="ts">
import { ref, reactive, computed, onMounted, toRef } from "vue";
import { helpers, required, minLength, sameAs } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { useRoute, useRouter } from "vue-router";
import { authApi } from "@/api/resources";

const route = useRoute();
const router = useRouter();

const token = ref("");
const email = ref("");

const form = reactive({
  password: "",
  password_confirmation: "",
});

const rules = computed(() => ({
  password: {
    required: helpers.withMessage("A senha é obrigatória.", required),
    minLength: helpers.withMessage(
      "A senha deve ter pelo menos 6 caracteres.",
      minLength(6)
    ),
  },
  password_confirmation: {
    required: helpers.withMessage("Confirme a nova senha.", required),
    sameAsPassword: helpers.withMessage(
      "As senhas não conferem.",
      sameAs(toRef(form, "password"))
    ),
  },
}));

const v = useVuelidate(rules, form);
const error = ref("");
const loading = ref(false);
const linkExpired = ref(false);
const expiredMessage = ref("");
const verifyLoading = ref(false);
const verifyFailed = ref(false);

onMounted(async () => {
  const q = route.query;
  const t = typeof q.token === "string" ? q.token : "";
  const e = typeof q.email === "string" ? q.email : "";
  if (!t || !e) {
    router.replace({ name: "auth.reset-pass" });
    return;
  }
  token.value = t;
  email.value = decodeURIComponent(e);

  verifyLoading.value = true;
  verifyFailed.value = false;
  try {
    await authApi.verifyResetToken({ email: email.value, token: token.value });
  } catch (e: unknown) {
    const err = e as {
      response?: {
        data?: { msg?: string; message?: string; error_code?: string };
      };
    };
    const data = err.response?.data;
    const msg =
      data?.msg ||
      data?.message ||
      "Não foi possível validar este link.";
    if (data?.error_code === "link_expired") {
      linkExpired.value = true;
      expiredMessage.value = msg;
    } else {
      verifyFailed.value = true;
    }
  } finally {
    verifyLoading.value = false;
  }
});

const showPassword = ref(false);
const showPasswordConfirm = ref(false);

async function handleSubmit() {
  if (!token.value || !email.value) return;
  const ok = await v.value.$validate();
  if (!ok) return;
  error.value = "";
  loading.value = true;
  try {
    await authApi.resetPassword({
      email: email.value,
      token: token.value,
      password: form.password,
      password_confirmation: form.password_confirmation,
    });
    await router.push({
      name: "auth.sign-in",
      query: { senhaAlterada: "1" },
    });
  } catch (e: unknown) {
    const err = e as {
      response?: {
        data?: { msg?: string; message?: string; error_code?: string };
      };
    };
    const data = err.response?.data;
    const msg =
      data?.msg ||
      data?.message ||
      "Não foi possível redefinir a senha. Solicite um novo link.";
    if (data?.error_code === "link_expired") {
      linkExpired.value = true;
      expiredMessage.value = msg;
      error.value = "";
    } else {
      error.value = msg;
    }
  } finally {
    loading.value = false;
  }
}

function goToRequestLink() {
  router.push({ name: "auth.reset-pass" });
}
</script>

<template>
  <div class="login-page">
    <div class="login-form-col">
      <div class="login-form-inner">
        <router-link to="/" class="login-form-logo">
          <img src="/logohorizontal.svg" alt="Emplyon" class="login-form-logo-img" />
        </router-link>
        <template v-if="token && email && verifyLoading">
          <p class="login-subtitle mb-3">Verificando o link…</p>
          <div class="text-center py-4" role="status" aria-live="polite">
            <div class="spinner-border text-primary" aria-hidden="true" />
          </div>
        </template>

        <template v-else-if="token && email && linkExpired">
          <p class="login-subtitle">Não foi possível usar este link</p>
          <div class="alert alert-warning py-3 mb-4" role="alert">
            {{ expiredMessage }}
          </div>
          <b-button
            type="button"
            variant="primary"
            class="login-btn w-100"
            @click="goToRequestLink"
          >
            Solicitar novo link
          </b-button>
        </template>

        <b-form
          v-else-if="token && email"
          class="login-form"
          @submit.prevent="handleSubmit"
        >
          <p class="login-subtitle">Defina sua nova senha.</p>

          <div
            v-if="verifyFailed"
            class="alert alert-warning py-2 mb-3"
            role="alert"
          >
            Não foi possível verificar o link agora. Você pode tentar redefinir abaixo ou
            <a href="#" class="alert-link" @click.prevent="goToRequestLink">solicitar um novo link</a>.
          </div>
          <b-form-group label="Nova senha" label-for="rp-pass" class="mb-3">
            <b-input-group>
              <b-form-input
                id="rp-pass"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 6 caracteres"
                v-model="v.password.$model"
                class="login-input"
                :class="{ 'is-invalid': v.password.$error }"
                autocomplete="new-password"
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

          <b-form-group label="Confirmar nova senha" label-for="rp-pass-confirm" class="mb-3">
            <b-input-group>
              <b-form-input
                id="rp-pass-confirm"
                :type="showPasswordConfirm ? 'text' : 'password'"
                placeholder="Repita a nova senha"
                v-model="v.password_confirmation.$model"
                class="login-input"
                :class="{ 'is-invalid': v.password_confirmation.$error }"
                autocomplete="new-password"
              />
              <template #append>
                <span
                  class="input-group-text login-input-append cursor-pointer"
                  role="button"
                  tabindex="0"
                  :aria-label="showPasswordConfirm ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="showPasswordConfirm = !showPasswordConfirm"
                  @keydown.enter.space.prevent="showPasswordConfirm = !showPasswordConfirm"
                >
                  <i :class="showPasswordConfirm ? 'iconoir-eye-closed' : 'iconoir-eye'"></i>
                </span>
              </template>
            </b-input-group>
            <div v-if="v.password_confirmation.$error" class="invalid-feedback d-block">
              <span v-for="(err, idx) in v.password_confirmation.$errors" :key="idx">
                {{ err.$message }}
              </span>
            </div>
          </b-form-group>

          <div v-if="error" class="alert alert-danger py-2 mb-3">{{ error }}</div>

          <b-button
            type="submit"
            variant="primary"
            class="login-btn w-100"
            :disabled="loading"
          >
            <span v-if="loading">Salvando…</span>
            <span v-else>Redefinir senha</span>
          </b-button>
        </b-form>

        <p
          v-if="token && email && !linkExpired && !verifyLoading"
          class="login-doc-link mt-4 mb-0 text-center"
        >
          <a href="#" class="login-link" @click.prevent="goToRequestLink"
            >Solicitar novo link</a
          >
        </p>
      </div>
    </div>

    <div class="login-brand-col">
      <div class="login-brand-image-wrap">
        <img src="/forget-password.png" alt="" class="login-brand-image" />
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

.login-doc-link {
  font-size: 0.875rem;
  color: #6c757d;
}

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

.cursor-pointer {
  cursor: pointer;
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
}
</style>
