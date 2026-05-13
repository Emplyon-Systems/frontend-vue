<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { tutorialsApi } from "@/api/resources";
import type { TutorialRecord } from "@/types/api";
import { useTutorialAudience } from "@/composables/useTutorialAudience";
import { youtubeVideoIdFromUrl } from "@/helpers/youtube";
import { notifyError } from "@/helpers/notify";
import TutorialVideoPlayer from "@/components/tutorials/TutorialVideoPlayer.vue";

const props = defineProps<{
  /** Rota para voltar à listagem em cards. */
  listRouteName: string;
}>();

const route  = useRoute();
const router = useRouter();
const { tutorialVisibleForCurrentUser } = useTutorialAudience();

const loading  = ref(true);
const tutorial = ref<TutorialRecord | null>(null);

const tutorialId = computed(() => Number(route.params.id ?? 0));

const videoId = computed(() =>
  tutorial.value ? youtubeVideoIdFromUrl(tutorial.value.url) : null
);

/** Thumbnail de alta qualidade: cadastrada → maxres do YT → hq do YT */
const thumbSrc = computed(() => {
  const t = tutorial.value;
  if (!t) return null;
  if (t.thumbnail) return t.thumbnail;
  if (videoId.value)
    return `https://img.youtube.com/vi/${videoId.value}/hqdefault.jpg`;
  return null;
});

async function load() {
  const id = tutorialId.value;
  if (!id) { router.replace({ name: props.listRouteName }); return; }
  loading.value = true;
  try {
    const res = await tutorialsApi.getById(id);
    const t   = res.tutorial ?? null;
    if (!t || !tutorialVisibleForCurrentUser(t.targets)) {
      notifyError("Tutorial não encontrado ou não disponível para o seu perfil.");
      router.replace({ name: props.listRouteName });
      return;
    }
    tutorial.value = t;
  } catch {
    notifyError("Não foi possível carregar o tutorial.");
    router.replace({ name: props.listRouteName });
  } finally {
    loading.value = false;
  }
}

function back() { router.push({ name: props.listRouteName }); }

watch(() => route.params.id, () => { load(); });
onMounted(load);
</script>

<template>
  <div class="py-4 tutorial-detail-page">
    <div v-if="loading" class="text-body-secondary py-5 text-center">
      Carregando…
    </div>

    <template v-else-if="tutorial">
      <div class="mb-3">
        <b-button variant="outline-secondary" size="sm" @click="back">
          ← Voltar para os tutoriais
        </b-button>
      </div>

      <div class="card border-0 shadow-sm">

        <!-- Cabeçalho e player: padding lateral menor para o player "sangrar" mais -->
        <div class="px-3 px-md-4 pt-3 pt-md-4">
          <header class="mb-3">
            <p v-if="tutorial.category?.name" class="small text-muted mb-1">
              {{ tutorial.category.name }}
            </p>
            <h1 class="h4 fw-semibold mb-0">{{ tutorial.title }}</h1>
          </header>
        </div>

        <!-- Player full-width dentro do card (sem padding lateral) -->
        <div class="tutorial-video-full mb-0">
          <TutorialVideoPlayer
            v-if="videoId"
            :key="String(tutorial.id)"
            :video-id="videoId"
            :thumbnail="thumbSrc"
            :title="tutorial.title"
          />
          <div
            v-else
            class="ratio ratio-16x9 bg-dark d-flex align-items-center justify-content-center"
          >
            <span class="text-white small opacity-75">Vídeo não disponível para reprodução.</span>
          </div>
        </div>

        <!-- Conteúdo textual alinhado à esquerda -->
        <div class="px-3 px-md-4 pb-4 pt-4">

          <hr class="mb-4 mt-0">

          <h2 class="h5 mb-3">Comentários</h2>
          <p class="text-body-secondary mb-5">
            Em breve você poderá deixar dúvidas e sugestões sobre este tutorial. Estamos preparando esta área.
          </p>

          <h2 class="h5 mb-3">Perguntas frequentes</h2>
          <ul class="list-unstyled mb-0">
            <li class="border rounded p-3 mb-2">
              <strong class="d-block mb-2">O vídeo não carrega ou fica em tela preta</strong>
              <p class="mb-0 text-body-secondary small">
                Verifique sua conexão de internet e recarregue a página. Alguns vídeos podem ter
                restrições de região ou de idade definidas pelo autor.
              </p>
            </li>
            <li class="border rounded p-3 mb-2">
              <strong class="d-block mb-2">A tela do Emplyon parece diferente do vídeo</strong>
              <p class="mb-0 text-body-secondary small">
                O produto evolui com o tempo. Se algo não coincidir, use o menu lateral;
                em caso de dúvida, fale com o administrador da sua empresa.
              </p>
            </li>
            <li class="border rounded p-3 mb-0">
              <strong class="d-block mb-2">Posso sugerir um novo tutorial?</strong>
              <p class="mb-0 text-body-secondary small">
                Sim. Quando os comentários estiverem ativos, você poderá indicar temas.
                Até lá, fale com o gestor da sua organização.
              </p>
            </li>
          </ul>

        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tutorial-detail-page {
  max-width: 100%;
  min-width: 0;
}

/* Player ocupa toda a largura interna do card */
.tutorial-video-full {
  width: 100%;
  min-width: 0;
}

/* Remove arredondamento interno para o player "sangrar" nas laterais do card */
.tutorial-video-full :deep(.tvp-poster),
.tutorial-video-full :deep(.tvp-container) {
  border-radius: 0;
}
</style>
