<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "./DataForm.vue";

const route = useRoute();

const idParam = computed(() => route.params.id as string);
const roleId = computed(() => {
  const id = idParam.value;
  if (id === "new" || id === undefined) return null;
  const n = Number(id);
  return Number.isNaN(n) ? null : n;
});
const isEdit = computed(() => roleId.value !== null);
const pageTitle = computed(() => (isEdit.value ? "Editar perfil" : "Novo perfil"));
const pageDescription = computed(() =>
  isEdit.value ? "Alterar dados e permissões do perfil." : "Criar perfil e vincular permissões."
);
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">{{ pageTitle }}</h1>
          <p class="text-muted mb-0 small">{{ pageDescription }}</p>
        </div>
        <b-button variant="outline-secondary" @click="$router.push({ name: 'owner.roles' })">
          Voltar
        </b-button>
      </div>

      <DataForm :role-id="roleId" />
    </div>
  </DefaultLayout>
</template>
