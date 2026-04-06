<template>
  <b-col cols="12">
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
              @click.prevent="onEdit()"
            >
              <i class="iconoir-edit-pencil fs-18 me-1"></i>Editar
            </a>
          </div>
        </b-row>
      </b-card-header>
      <b-card-body class="pt-0">
        <div v-if="companyName" class="mb-3">
          <p class="text-muted mb-1 small">Empresa</p>
          <b-badge :variant="null" class="border text-gray-700 fs-12 fw-medium">
            {{ companyName }}
          </b-badge>
        </div>
        <ul class="list-unstyled mb-0">
          <li>
            <i class="iconoir-user me-2 text-secondary fs-18 align-middle"></i>
            <b>Nome</b>: {{ employee.name || "—" }}
          </li>
          <li class="mt-2">
            <i class="iconoir-clipboard me-2 text-secondary fs-18 align-middle"></i>
            <b>CPF</b>: {{ cpfDisplay }}
          </li>
          <li class="mt-2">
            <i class="iconoir-mail text-secondary fs-18 align-middle me-2"></i>
            <b>E-mail</b>: {{ employee.email || "—" }}
          </li>
          <li class="mt-2">
            <i class="iconoir-phone text-secondary fs-18 align-middle me-2"></i>
            <b>Telefone</b>: {{ employee.phone || "—" }}
          </li>
          <li class="mt-2">
            <i class="iconoir-briefcase me-2 text-secondary fs-18 align-middle"></i>
            <b>Cargo</b>: {{ (employee.job_title ?? "").trim() || "—" }}
          </li>
          <li v-if="linkedUserLine" class="mt-2">
            <i class="iconoir-user-circle me-2 text-secondary fs-18 align-middle"></i>
            <b>Utilizador</b>: {{ linkedUserLine }}
          </li>
        </ul>

        <div v-if="hasAddress" class="mt-4 pt-3 border-top">
          <p class="text-muted mb-2 small fw-medium">Endereço</p>
          <p class="mb-0">{{ addressBlock }}</p>
        </div>
      </b-card-body>
    </b-card>
  </b-col>
</template>
<script setup lang="ts">
import { computed } from "vue";
import type { EmployeeRecord } from "@/types/api";

const props = defineProps<{
  employee: EmployeeRecord;
  onEdit?: () => void;
}>();

function formatCpfDisplay(digits: string): string {
  const d = String(digits ?? "").replace(/\D/g, "").slice(0, 11);
  if (d.length !== 11) return digits?.trim() || "—";
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

const cpfDisplay = computed(() => formatCpfDisplay(props.employee.cpf ?? ""));
const companyName = computed(() => props.employee.company?.name?.trim() || "");

const linkedUserLine = computed(() => {
  const u = props.employee.user;
  if (!u?.id) return "";
  const name = (u.name ?? "").trim();
  const mail = (u.email ?? "").trim();
  if (name && mail) return `${name} (${mail})`;
  return name || mail || `ID ${u.id}`;
});

const hasAddress = computed(() => {
  const e = props.employee;
  return !!(
    e.street ||
    e.street_number ||
    e.complement ||
    e.neighborhood ||
    e.zip_code ||
    e.city ||
    e.state
  );
});

const addressBlock = computed(() => {
  const e = props.employee;
  const lineStreet = [e.street, e.street_number].filter(Boolean).join(", ");
  const lineStreetComp = [lineStreet, e.complement].filter(Boolean).join(" — ");
  const parts = [
    [lineStreetComp, e.neighborhood].filter(Boolean).join(" — "),
    [e.city, e.state].filter(Boolean).join(" / "),
    e.zip_code ? `CEP ${e.zip_code}` : "",
  ].filter(Boolean);
  return parts.join(" — ") || "—";
});
</script>
