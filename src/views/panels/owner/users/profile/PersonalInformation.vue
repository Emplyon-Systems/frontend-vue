<template>
  <b-col :cols="fullWidth ? 12 : undefined" :md="fullWidth ? 12 : 4">
    <b-card no-body>
      <b-card-header>
        <b-row class="align-items-center">
          <div class="col">
            <b-card-title>Informação pessoal</b-card-title>
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
      <b-card-body class="pt-0">
        <p v-if="description" class="text-muted fw-medium mb-3">
          {{ description }}
        </p>
        <div v-if="companyNames?.length" class="mb-3">
          <p class="text-muted mb-1 small">Empresas vinculadas</p>
          <b-badge
            v-for="company in companyNames"
            :key="company"
            :variant="null"
            class="border text-gray-700 fs-12 fw-medium me-1"
          >
            {{ company }}
          </b-badge>
        </div>
        <div v-if="branchNames?.length" class="mb-3">
          <p class="text-muted mb-1 small">Filiais com acesso</p>
          <b-badge
            v-for="branch in branchNames"
            :key="branch"
            :variant="null"
            class="border text-gray-700 fs-12 fw-medium me-1"
          >
            {{ branch }}
          </b-badge>
        </div>
        <div v-if="sectorNames?.length" class="mb-3">
          <p class="text-muted mb-1 small">Setores</p>
          <b-badge
            v-for="sector in sectorNames"
            :key="sector"
            :variant="null"
            class="border text-gray-700 fs-12 fw-medium me-1"
          >
            {{ sector }}
          </b-badge>
        </div>
        <div v-if="roleNames?.length" class="mb-3">
          <b-badge
            v-for="role in roleNames"
            :key="role"
            :variant="null"
            class="border text-gray-700 fs-12 fw-medium me-1"
          >
            {{ role }}
          </b-badge>
        </div>
        <ul class="list-unstyled mb-0">
          <li class="">
            <i
              class="iconoir-user me-2 text-secondary fs-18 align-middle"
            ></i>
            <b>Nome</b>: {{ name || "—" }}
          </li>
          <li class="mt-2">
            <i
              class="iconoir-mail text-secondary fs-18 align-middle me-2"
            ></i>
            <b>E-mail</b>: {{ email || "—" }}
          </li>
          <li v-if="roleNames?.length" class="mt-2">
            <i
              class="iconoir-medal me-2 text-secondary fs-18 align-middle"
            ></i>
            <b>Perfis</b>:
            <span class="ms-1">{{ roleNames.join(", ") }}</span>
          </li>
          <li v-if="companyNames?.length" class="mt-2">
            <i class="iconoir-building me-2 text-secondary fs-18 align-middle"></i>
            <b>Empresa(s)</b>:
            <span class="ms-1">{{ companyNames.join(", ") }}</span>
          </li>
          <li v-if="branchNames?.length" class="mt-2">
            <i class="iconoir-git-branch me-2 text-secondary fs-18 align-middle"></i>
            <b>Filial(is)</b>:
            <span class="ms-1">{{ branchNames.join(", ") }}</span>
          </li>
          <li v-if="sectorNames?.length" class="mt-2">
            <i class="iconoir-view-grid me-2 text-secondary fs-18 align-middle"></i>
            <b>Setores</b>:
            <span class="ms-1">{{ sectorNames.join(", ") }}</span>
          </li>
        </ul>
        <b-row v-if="showSocial" class="justify-content-center mt-4">
          <div class="col-auto text-end border-end">
            <span
              class="thumb-md justify-content-center d-flex align-items-center bg-blue text-white rounded-circle ms-auto mb-1"
            >
              <i class="fab fa-facebook-f"></i>
            </span>
            <p class="mb-0 fw-semibold">Facebook</p>
            <h4 class="m-0 fw-bold">
              25k <span class="text-muted fs-12 fw-normal">Followers</span>
            </h4>
          </div>
          <div class="col-auto">
            <span
              class="thumb-md justify-content-center d-flex align-items-center bg-black text-white rounded-circle mb-1"
            >
              <i class="fab fa-x-twitter"></i>
            </span>
            <p class="mb-0 fw-semibold">Twitter</p>
            <h4 class="m-0 fw-bold">
              58k <span class="text-muted fs-12 fw-normal">Followers</span>
            </h4>
          </div>
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
    roleNames?: string[];
    companyNames?: string[];
    branchNames?: string[];
    sectorNames?: string[];
    description?: string;
    showSocial?: boolean;
    fullWidth?: boolean;
    onEdit?: () => void;
  }>(),
  {
    roleNames: () => [],
    companyNames: () => [],
    branchNames: () => [],
    sectorNames: () => [],
    showSocial: false,
    fullWidth: false,
  }
);
</script>
