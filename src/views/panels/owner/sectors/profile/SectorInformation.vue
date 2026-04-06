<template>
  <b-col :cols="fullWidth ? 12 : undefined" :md="fullWidth ? 12 : 4">
    <b-card no-body class="h-100">
      <b-card-header class="pb-2">
        <b-row class="align-items-center">
          <div class="col">
            <b-card-title class="mb-1">Informação do setor</b-card-title>
            <p class="text-muted mb-0 small">
              {{ hideBranchContext ? "Dados principais do setor." : "Dados principais e filial vinculada." }}
            </p>
          </div>
          <div v-if="onEdit" class="col-auto">
            <a
              href="#"
              class="float-end text-muted d-inline-flex text-decoration-underline align-items-center"
              @click.prevent="onEdit?.()"
            >
              <i class="iconoir-edit-pencil fs-18 me-1"></i>Editar
            </a>
          </div>
        </b-row>
      </b-card-header>
      <b-card-body>
        <b-row class="g-3">
          <b-col cols="12" :md="hideBranchContext ? 12 : 6">
            <div class="border rounded p-3 h-100">
              <h6 class="mb-3">Identificação</h6>
              <div class="d-flex align-items-start mb-2">
                <i class="iconoir-git-branch me-2 text-secondary fs-18"></i>
                <div>
                  <p class="text-muted mb-0 small">Nome</p>
                  <p class="mb-0 fw-medium">{{ name || "—" }}</p>
                </div>
              </div>
              <div class="d-flex align-items-start">
                <i class="iconoir-copy me-2 text-secondary fs-18"></i>
                <div>
                  <p class="text-muted mb-0 small">Slug</p>
                  <p class="mb-0 fw-medium"><code class="small">{{ slug || "—" }}</code></p>
                </div>
              </div>
            </div>
          </b-col>
          <b-col v-if="!hideBranchContext" cols="12" md="6">
            <div class="border rounded p-3 h-100">
              <h6 class="mb-3">Vinculação</h6>
              <div class="d-flex align-items-start">
                <i class="iconoir-building me-2 text-secondary fs-18"></i>
                <div>
                  <p class="text-muted mb-0 small">Filial</p>
                  <p class="mb-0 fw-medium">{{ branchName || "—" }}</p>
                </div>
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
    slug?: string;
    branchName?: string;
    fullWidth?: boolean;
    hideBranchContext?: boolean;
    onEdit?: () => void;
  }>(),
  {
    fullWidth: false,
    hideBranchContext: false,
  }
);
</script>
