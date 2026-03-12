<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "@/views/panels/owner/scale-types/form/DataForm.vue";
import { scaleTypesApi, branchesApi } from "@/api/resources";
import { scaleTypeInitialForm, validateScaleTypeForm, type ScaleTypeFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const scaleTypeId = computed(() => Number(route.params.id));
const routeName = computed(() => String(route.name ?? ""));
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));
const currentBranchId = computed(() => {
  if (!branchScoped.value) return 0;
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.id ?? 0);
});

function scaleTypesListRoute() {
  return branchScoped.value
    ? "branch.scale-types"
    : companyScoped.value
      ? "company.scale-types"
      : "owner.scale-types";
}

const loading = ref(false);
const loadingScaleType = ref(true);
const loadError = ref("");
const form = ref<ScaleTypeFormData>(scaleTypeInitialForm());
const errors = ref<Record<string, string>>({});
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);

function mapApiErrors(err: { response?: { data?: { errors?: Record<string, string[]> } } }) {
  const data = err.response?.data?.errors;
  if (!data) return;
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) map[k] = Array.isArray(v) ? v[0] : String(v);
  errors.value = map;
}

function clearError(field: string) {
  if (!errors.value[field]) return;
  delete errors.value[field];
}

function cancel() {
  router.push({ name: scaleTypesListRoute() });
}

function fillFormFromScaleType(data: Awaited<ReturnType<typeof scaleTypesApi.getById>>) {
  const st = data.scaleType;
  if (!st) return;
  form.value = {
    branch_id: st.branch_id ?? 0,
    name: st.name ?? "",
  };
}

function loadScaleType() {
  loadError.value = "";
  loadingScaleType.value = true;

  if (Number.isNaN(scaleTypeId.value)) {
    loadError.value = "Tipo de escala inválido.";
    loadingScaleType.value = false;
    return;
  }

  scaleTypesApi
    .getById(scaleTypeId.value)
    .then(fillFormFromScaleType)
    .catch(() => (loadError.value = "Tipo de escala não encontrado."))
    .finally(() => (loadingScaleType.value = false));
}

function submit() {
  errors.value = {};
  const validation = validateScaleTypeForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  scaleTypesApi
    .update(scaleTypeId.value, validation.data)
    .then(() => {
      notifySuccess("Tipo de escala atualizado com sucesso.");
      router.push({ name: scaleTypesListRoute() });
    })
    .catch(mapApiErrors)
    .finally(() => (loading.value = false));
}

onMounted(async () => {
  if (branchScoped.value && currentBranchId.value > 0) {
    let branchName =
      authStore.activeContext?.branch_id === currentBranchId.value
        ? authStore.activeContext?.branch_name
        : authStore.user?.branches?.find((b) => b.id === currentBranchId.value)?.name;
    if (!branchName) {
      try {
        const res = await branchesApi.getById(currentBranchId.value);
        branchName = res.branch?.name ?? `Filial #${currentBranchId.value}`;
      } catch {
        branchName = `Filial #${currentBranchId.value}`;
      }
    }
    branchOptions.value = [
      {
        id: currentBranchId.value,
        name: branchName ?? `Filial #${currentBranchId.value}`,
        company_name: "",
      },
    ];
  } else {
    const branches = await branchesApi.plucks();
    branchOptions.value = (
      branches as { id: number; name?: string; company_name?: string }[]
    )
      .map((b) => ({
        id: b.id,
        name: b.name ?? `Filial #${b.id}`,
        company_name: (b as { company_name?: string }).company_name ?? "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  loadScaleType();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar tipo de escala</h1>
          <p class="text-muted mb-0 small">Atualizar dados do tipo de escala.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingScaleType" class="text-muted">A carregar tipo de escala...</div>
      <b-form v-else @submit.prevent="submit">
        <DataForm
          v-model="form"
          :errors="errors"
          :branch-options="branchOptions"
          :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null"
          mode="edit"
          @clear-error="clearError"
        >
          <template #actions>
            <b-button type="submit" variant="primary" :disabled="loading">
              {{ loading ? "A guardar..." : "Guardar" }}
            </b-button>
            <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
          </template>
        </DataForm>
      </b-form>
    </div>
  </DefaultLayout>
</template>
