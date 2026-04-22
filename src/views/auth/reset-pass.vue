<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { helpers, required, email } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { authApi } from "@/api/resources";
import router from "@/router";

const form = reactive({
  email: "",
});

const rules = computed(() => ({
  email: {
    required: helpers.withMessage("O e-mail é obrigatório.", required),
    email: helpers.withMessage("Informe um e-mail válido.", email),
  },
}));

const v = useVuelidate(rules, form);
const error = ref("");
const success = ref("");
const loading = ref(false);

async function handleSubmit() {
  const ok = await v.value.$validate();
  if (!ok) return;
  error.value = "";
  success.value = "";
  loading.value = true;
  try {
    const data = await authApi.forgotPassword({ email: form.email.trim() });
    success.value =
      typeof data.message === "string" && data.message
        ? data.message
        : "Enviamos um e-mail com o link para redefinir a senha da sua conta. Verifique sua caixa de entrada e a pasta de spam.";
  } catch (e: unknown) {
    const err = e as {
      response?: { status?: number; data?: { msg?: string; message?: string } };
    };
    if (err.response?.status === 429) {
      error.value =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Aguarde um momento antes de tentar de novo.";
    } else {
      // Não expor falhas genéricas como “e-mail não encontrado”; manter tom neutro.
      error.value =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Não foi possível concluir o pedido agora. Tente novamente em alguns minutos.";
    }
  } finally {
    loading.value = false;
  }
}

function goToSignIn() {
  router.push({ name: "auth.sign-in" });
}
</script>

<template>
  <div class="login-page">
    <div class="login-form-col">
      <div class="login-form-inner">
        <router-link to="/" class="login-form-logo">
          <img src="/logohorizontal.svg" alt="Emplyon" class="login-form-logo-img" />
        </router-link>
        <p class="login-subtitle">
          Informe o e-mail para redefinir sua senha. Você será notificado por e-mail.
        </p>

        <b-form class="login-form" @submit.prevent="handleSubmit">
          <b-form-group label="E-mail" label-for="reset-email" class="mb-3">
            <b-form-input
              id="reset-email"
              type="email"
              placeholder="seu.email@exemplo.com"
              v-model="v.email.$model"
              class="login-input"
              :class="{ 'is-invalid': v.email.$error }"
              autocomplete="email"
            />
            <div v-if="v.email.$error" class="invalid-feedback d-block">
              <span v-for="(err, idx) in v.email.$errors" :key="idx">
                {{ err.$message }}
              </span>
            </div>
          </b-form-group>

          <div v-if="error" class="alert alert-danger py-2 mb-3">{{ error }}</div>
          <div v-if="success" class="alert alert-success py-2 mb-3">{{ success }}</div>

          <b-button
            type="submit"
            variant="primary"
            class="login-btn w-100"
            :disabled="loading"
          >
            <span v-if="loading">Enviando…</span>
            <span v-else>Enviar link</span>
          </b-button>
        </b-form>

        <p class="login-doc-link mt-4 mb-0 text-center">
          <a href="#" class="login-link" @click.prevent="goToSignIn">Voltar ao login</a>
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

@media (max-width: 991.98px) {
  .login-page {
    flex-direction: column;
  }
  .login-form-col {
    flex: 1 1 auto;
    max-width: 100%;
    width: 100%;
  }
  .login-brand-col {
    display: none;
  }
}
</style>
