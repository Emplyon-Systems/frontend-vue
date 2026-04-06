<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "@/views/panels/owner/scale-types/form/DataForm.vue";
import { scaleTypesApi, branchesApi } from "@/api/resources";
import { scaleTypeInitialForm, type ScaleTypeFormData } from "@/core/schemas";
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
const scaleTypeId = computed(() => Number(route.params.id));
const loadingScaleType = ref(true);
const loadError = ref("");
const form = ref<ScaleTypeFormData>(scaleTypeInitialForm());
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);
const canEditScaleType = computed(() => authStore.hasPermission("scale_types.update"));

function scaleTypesListRoute() {
  return branchScoped.value
    ? "branch.scale-types"
    : companyScoped.value
      ? "company.scale-types"
      : "owner.scale-types";
}

function back() {
  router.push({ name: scaleTypesListRoute() });
}

function goEdit() {
  if (!canEditScaleType.value) return;
  const editName = branchScoped.value
    ? "branch.scale-types.edit"
    : companyScoped.value
      ? "company.scale-types.edit"
      : "owner.scale-types.edit";
  router.push({ name: editName, params: { id: String(scaleTypeId.value) } });
}

function fillFromScaleType(data: Awaited<ReturnType<typeof scaleTypesApi.getById>>) {
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

  if (!scaleTypeId.value) {
    loadError.value = "Tipo de escala inválido.";
    loadingScaleType.value = false;
    return;
  }

  scaleTypesApi
    .getById(scaleTypeId.value)
    .then(fillFromScaleType)
    .catch(() => (loadError.value = "Tipo de escala não encontrado."))
    .finally(() => (loadingScaleType.value = false));
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
          <h1 class="h4 mb-1">Visualizar tipo de escala</h1>
          <p class="text-muted mb-0 small">Consulta dos dados do tipo de escala.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button v-if="canEditScaleType" variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingScaleType" class="text-muted">A carregar tipo de escala...</div>
      <DataForm
        v-else
        v-model="form"
        :branch-options="branchOptions"
        :lock-branch-id="branchScoped && currentBranchId > 0 ? currentBranchId : null"
        mode="view"
      />
    </div>
  </DefaultLayout>
</template>
