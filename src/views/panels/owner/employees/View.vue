<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AppAlert from "@/components/AppAlert.vue";
import ProfilePage from "./profile/index.vue";
import { employeesApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import type { EmployeeRecord } from "@/types/api";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();
const employeeId = computed(() => Number(route.params.id));
const routeName = computed(() => String(route.name ?? ""));
const companyScoped = computed(() => routeName.value.startsWith("company."));
const branchScoped = computed(() => routeName.value.startsWith("branch."));

function employeesListRoute() {
  return branchScoped.value ? "branch.employees" : companyScoped.value ? "company.employees" : "owner.employees";
}

const loadingEmployee = ref(true);
const loadError = ref("");
const employee = ref<EmployeeRecord | null>(null);

const canEdit = computed(() => authStore.hasPermission("employees.update"));

function back() {
  router.push({ name: employeesListRoute() });
}

function goEdit() {
  if (!canEdit.value) return;
  const editName = branchScoped.value ? "branch.employees.edit" : companyScoped.value ? "company.employees.edit" : "owner.employees.edit";
  router.push({ name: editName, params: { id: String(employeeId.value) } });
}

function fillFromEmployee(data: Awaited<ReturnType<typeof employeesApi.getById>>) {
  const e = data.employee as EmployeeRecord | undefined;
  employee.value = e ?? null;
}

function loadEmployee() {
  loadError.value = "";
  loadingEmployee.value = true;
  if (!employeeId.value || Number.isNaN(employeeId.value)) {
    loadError.value = "Funcionário inválido.";
    loadingEmployee.value = false;
    return;
  }
  employeesApi
    .getById(employeeId.value)
    .then(fillFromEmployee)
    .catch(() => (loadError.value = "Funcionário não encontrado."))
    .finally(() => (loadingEmployee.value = false));
}

onMounted(loadEmployee);
</script>

<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Visualizar funcionário</h1>
          <p class="text-muted mb-0 small">Consulta dos dados do funcionário.</p>
        </div>
        <b-button variant="outline-secondary" @click="back">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingEmployee" class="text-muted">Carregando funcionário...</div>
      <ProfilePage
        v-else-if="employee"
        :employee="employee"
        :on-edit="canEdit ? goEdit : undefined"
      />
    </div>
  </component>
</template>
