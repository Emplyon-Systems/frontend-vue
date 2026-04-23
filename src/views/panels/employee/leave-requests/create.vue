<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import { employeeLeaveRequestsApi } from "@/api/resources";

const router = useRouter();
const saving = ref(false);
const error = ref("");

const form = ref({
  request_date: "",
  reason: "",
});

async function submit() {
  error.value = "";
  if (!form.value.request_date || !form.value.reason.trim()) {
    error.value = "Preencha a data e o motivo da solicitação.";
    return;
  }

  saving.value = true;
  try {
    await employeeLeaveRequestsApi.create({
      request_date: form.value.request_date,
      reason: form.value.reason.trim(),
    });
    router.push({ name: "employee.leave-requests" });
  } catch (e: unknown) {
    const data =
      e && typeof e === "object" && "response" in e
        ? (e as { response?: { data?: { msg?: string; message?: string; errors?: unknown } } }).response?.data
        : undefined;

    const fieldErrors =
      data?.errors && typeof data.errors === "object"
        ? Object.values(data.errors as Record<string, unknown>)
            .flatMap((v) => (Array.isArray(v) ? v : [v]))
            .map((v) => String(v))
            .filter(Boolean)
        : [];

    const backendError =
      typeof data?.errors === "string"
        ? data.errors
        : fieldErrors.length
          ? fieldErrors.join(" ")
          : undefined;

    const msg = backendError || data?.message || (data?.msg && data.msg !== "fail" ? data.msg : undefined);
    error.value = msg ? String(msg) : "Não foi possível salvar a solicitação.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Solicitar folga</h1>
          <p class="text-muted small mb-0">Informe a data e o motivo para análise.</p>
        </div>
        <b-button variant="outline-secondary" @click="router.push({ name: 'employee.leave-requests' })">Voltar</b-button>
      </div>

      <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>
      <b-card>
        <b-card-body>
          <b-form-group label="Data da folga" label-for="leave-request-date" class="mb-3">
            <b-form-input id="leave-request-date" v-model="form.request_date" type="date" required />
          </b-form-group>

          <b-form-group label="Motivo" label-for="leave-request-reason" class="mb-3">
            <b-form-textarea id="leave-request-reason" v-model="form.reason" rows="4" max-rows="8" required />
          </b-form-group>

          <div class="d-flex gap-2">
            <b-button variant="primary" :disabled="saving" @click="submit">
              {{ saving ? "Enviando..." : "Enviar solicitação" }}
            </b-button>
            <b-button variant="outline-secondary" @click="router.push({ name: 'employee.leave-requests' })">Cancelar</b-button>
          </div>
        </b-card-body>
      </b-card>
    </div>
  </DefaultLayout>
</template>
