<template>
  <b-col cols="12">
    <b-card no-body>
      <b-card-body>
        <b-row>
          <b-col lg="4" class="align-self-center mb-3 mb-lg-0">
            <div class="d-flex align-items-center flex-row flex-wrap">
              <div class="position-relative me-3">
                <div
                  v-if="logoSrc"
                  class="rounded-circle overflow-hidden"
                  style="width: 120px; height: 120px;"
                >
                  <img
                    :src="logoSrc"
                    alt=""
                    height="120"
                    width="120"
                    class="rounded-circle"
                  />
                </div>
                <div
                  v-else
                  class="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary"
                  style="width: 120px; height: 120px; font-size: 2.5rem; font-weight: 600;"
                >
                  {{ name ? name.charAt(0).toUpperCase() : "?" }}
                </div>
              </div>
              <div class="">
                <h5 class="fw-semibold fs-22 mb-1">{{ name || "—" }}</h5>
                <p class="mb-0 text-muted fw-medium">{{ subtitle || email || "—" }}</p>
              </div>
            </div>
          </b-col>
          <b-col lg="8" class="ms-auto align-self-center">
            <div class="d-flex justify-content-center">
              <div
                class="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0"
              >
                <h5 class="fw-semibold fs-22 mb-1">{{ usersDisplay }}</h5>
                <p class="text-muted mb-0 fw-medium">Usuários/Funcionários</p>
                <p v-if="userLimit != null" class="text-muted mb-0 small">em uso / limite</p>
              </div>
              <div
                class="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0"
              >
                <h5 class="fw-semibold fs-22 mb-1">{{ sectorsCount }}</h5>
                <p class="text-muted mb-0 fw-medium">Setores</p>
              </div>
              <div
                class="border-dashed rounded border-theme-color p-2 flex-grow-1 flex-basis-0"
              >
                <h5 class="fw-semibold fs-22 mb-1">{{ branchesDisplay }}</h5>
                <p class="text-muted mb-0 fw-medium">Filiais</p>
                <p v-if="branchLimit != null" class="text-muted mb-0 small">em uso / limite</p>
              </div>
            </div>
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
  </b-col>
</template>
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  name?: string;
  email?: string;
  subtitle?: string;
  logoSrc?: string;
  usersCount?: number;
  sectorsCount?: number;
  branchesCount?: number;
  branchesUsed?: number;
  usersUsed?: number;
  branchLimit?: number;
  userLimit?: number;
}>();

const usersDisplay = computed(() => {
  if (props.userLimit != null && props.usersUsed != null) {
    return `${props.usersUsed} / ${props.userLimit}`;
  }
  return String(props.usersCount ?? 0);
});

const branchesDisplay = computed(() => {
  if (props.branchLimit != null && props.branchesUsed != null) {
    return `${props.branchesUsed} / ${props.branchLimit}`;
  }
  return String(props.branchesCount ?? 0);
});
</script>
