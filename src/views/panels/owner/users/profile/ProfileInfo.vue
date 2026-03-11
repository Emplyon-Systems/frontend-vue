<template>
  <b-col cols="12">
    <b-card no-body>
      <b-card-body>
        <b-row>
          <b-col lg="4" class="align-self-center mb-3 mb-lg-0">
            <div class="d-flex align-items-center flex-row flex-wrap">
              <div class="me-3">
                <div
                  v-if="avatarSrc"
                  class="rounded-circle overflow-hidden"
                  style="width: 120px; height: 120px;"
                >
                  <img
                    :src="avatarSrc"
                    alt=""
                    height="120"
                    width="120"
                    class="rounded-circle"
                  />
                </div>
                <div
                  v-else
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
              </div>
            </div>
          </b-col>
          <b-col lg="8" class="ms-auto align-self-center">
            <div class="d-flex justify-content-center">
              <div
                class="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0"
              >
                <h5 class="fw-semibold fs-22 mb-1">{{ companyNames.length }}</h5>
                <p class="text-muted mb-0 fw-medium">Empresas</p>
              </div>
              <div
                class="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0"
              >
                <h5 class="fw-semibold fs-22 mb-1">{{ branchNames.length }}</h5>
                <p class="text-muted mb-0 fw-medium">Filiais</p>
              </div>
              <div
                class="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0"
              >
                <h5 class="fw-semibold fs-22 mb-1">{{ sectorNames.length }}</h5>
                <p class="text-muted mb-0 fw-medium">Setores</p>
              </div>
              <div
                class="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0"
              >
                <h5 class="fw-semibold fs-22 mb-1">{{ roleNames.length }}</h5>
                <p class="text-muted mb-0 fw-medium">Perfis</p>
              </div>
              <div
                class="border-dashed rounded border-theme-color p-2 flex-grow-1 flex-basis-0"
              >
                <h5 class="fw-semibold fs-22 mb-1">{{ permissionCount }}</h5>
                <p class="text-muted mb-0 fw-medium">Permissões</p>
              </div>
            </div>
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
  </b-col>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    name?: string;
    email?: string;
    subtitle?: string;
    avatarSrc?: string;
    companyNames?: string[];
    branchNames?: string[];
    sectorNames?: string[];
    roleNames?: string[];
    permissionCount?: number;
  }>(),
  {
    companyNames: () => [],
    branchNames: () => [],
    sectorNames: () => [],
    roleNames: () => [],
    permissionCount: 0,
  }
);
</script>
