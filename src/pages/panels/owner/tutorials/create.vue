<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import TutorialThumbnailField from "@/components/tutorials/TutorialThumbnailField.vue";
import { tutorialsApi, tutorialCategoriesApi } from "@/api/resources";
import type { TutorialTargetCode } from "@/api/resources/tutorials";
import { notifySuccess, notifyError } from "@/helpers/notify";

const router = useRouter();
const loading = ref(false);

const tutorial_category_id = ref(0);
const title = ref("");
const url = ref("");
const thumbnail = ref("");
const targets = ref<TutorialTargetCode[]>([]);

const targetOptions: { value: TutorialTargetCode; text: string }[] = [
  { value: "company", text: "Empresa" },
  { value: "branch", text: "Filial" },
  { value: "employee", text: "Colaborador" },
  { value: "all", text: "Todos" },
];

const categorySelectOptions = ref<{ value: number; text: string; disabled?: boolean }[]>([
  { value: 0, text: "Selecione uma categoria…", disabled: true },
]);

function cancel() {
  router.push({ name: "owner.tutorials" });
}

function submit() {
  const cid = Number(tutorial_category_id.value);
  if (cid <= 0 || !title.value.trim() || !url.value.trim() || !thumbnail.value.trim() || targets.value.length === 0) {
    notifyError("Preencha categoria, título, URL, thumbnail e pelo menos um público-alvo.");
    return;
  }
  loading.value = true;
  tutorialsApi
    .create({
      tutorial_category_id: cid,
      title: title.value.trim(),
      url: url.value.trim(),
      thumbnail: thumbnail.value.trim(),
      targets: targets.value,
    })
    .then(() => {
      notifySuccess("Tutorial criado.");
      router.push({ name: "owner.tutorials" });
    })
    .catch(() => notifyError("Não foi possível criar o tutorial."))
    .finally(() => (loading.value = false));
}

onMounted(() => {
  tutorialCategoriesApi.plucks().then((p) => {
    categorySelectOptions.value = [
      { value: 0, text: "Selecione uma categoria…", disabled: true },
      ...p.map((c) => ({ value: c.id, text: c.name })),
    ];
  });
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-4">
        <div>
          <h1 class="h4 fw-semibold mb-1">Novo tutorial</h1>
          <p class="text-muted small mb-0">Conteúdo global do catálogo; a visibilidade depende dos públicos-alvo.</p>
        </div>
        <b-button variant="outline-secondary" size="sm" :disabled="loading" @click="cancel">
          Cancelar
        </b-button>
      </div>

      <div class="card border-0 shadow-sm">
        <div class="card-body p-3 p-md-4 p-lg-5">
          <b-form @submit.prevent="submit">
            <div class="row g-4">
              <div class="col-lg-8">
                <b-form-group label="Categoria" label-for="t-cat" class="mb-3">
                  <b-form-select
                    id="t-cat"
                    v-model="tutorial_category_id"
                    :options="categorySelectOptions"
                    class="form-select"
                    required
                  />
                </b-form-group>

                <b-form-group label="Título" label-for="t-title" class="mb-3">
                  <b-form-input id="t-title" v-model="title" required placeholder="Nome curto do tutorial" />
                </b-form-group>

                <b-form-group label="URL do vídeo ou página" label-for="t-url" class="mb-3">
                  <b-form-input
                    id="t-url"
                    v-model="url"
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=…"
                  />
                </b-form-group>

                <b-form-group label="Públicos-alvo" class="mb-0">
                  <p class="small text-muted mb-2">Quem pode ver este tutorial nos respectivos painéis.</p>
                  <b-form-checkbox-group v-model="targets" :options="targetOptions" class="tutorial-targets-group" />
                </b-form-group>
              </div>

              <div class="col-lg-4">
                <TutorialThumbnailField v-model="thumbnail" :disabled="loading" :video-url="url" />
              </div>
            </div>

            <hr class="my-4">

            <div class="d-flex flex-wrap gap-2">
              <b-button type="submit" variant="primary" :disabled="loading">
                Salvar
              </b-button>
              <b-button type="button" variant="outline-secondary" :disabled="loading" @click="cancel">
                Cancelar
              </b-button>
            </div>
          </b-form>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped>
.tutorial-targets-group :deep(.form-check) {
  display: inline-flex;
  align-items: center;
  margin-right: 1.25rem;
  margin-bottom: 0.35rem;
}
</style>
