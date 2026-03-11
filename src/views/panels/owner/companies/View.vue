<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ProfilePage from "./profile/index.vue";
import { companiesApi } from "@/api/resources";
import { companyInitialForm, type CompanyFormData } from "@/core/schemas";
import type { CompanyRecord } from "@/types/api";
import { useAuthStore } from "@/stores/auth";

type CompanyWithStats = CompanyRecord & {
  sectors_count?: number;
  departments_count?: number;
  branches_count?: number;
  filiais_count?: number;
};

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const companyScoped = computed(() => String(route.name ?? "").startsWith("company."));
const scopedCompanyId = computed(() => Number(authStore.activeContext?.company_id ?? authStore.user?.companies?.[0]?.id ?? 0));
const companyId = computed(() => {
  const fromParam = Number(route.params.id);
  if (Number.isFinite(fromParam) && fromParam > 0) return fromParam;
  if (companyScoped.value && scopedCompanyId.value > 0) return scopedCompanyId.value;
  return 0;
});

const loadingCompany = ref(true);
const loadError = ref("");
const form = ref<CompanyFormData>(companyInitialForm());
const companyUsers = ref<CompanyRecord["users"]>([]);
const companyBranches = ref<CompanyRecord["branches"]>([]);
const usersCount = ref(0);
const sectorsCount = ref(0);
const branchesCount = ref(1);
const canEditCompany = computed(() => authStore.hasPermission("companies.update") || companyScoped.value);

function back() {
  router.push({ name: companyScoped.value ? "panels.company.dashboard" : "owner.companies" });
}

function goEdit() {
  if (!canEditCompany.value) return;
  if (companyScoped.value) {
    router.push({ name: "company.my-company.edit" });
    return;
  }
  router.push({ name: "owner.companies.edit", params: { id: String(companyId.value) } });
}

function fillFormFromCompany(data: Awaited<ReturnType<typeof companiesApi.getById>>) {
  const company = data.company as CompanyWithStats | undefined;
  if (!company) return;
  const base = companyInitialForm();
  const next: CompanyFormData = {
    ...base,
    name: company.name ?? "",
    cnpj: company.cnpj ?? "",
    zip_code: company.zip_code ?? "",
    street: company.street ?? "",
    neighborhood: company.neighborhood ?? "",
    city: company.city ?? "",
    state: company.state ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
  };
  next.street_number = company.street_number ?? "";
  form.value = next;
  companyUsers.value = company.users ?? [];
  companyBranches.value = company.branches ?? [];
  usersCount.value = company.users?.length ?? 0;

  const rawSectorsCount = company.sectors_count ?? company.departments_count ?? null;
  sectorsCount.value = Number.isFinite(rawSectorsCount)
    ? Math.max(0, Number(rawSectorsCount))
    : Math.max(1, Math.ceil(usersCount.value / 10));

  const rawBranchesCount = company.branches_count ?? company.filiais_count ?? null;
  branchesCount.value = Number.isFinite(rawBranchesCount)
    ? Math.max(1, Number(rawBranchesCount))
    : 1;
}

function loadCompany() {
  loadError.value = "";
  loadingCompany.value = true;

  if (!companyId.value) {
    loadError.value = "Empresa inválida.";
    loadingCompany.value = false;
    return;
  }

  companiesApi
    .getById(companyId.value)
    .then(fillFormFromCompany)
    .catch(() => (loadError.value = "Empresa não encontrada."))
    .finally(() => (loadingCompany.value = false));
}

onMounted(loadCompany);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Visualizar empresa</h1>
          <p class="text-muted mb-0 small">Consulta dos dados cadastrais da empresa.</p>
        </div>
        <div class="d-flex gap-2">
          <b-button v-if="canEditCompany" variant="outline-primary" @click="goEdit">Editar</b-button>
          <b-button variant="outline-secondary" @click="back">Voltar</b-button>
        </div>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingCompany" class="text-muted">A carregar empresa...</div>
      <ProfilePage
        v-else
        :name="form.name"
        :cnpj="form.cnpj"
        :email="form.email"
        :phone="form.phone"
        :zipCode="form.zip_code"
        :street="form.street"
        :streetNumber="form.street_number ?? ''"
        :neighborhood="form.neighborhood"
        :city="form.city"
        :state="form.state"
        :users="companyUsers"
        :branches="companyBranches"
        :usersCount="usersCount"
        :sectorsCount="sectorsCount"
        :branchesCount="branchesCount"
        :onEdit="canEditCompany ? goEdit : undefined"
      />
    </div>
  </DefaultLayout>
</template>
