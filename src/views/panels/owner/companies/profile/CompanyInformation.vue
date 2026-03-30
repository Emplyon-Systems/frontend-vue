<template>
  <b-col :cols="fullWidth ? 12 : undefined" :md="fullWidth ? 12 : 4">
    <b-card no-body class="h-100">
      <b-card-header class="pb-2">
        <b-row class="align-items-center">
          <div class="col">
            <b-card-title class="mb-1">Informação da empresa</b-card-title>
            <p class="text-muted mb-0 small">Dados principais, contacto, localização e utilização do plano.</p>
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
                <i class="iconoir-building me-2 text-secondary fs-18"></i>
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
              <h6 class="mb-3">Contacto</h6>
              <div class="d-flex align-items-start mb-2">
                <i class="iconoir-mail me-2 text-secondary fs-18"></i>
                <div>
                  <p class="text-muted mb-0 small">E-mail</p>
                  <p class="mb-0 fw-medium">{{ email || "—" }}</p>
                </div>
              </div>
              <div class="d-flex align-items-start">
                <i class="iconoir-phone me-2 text-secondary fs-18"></i>
                <div>
                  <p class="text-muted mb-0 small">Telefone</p>
                  <p class="mb-0 fw-medium">{{ phone || "—" }}</p>
                </div>
              </div>
            </div>
          </b-col>

          <b-col v-if="showUsage" cols="12">
            <div class="border rounded p-3">
              <h6 class="mb-3">Utilização do plano</h6>
              <b-row class="g-3">
                <b-col cols="12" md="6">
                  <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <span class="small text-muted">Filiais</span>
                    <span class="small fw-medium">{{ branchesUsed }} / {{ branchLimit }}</span>
                  </div>
                  <div class="progress" style="height: 8px">
                    <div
                      class="progress-bar bg-primary"
                      role="progressbar"
                      :style="{ width: branchBarWidth }"
                      :aria-valuenow="branchesUsed"
                      :aria-valuemin="0"
                      :aria-valuemax="branchLimit"
                    />
                  </div>
                </b-col>
                <b-col cols="12" md="6">
                  <div class="d-flex justify-content-between align-items-baseline mb-1">
                    <span class="small text-muted">Usuários/Funcionários</span>
                    <span class="small fw-medium">{{ usersUsed }} / {{ userLimit }}</span>
                  </div>
                  <div class="progress" style="height: 8px">
                    <div
                      class="progress-bar bg-coral"
                      role="progressbar"
                      :style="{ width: userBarWidth }"
                      :aria-valuenow="usersUsed"
                      :aria-valuemin="0"
                      :aria-valuemax="userLimit"
                    />
                  </div>
                </b-col>
              </b-row>
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
<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    zipCode?: string;
    street?: string;
    streetNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    branchesUsed?: number;
    usersUsed?: number;
    branchLimit?: number;
    userLimit?: number;
    fullWidth?: boolean;
    onEdit?: () => void;
  }>(),
  {
    fullWidth: false,
  }
);

const showUsage = computed(
  () =>
    props.branchLimit != null &&
    props.userLimit != null &&
    props.branchesUsed != null &&
    props.usersUsed != null
);

function pct(used: number | undefined, limit: number | undefined): string {
  const u = Math.max(0, used ?? 0);
  const l = Math.max(1, limit ?? 1);
  return `${Math.min(100, Math.round((u / l) * 100))}%`;
}

const branchBarWidth = computed(() => pct(props.branchesUsed, props.branchLimit));
const userBarWidth = computed(() => pct(props.usersUsed, props.userLimit));
</script>
