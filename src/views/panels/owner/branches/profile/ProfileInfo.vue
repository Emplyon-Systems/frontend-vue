<template>
  <b-col cols="12">
    <b-card no-body>
      <b-card-body>
        <b-row>
          <b-col lg="4" class="align-self-center mb-3 mb-lg-0">
            <div class="d-flex align-items-center flex-row flex-wrap">
              <div class="position-relative me-3">
                <div
                  class="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary"
                  style="width: 120px; height: 120px; font-size: 2.5rem; font-weight: 600;"
                >
                  {{ name ? name.charAt(0).toUpperCase() : "?" }}
                </div>
              </div>
              <div class="">
                <h5 class="fw-semibold fs-22 mb-1">{{ name || "—" }}</h5>
                <p class="mb-0 text-muted fw-medium">{{ subtitle || cnpj || "—" }}</p>
              </div>
            </div>
          </b-col>
          <b-col lg="8" class="ms-auto align-self-center">
            <div class="d-flex justify-content-center">
              <div class="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0">
                <h5 class="fw-semibold fs-22 mb-1">{{ usersCount }}</h5>
                <p class="text-muted mb-0 fw-medium">Usuários</p>
              </div>
              <div class="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0">
                <h5 class="fw-semibold fs-22 mb-1">
                  <span>{{ usersCount }}</span>
                  <span class="text-muted fs-16 fw-normal"> / {{ userLimit != null ? userLimit : '∞' }}</span>
                </h5>
                <p class="text-muted mb-0 fw-medium">Limite de usuários</p>
              </div>
              <div class="border-dashed rounded border-theme-color p-2 me-2 flex-grow-1 flex-basis-0">
                <h5 class="fw-semibold fs-22 mb-1">{{ zipCode || "—" }}</h5>
                <p class="text-muted mb-0 fw-medium">CEP</p>
              </div>
              <div class="border-dashed rounded border-theme-color p-2 flex-grow-1 flex-basis-0">
                <h5 class="fw-semibold fs-22 mb-1">{{ state || "—" }}</h5>
                <p class="text-muted mb-0 fw-medium">UF</p>
              </div>
            </div>
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
  </b-col>
</template>

<script setup lang="ts">
defineProps<{
  name?: string;
  cnpj?: string;
  subtitle?: string;
  usersCount?: number;
  userLimit?: number | null;
  zipCode?: string;
  state?: string;
}>();
</script>
