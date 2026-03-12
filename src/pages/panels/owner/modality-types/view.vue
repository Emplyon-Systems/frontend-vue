<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import DataForm from "@/views/panels/owner/modality-types/form/DataForm.vue";
import { modalityTypesApi, branchesApi } from "@/api/resources";
import { modalityTypeInitialForm, type ModalityTypeFormData } from "@/core/schemas";
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
const modalityTypeId = computed(() => Number(route.params.id));
const loadingModalityType = ref(true);
const loadError = ref("");
const form = ref<ModalityTypeFormData>(modalityTypeInitialForm());
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);
const canEditModalityType = computed(() => authStore.hasPermission("modality_types.update"));

function modalityTypesListRoute() {
  return branchScoped.value
    ? "branch.modality-types"
    : companyScoped.value
      ? "company.modality-types"
      : "owner.modality-types";
}

function back() {
  router.push({ name: modalityTypesListRoute() });
}

function goEdit() {
  if (!canEditModalityType.value) return;
  const editName = branchScoped.value
    ? "branch.modality-types.edit"
    : companyScoped.value
      ? "company.modality-types.edit"
      : "owner.modality-types.edit";
  router.push({ name: editName, params: { id: String(modalityTypeId.value) } });
}

function fillFromModalityType(data: Awaited<ReturnType<typeof modalityTypesApi.getById>>) {
  const mt = data.modalityType;
  if (!mt) return;
  form.value = {
    branch_id: mt.branch_id ?? 0,
    name: mt.name ?? "",
    is_default: mt.is_default ?? false,
  };
}

function loadModalityType() {
  loadError.value = "";
  loadingModalityType.value = true;

  if (!modalityTypeId.value) {
    loadError.value = "Modalidade inválida.";
    loadingModalityType.value = false;
    return;
  }

  modalityTypesApi
    .getById(modalityTypeId.value)
    .then(fillFromModalityType)
    .catch(() => (loadError.value = "Modalidade não encontrada."))
    .finally(() => (loadingModalityType.value = false));
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
  loadModalityType();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Visualizar modalidade</h1>
          <p class="text-muted mb-0 small">Consulta dos dados da modalidade.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button v-if="canEditModalityType" variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingModalityType" class="text-muted">A carregar modalidade...</div>
      <DataForm v-else v-model="form" :branch-options="branchOptions" mode="view" />
    </div>
  </DefaultLayout>
</template>
