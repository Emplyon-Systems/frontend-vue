<template>
  <component :is="isInsideCompanyPanelWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">{{ pageTitle }}</h1>
          <p v-if="employeeName" class="text-muted mb-0 small">{{ employeeName }}</p>
        </div>
        <b-button variant="outline-secondary" @click="goBack">Voltar</b-button>
      </div>

      <AppAlert v-if="loadError" variant="danger">{{ loadError }}</AppAlert>
      <div v-else-if="loadingEmployee" class="text-muted">Carregando…</div>

      <b-card v-else>
        <b-card-body>
          <AppAlert v-if="formError" variant="danger" class="mb-3">{{ formError }}</AppAlert>

          <b-form-group label="Data de início" label-for="abs-start">
            <b-form-input id="abs-start" v-model="form.start_date" type="date" required />
          </b-form-group>
          <b-form-group label="Data de término" label-for="abs-end">
            <b-form-input id="abs-end" v-model="form.end_date" type="date" required />
          </b-form-group>
          <p v-if="previewDays != null" class="small text-muted mb-0">
            Período: <strong>{{ previewDays }}</strong> dia(s) — calculado automaticamente ao salvar.
          </p>
          <p v-else class="small text-muted mb-0">Indique início e fim; os dias são calculados no servidor.</p>

          <div class="d-flex gap-2 mt-3">
            <b-button variant="primary" :disabled="submitting" @click="submit">
              {{ submitting ? "Salvando…" : "Salvar" }}
            </b-button>
            <b-button variant="outline-secondary" @click="goBack">Cancelar</b-button>
          </div>
        </b-card-body>
      </b-card>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useCompanyPanelWorkspaceLayout } from "@/composables/useCompanyPanelWorkspace";
import AppAlert from "@/components/AppAlert.vue";
import {
  employeeLeavesApi,
  employeeMedicalCertificatesApi,
  employeeVacationsApi,
  employeesApi,
} from "@/api/resources";
import {
  isAbsencePathKind,
  pathKindToTabKind,
  employeesViewRouteName,
  tabQueryForPathKind,
} from "@/helpers/employeeAbsenceRoutes";
import type { EmployeeLeafRecord, EmployeeMedicalCertificateRecord, EmployeeVacationRecord } from "@/types/api";

const route = useRoute();
const router = useRouter();
const { isInsideCompanyPanelWorkspace } = useCompanyPanelWorkspaceLayout();

const loadingEmployee = ref(true);
const loadError = ref("");
const formError = ref("");
const submitting = ref(false);
const employeeName = ref("");

const employeeId = computed(() => Number(route.params.employeeId));
const kindParam = computed(() => String(route.params.kind ?? ""));
const recordId = computed(() => {
  const r = route.params.recordId;
  return r != null && r !== "" ? Number(r) : 0;
});

const isEdit = computed(() => recordId.value > 0);

const pathKind = computed(() => {
  const k = kindParam.value;
  return isAbsencePathKind(k) ? k : null;
});

const tabKind = computed(() => (pathKind.value ? pathKindToTabKind(pathKind.value) : null));

const pageTitle = computed(() => {
  if (!pathKind.value) return "Registro";
  const base = pathKind.value === "vacations" ? "Férias" : pathKind.value === "medical-certificates" ? "Atestado" : "Afastamento";
  return isEdit.value ? `Editar ${base.toLowerCase()}` : `Novo ${base.toLowerCase()}`;
});

const form = ref({
  start_date: "",
  end_date: "",
});

