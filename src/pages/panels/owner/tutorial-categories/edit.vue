<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import { tutorialCategoriesApi } from "@/api/resources";
import { notifySuccess, notifyError } from "@/helpers/notify";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const loadState = ref(true);
const name = ref("");
const slug = ref("");
const description = ref("");

const id = () => Number(route.params.id ?? 0);

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
    .update(id(), {
      name: name.value.trim(),
      slug: slug.value.trim(),
      description: description.value.trim() || undefined,
    })
    .then(() => {
      notifySuccess("Categoria atualizada.");
      router.push({ name: "owner.tutorial-categories" });
    })
    .catch(() => notifyError("Não foi possível atualizar a categoria."))
    .finally(() => (loading.value = false));
}

onMounted(() => {
  const nid = id();
  if (!nid) {
    cancel();
    return;
  }
  tutorialCategoriesApi
    .getById(nid)
    .then((res) => {
      const c = res.tutorial_category;
      if (!c) throw new Error("empty");
      name.value = c.name;
      slug.value = c.slug;
      description.value = c.description ?? "";
    })
    .catch(() => {
      notifyError("Categoria não encontrada.");
      cancel();
    })
    .finally(() => (loadState.value = false));
});
</script>

<template>
  <DefaultLayout>
    <UIComponentCard title="Editar categoria de tutorial">
      <div v-if="loadState" class="text-body-secondary py-4">
        Carregando…
      </div>
      <b-form v-else @submit.prevent="submit">
        <b-form-group label="Nome" label-for="tc-name">
          <b-form-input id="tc-name" v-model="name" required />
        </b-form-group>
        <b-form-group label="Slug" label-for="tc-slug">
          <b-form-input id="tc-slug" v-model="slug" required />
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
