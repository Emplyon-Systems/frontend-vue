<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "./form/DataForm.vue";
import { shiftsApi, branchesApi } from "@/api/resources";
import { shiftInitialForm, validateShiftForm, type ShiftFormData } from "@/core/schemas";
import { notifySuccess } from "@/helpers/notify";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const routeName = computed(() => String(route.name ?? ""));
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));
const currentBranchId = computed(() => {
  if (!branchScoped.value) return 0;
  const fromContext = Number(authStore.activeContext?.branch_id ?? 0);
  if (fromContext > 0) return fromContext;
  return Number(authStore.user?.branches?.[0]?.id ?? 0);
});
const shiftId = computed(() => Number(route.params.id));
const loading = ref(false);
const loadingShift = ref(true);
const loadError = ref("");
const form = ref<ShiftFormData>(shiftInitialForm());
const errors = ref<Record<string, string>>({});
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);

function mapApiErrors(err: { response?: { data?: { errors?: Record<string, string[]> | string } } }) {
  const data = err.response?.data?.errors;
  if (!data) return;
  const map: Record<string, string> = {};
  if (typeof data === "string") {
    map["name"] = data;
  } else {
    for (const [k, v] of Object.entries(data)) map[k] = Array.isArray(v) ? v[0] : String(v);
  }
  errors.value = map;
}

function clearError(field: string) {
  if (!errors.value[field]) return;
  delete errors.value[field];
}

function shiftsListRoute() {
  return branchScoped.value ? "branch.shifts" : companyScoped.value ? "company.shifts" : "owner.shifts";
}

function cancel() {
  router.push({ name: shiftsListRoute() });
}

function toHhMm(v: string): string {
  const m = String(v ?? "").trim().match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "08:00";
}

function fillFormFromShift(data: Awaited<ReturnType<typeof shiftsApi.getById>>) {
  const shift = data.shift;
  if (!shift) return;
  form.value = {
    branch_id: shift.branch_id ?? 0,
    name: shift.name ?? "",
    slug: shift.slug ?? "",
    start_time: toHhMm(shift.start_time ?? "08:00"),
    end_time: toHhMm(shift.end_time ?? "17:00"),
  };
}

function loadShift() {
  loadError.value = "";
  loadingShift.value = true;

  if (Number.isNaN(shiftId.value)) {
    loadError.value = "Turno inválido.";
    loadingShift.value = false;
    return;
  }

  shiftsApi
    .getById(shiftId.value)
    .then(fillFormFromShift)
    .catch(() => (loadError.value = "Turno não encontrado."))
    .finally(() => (loadingShift.value = false));
}

function submit() {
  errors.value = {};
  const validation = validateShiftForm(form.value, "edit");
  if (!validation.success) {
    errors.value = validation.errors;
    return;
  }

  loading.value = true;
  shiftsApi
    .update(shiftId.value, validation.data)
    .then(() => {
      notifySuccess("Turno atualizado com sucesso.");
      router.push({ name: shiftsListRoute() });
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
    branchOptions.value = [{ id: currentBranchId.value, name: branchName ?? `Filial #${currentBranchId.value}`, company_name: "" }];
  } else {
    const branches = await branchesApi.plucks();
    let allBranches = (branches as { id: number; name?: string; company_id?: number; company_name?: string }[])
      .map((b) => ({ id: b.id, name: b.name ?? `Filial #${b.id}`, company_id: b.company_id, company_name: (b as { company_name?: string }).company_name ?? "" }));
    if (companyScoped.value) {
      const companyId = Number(authStore.activeContext?.company_id ?? 0);
      if (companyId > 0) allBranches = allBranches.filter((b) => b.company_id != null && b.company_id === companyId);
    }
    branchOptions.value = allBranches.sort((a, b) => a.name.localeCompare(b.name));
  }
  loadShift();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Editar turno</h1>
          <p class="text-muted mb-0 small">Atualizar dados do turno.</p>
        </div>
        <b-button variant="outline-secondary" @click="cancel">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingShift" class="text-muted">A carregar turno...</div>
      <template v-else>
        <AppAlert v-if="Object.keys(errors).length" variant="danger" class="mb-3">
          {{ Object.values(errors)[0] ?? "Corrija os erros antes de continuar." }}
        </AppAlert>
        <b-form @submit.prevent="submit">
        <DataForm v-model="form" :errors="errors" :branch-options="branchOptions" :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null" mode="edit" @clear-error="clearError">
          <template #actions>
            <b-button type="submit" variant="primary" :disabled="loading">
              {{ loading ? "A guardar..." : "Guardar" }}
            </b-button>
            <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
          </template>
        </DataForm>
      </b-form>
      </template>
    </div>
  </DefaultLayout>
</template>
