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
                <p class="mb-0 text-muted fw-medium">{{ subtitle || "—" }}</p>
              </div>
            </div>
          </b-col>
          <b-col lg="8" class="ms-auto align-self-center">
            <div class="d-flex justify-content-center">
              <div
                class="border-dashed rounded border-theme-color p-2 flex-grow-1 flex-basis-0"
                :class="hideBranchContext ? '' : 'me-2'"
              >
                <h5 class="fw-semibold fs-22 mb-1">{{ usersCount }}</h5>
                <p class="text-muted mb-0 fw-medium">Usuários</p>
              </div>
              <div
                v-if="!hideBranchContext"
                class="border-dashed rounded border-theme-color p-2 flex-grow-1 flex-basis-0"
              >
                <h5 class="fw-semibold fs-22 mb-1">{{ branchName || "—" }}</h5>
                <p class="text-muted mb-0 fw-medium">Filial</p>
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
    subtitle?: string;
    usersCount?: number;
    branchName?: string;
    hideBranchContext?: boolean;
  }>(),
  { hideBranchContext: false }
);
</script>
