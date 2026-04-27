<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import { tutorialCategoriesApi } from "@/api/resources";
import { notifySuccess, notifyError } from "@/helpers/notify";

const router = useRouter();
const loading = ref(false);
const name = ref("");
const slug = ref("");
const description = ref("");

function cancel() {
  router.push({ name: "owner.tutorial-categories" });
}

function submit() {
  if (!name.value.trim() || !slug.value.trim()) {
    notifyError("Nome e slug são obrigatórios.");
    return;
  }
  loading.value = true;
  tutorialCategoriesApi
    .create({
      name: name.value.trim(),
      slug: slug.value.trim(),
      description: description.value.trim() || undefined,
    })
    .then(() => {
      notifySuccess("Categoria criada.");
      router.push({ name: "owner.tutorial-categories" });
    })
    .catch(() => notifyError("Não foi possível criar a categoria."))
    .finally(() => (loading.value = false));
}
</script>

<template>
  <DefaultLayout>
    <UIComponentCard title="Nova categoria de tutorial">
      <b-form @submit.prevent="submit">
        <b-form-group label="Nome" label-for="tc-name">
          <b-form-input id="tc-name" v-model="name" required />
        </b-form-group>
        <b-form-group label="Slug" label-for="tc-slug">
          <b-form-input id="tc-slug" v-model="slug" required placeholder="ex.: primeiros-passos" />
        </b-form-group>
        <b-form-group label="Descrição (opcional)" label-for="tc-desc">
          <b-form-textarea id="tc-desc" v-model="description" rows="2" />
        </b-form-group>
        <div class="d-flex gap-2">
          <b-button type="submit" variant="primary" :disabled="loading">
            Salvar
          </b-button>
          <b-button type="button" variant="outline-secondary" :disabled="loading" @click="cancel">
            Cancelar
          </b-button>
        </div>
      </b-form>
    </UIComponentCard>
  </DefaultLayout>
</template>
