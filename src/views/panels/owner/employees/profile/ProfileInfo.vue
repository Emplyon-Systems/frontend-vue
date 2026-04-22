<script setup lang="ts">
import { computed } from "vue";
import type { EmployeeRecord } from "@/types/api";

const props = defineProps<{
  employee: EmployeeRecord;
}>();

const name = computed(() => props.employee.name ?? "");
const email = computed(() => props.employee.email ?? "");
const jobTitle = computed(() => (props.employee.job_title ?? "").trim());
const subtitle = computed(() => props.employee.company?.name?.trim() || "");

const companyCount = computed(() => ((props.employee.company_id ?? 0) > 0 ? 1 : 0));
const branchCount = computed(() => props.employee.branches?.length ?? 0);
const sectorAssignmentCount = computed(() => branchCount.value);
</script>

<template>
  <b-col cols="12">
    <b-card no-body>
      <b-card-body>
        <b-row>
          <b-col lg="4" class="align-self-center mb-3 mb-lg-0">
            <div class="d-flex align-items-center flex-row flex-wrap">
              <div class="me-3">
                <div
                  class="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary"
                  style="width: 120px; height: 120px;"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="56"
                    height="56"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4"></circle>
                    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"></path>
                  </svg>
                </div>
              </div>
              <div class="">
                <h5 class="fw-semibold fs-22 mb-1">{{ name || "—" }}</h5>
                <p class="mb-0 text-muted fw-medium">{{ subtitle || email || "—" }}</p>
                <p v-if="jobTitle" class="mb-0 text-muted small mt-1">{{ jobTitle }}</p>
              </div>
            </div>
          </b-col>
          <b-col lg="8" class="ms-auto align-self-center">
            <div class="d-flex justify-content-center flex-wrap gap-2">
              <div class="border-dashed rounded border-theme-color p-2 flex-grow-1 flex-basis-0" style="min-width: 100px">
                <h5 class="fw-semibold fs-22 mb-1">{{ companyCount }}</h5>
                <p class="text-muted mb-0 fw-medium">Empresa(s)</p>
              </div>
              <div class="border-dashed rounded border-theme-color p-2 flex-grow-1 flex-basis-0" style="min-width: 100px">
                <h5 class="fw-semibold fs-22 mb-1">{{ branchCount }}</h5>
                <p class="text-muted mb-0 fw-medium">Filiais</p>
              </div>
              <div class="border-dashed rounded border-theme-color p-2 flex-grow-1 flex-basis-0" style="min-width: 100px">
                <h5 class="fw-semibold fs-22 mb-1">{{ sectorAssignmentCount }}</h5>
                <p class="text-muted mb-0 fw-medium">Vínculos</p>
              </div>
            </div>
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
  </b-col>
</template>