function daysInclusive(start: string, end: string): number {
  const a = new Date(start + "T12:00:00");
  const b = new Date(end + "T12:00:00");
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

const previewDays = computed(() => {
  const s = form.value.start_date;
  const e = form.value.end_date;
  if (!s || !e || e < s) return null;
  return daysInclusive(s, e);
});

function goBack() {
  const name = employeesViewRouteName(String(route.name ?? ""));
  const q = pathKind.value ? { tab: tabQueryForPathKind(pathKind.value) } : {};
  router.push({ name, params: { id: String(employeeId.value) }, query: q });
}

async function loadEmployee() {
  if (!employeeId.value || Number.isNaN(employeeId.value)) {
    loadError.value = "Funcionário inválido.";
    loadingEmployee.value = false;
    return;
  }
  try {
    const res = await employeesApi.getById(employeeId.value);
    employeeName.value = res.employee?.name ?? "";
  } catch {
    loadError.value = "Funcionário não encontrado.";
  } finally {
    loadingEmployee.value = false;
  }
}

async function loadRecordForEdit() {
  if (!isEdit.value || !tabKind.value || !recordId.value) return;
  formError.value = "";
  loadingEmployee.value = true;
  try {
    let empId = 0;
    if (tabKind.value === "vacation") {
      const res = await employeeVacationsApi.getById(recordId.value);
      const v = res.employeeVacation as EmployeeVacationRecord;
      empId = v.employee_id;
      form.value = {
        start_date: String(v.start_date ?? "").slice(0, 10),
        end_date: String(v.end_date ?? "").slice(0, 10),
      };
    } else if (tabKind.value === "medical") {
      const res = await employeeMedicalCertificatesApi.getById(recordId.value);
      const v = res.employeeMedicalCertificate as EmployeeMedicalCertificateRecord;
      empId = v.employee_id;
      form.value = {
        start_date: String(v.start_date ?? "").slice(0, 10),
        end_date: String(v.end_date ?? "").slice(0, 10),
      };
    } else {
      const res = await employeeLeavesApi.getById(recordId.value);
      const v = res.employeeLeaf as EmployeeLeafRecord;
      empId = v.employee_id;
      form.value = {
        start_date: String(v.start_date ?? "").slice(0, 10),
        end_date: String(v.end_date ?? "").slice(0, 10),
      };
    }
    if (empId !== employeeId.value) {
      loadError.value = "Este registro não pertence a este funcionário.";
    }
  } catch {
    loadError.value = "Registro não encontrado.";
  } finally {
    loadingEmployee.value = false;
  }
}

async function submit() {
  formError.value = "";
  if (!pathKind.value || !tabKind.value) {
    formError.value = "Tipo de registro inválido.";
    return;
  }
  if (!form.value.start_date || !form.value.end_date) {
    formError.value = "Indique as datas de início e término.";
    return;
  }
  if (form.value.end_date < form.value.start_date) {
    formError.value = "A data de término deve ser igual ou posterior à de início.";
    return;
  }
  submitting.value = true;
  try {
    const basePayload = {
      employee_id: employeeId.value,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
    };
    if (tabKind.value === "vacation") {
      if (isEdit.value) {
        await employeeVacationsApi.update(recordId.value, basePayload);
      } else {
        await employeeVacationsApi.create(basePayload);
      }
    } else if (tabKind.value === "medical") {
      if (isEdit.value) {
        await employeeMedicalCertificatesApi.update(recordId.value, basePayload);
      } else {
        await employeeMedicalCertificatesApi.create(basePayload);
      }
    } else {
      if (isEdit.value) {
        await employeeLeavesApi.update(recordId.value, basePayload);
      } else {
        await employeeLeavesApi.create(basePayload);
      }
    }
    goBack();
  } catch (e: unknown) {
    const err = e as { response?: { data?: { errors?: Record<string, string[]>; msg?: string } } };
    const val = err.response?.data?.errors;
    if (val && typeof val === "object") {
      formError.value = Object.values(val)
        .flat()
        .filter(Boolean)
        .join(" ");
    } else {
      formError.value = err.response?.data?.msg || "Não foi possível salvar.";
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  loadError.value = "";
  if (!pathKind.value) {
    loadError.value = "Tipo de registro inválido.";
    loadingEmployee.value = false;
    return;
  }
  await loadEmployee();
  if (loadError.value) return;
  if (isEdit.value) {
    await loadRecordForEdit();
  }
});
</script>
