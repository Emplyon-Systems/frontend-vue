<script setup lang="ts">
withDefaults(
  defineProps<{
    name?: string;
    cnpj?: string;
    companyName?: string;
    zipCode?: string;
    street?: string;
    streetNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    fullWidth?: boolean;
    onEdit?: () => void;
    userLimit?: number | string | null;
    usersUsed?: number | null;
  }>(),
  {
    fullWidth: false,
    userLimit: null,
    usersUsed: null,
  }
);
</script>

<template>
  <b-col :cols="fullWidth ? 12 : undefined" :md="fullWidth ? 12 : 4">
    <b-card no-body class="h-100">
      <b-card-header class="pb-2">
        <b-row class="align-items-center">
          <div class="col">
            <b-card-title class="mb-1">Informação da filial</b-card-title>
            <p class="text-muted mb-0 small">Dados principais, vínculo e localização.</p>
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
          <b-col cols="12" md="6">
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
                  <p class="text-muted mb-0 small">CNPJ</p>
                  <p class="mb-0 fw-medium">{{ cnpj || "—" }}</p>
                </div>
              </div>
            </div>
          </b-col>

          <b-col cols="12" md="6">
            <div class="border rounded p-3 h-100">
              <h6 class="mb-3">Vinculação</h6>
              <div class="d-flex align-items-start">
                <i class="iconoir-building me-2 text-secondary fs-18"></i>
                <div>
                  <p class="text-muted mb-0 small">Empresa vinculada</p>
                  <p class="mb-0 fw-medium">{{ companyName || "—" }}</p>
                </div>
              </div>
              <div class="d-flex align-items-start mt-3">
                <i class="iconoir-community me-2 text-secondary fs-18"></i>
                <div>
                  <p class="text-muted mb-0 small">Limite de usuários (filial)</p>
                  <p class="mb-0 fw-medium">
                    {{ userLimit != null && userLimit !== "" ? userLimit : "—" }}
                    <span v-if="usersUsed != null" class="text-muted small">({{ usersUsed }} em uso)</span>
                  </p>
                </div>
              </div>
            </div>
          </b-col>

          <b-col cols="12">
            <div class="border rounded p-3">
              <h6 class="mb-3">Endereço</h6>
              <b-row class="g-3">
                <b-col cols="12" md="4">
                  <p class="text-muted mb-0 small">CEP</p>
                  <p class="mb-0 fw-medium">{{ zipCode || "—" }}</p>
                </b-col>
                <b-col cols="12" md="5">
                  <p class="text-muted mb-0 small">Logradouro</p>
                  <p class="mb-0 fw-medium">{{ street || "—" }}</p>
                </b-col>
                <b-col cols="12" md="3">
                  <p class="text-muted mb-0 small">Número</p>
                  <p class="mb-0 fw-medium">{{ streetNumber || "—" }}</p>
                </b-col>
                <b-col cols="12" md="4">
                  <p class="text-muted mb-0 small">Bairro</p>
                  <p class="mb-0 fw-medium">{{ neighborhood || "—" }}</p>
                </b-col>
                <b-col cols="12" md="4">
                  <p class="text-muted mb-0 small">Município</p>
                  <p class="mb-0 fw-medium">{{ city || "—" }}</p>
                </b-col>
                <b-col cols="12" md="4">
                  <p class="text-muted mb-0 small">Estado</p>
                  <p class="mb-0 fw-medium">{{ state || "—" }}</p>
                </b-col>
              </b-row>
            </div>
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
  </b-col>
</template>
