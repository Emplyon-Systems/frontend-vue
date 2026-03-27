<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ProfilePage from "./profile/index.vue";
import { branchesApi, companiesApi } from "@/api/resources";
import { branchInitialForm, type BranchFormData } from "@/core/schemas";
import { useAuthStore } from "@/stores/auth";
import type { BranchRecord } from "@/types/api";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const branchScoped = computed(() => String(route.name ?? "").startsWith("branch."));
const branchId = computed(() => {
  const fromParam = Number(route.params.id);
  if (Number.isFinite(fromParam) && fromParam > 0) return fromParam;
  if (branchScoped.value) {
    const fromContext = Number(authStore.activeContext?.branch_id ?? authStore.user?.branches?.[0]?.id ?? 0);
    return fromContext > 0 ? fromContext : 0;
  }
  return 0;
});
const companyScoped = computed(() => String(route.name ?? "").startsWith("company."));
const scopedCompanyId = computed(() => (companyScoped.value ? Number(authStore.user?.companies?.[0]?.id ?? 0) : 0));

const loadingBranch = ref(true);
const loadError = ref("");
const form = ref<BranchFormData>(branchInitialForm());
const companyOptions = ref<Array<{ id: number; name: string }>>([]);
const users = ref<BranchRecord["users"]>([]);
const usersCount = ref(0);
const branchUserLimit = ref<number | null>(null);
const branchUsersUsedDisplay = ref<number | null>(null);
const sectors = ref<BranchRecord["sectors"]>([]);
const canEditBranch = computed(() => authStore.hasPermission("branches.update") || branchScoped.value);

function back() {
  if (branchScoped.value) {
    router.push({ name: "panels.branch.dashboard" });
    return;
  }
  router.push({ name: companyScoped.value ? "company.branches" : "owner.branches" });
}

function goEdit() {
  if (!canEditBranch.value) return;
  if (branchScoped.value) {
    router.push({ name: "branch.my-branch.edit" });
    return;
  }
  router.push({ name: companyScoped.value ? "company.branches.edit" : "owner.branches.edit", params: { id: String(branchId.value) } });
}

function toHhMm(v: string): string {
  const m = String(v ?? "").trim().match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "08:00";
}

function fillFormFromBranch(data: Awaited<ReturnType<typeof branchesApi.getById>>) {
  const branch = data.branch as BranchRecord | undefined;
  if (!branch) return;
  form.value = {
    company_id: branch.company_id ?? 0,
    name: branch.name ?? "",
    cnpj: branch.cnpj ?? "",
    zip_code: branch.zip_code ?? "",
    street: branch.street ?? "",
    street_number: branch.street_number ?? "",
    neighborhood: branch.neighborhood ?? "",
    city: branch.city ?? "",
    state: branch.state ?? "",
    expedient_start_time: toHhMm(branch.expedient_start_time ?? "08:00"),
    expedient_end_time: toHhMm(branch.expedient_end_time ?? "18:00"),
    store_open_time: toHhMm(branch.store_open_time ?? "09:00"),
    store_close_time: toHhMm(branch.store_close_time ?? "18:00"),
    user_limit: Number(branch.user_limit) > 0 ? Number(branch.user_limit) : 1,
  };
  users.value = branch.users ?? [];
  branchUserLimit.value = branch.user_limit != null ? Number(branch.user_limit) : null;
  branchUsersUsedDisplay.value =
    branch.users_used != null ? Number(branch.users_used) : (branch.users?.length ?? 0);
  usersCount.value = branchUsersUsedDisplay.value;
  sectors.value = branch.sectors ?? [];
}

function loadBranch() {
  loadError.value = "";
  loadingBranch.value = true;

  if (!branchId.value) {
    loadError.value = "Filial inválida.";
    loadingBranch.value = false;
    return;
  }

  branchesApi
    .getById(branchId.value)
    .then(fillFormFromBranch)
    .catch(() => (loadError.value = "Filial não encontrada."))
    .finally(() => (loadingBranch.value = false));
}

onMounted(async () => {
  if (companyScoped.value && scopedCompanyId.value > 0) {
    const companyName = authStore.user?.companies?.[0]?.name ?? "Minha empresa";
    companyOptions.value = [{ id: scopedCompanyId.value, name: companyName }];
  } else {
    const companies = await companiesApi.plucks();
    companyOptions.value = companies
      .map((c) => ({ id: c.id, name: c.name ?? `Empresa #${c.id}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  loadBranch();
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Visualizar filial</h1>
          <p class="text-muted mb-0 small">Consulta dos dados cadastrais da filial.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button v-if="canEditBranch" variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingBranch" class="text-muted">A carregar filial...</div>
      <ProfilePage
        v-else
        :name="form.name"
        :cnpj="form.cnpj"
        :companyName="companyOptions.find((c) => c.id === form.company_id)?.name || ''"
        :zipCode="form.zip_code"
        :street="form.street"
        :streetNumber="form.street_number"
        :neighborhood="form.neighborhood"
        :city="form.city"
        :state="form.state"
        :users="users"
        :usersCount="usersCount"
        :userLimit="branchUserLimit"
        :usersUsedDisplay="branchUsersUsedDisplay"
        :sectors="sectors"
        :subtitle="companyOptions.find((c) => c.id === form.company_id)?.name || ''"
        :onEdit="canEditBranch ? goEdit : undefined"
      />
    </div>
  </DefaultLayout>
</template>
