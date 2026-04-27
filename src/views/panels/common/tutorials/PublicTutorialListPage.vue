<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { tutorialsApi } from "@/api/resources";
import type { TutorialRecord } from "@/types/api";
import { useTutorialAudience } from "@/composables/useTutorialAudience";
import { notifyError } from "@/helpers/notify";

const props = defineProps<{
  /** Rota Vue para a página de detalhe (ex.: company.tutorials.detail). */
  detailRouteName: string;
}>();

const router = useRouter();
const { tutorialVisibleForCurrentUser } = useTutorialAudience();

const loading = ref(true);
const items = ref<TutorialRecord[]>([]);
const selectedCategoryId = ref<number | null>(null);
const searchQuery = ref("");

const visibleItems = computed(() => items.value.filter((t) => tutorialVisibleForCurrentUser(t.targets)));

/** Categorias derivadas dos tutoriais visíveis (sem chamada extra à API de categorias). */
const categoryNav = computed(() => {
  const map = new Map<number, { id: number; name: string; count: number }>();
  for (const t of visibleItems.value) {
    const id = t.tutorial_category_id;
    const name = t.category?.name?.trim() || "Sem categoria";
    const cur = map.get(id) ?? { id, name, count: 0 };
    cur.count += 1;
    map.set(id, cur);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pt"));
});

const filteredItems = computed(() => {
  let list = visibleItems.value;
  if (selectedCategoryId.value !== null) {
    list = list.filter((t) => t.tutorial_category_id === selectedCategoryId.value);
  }
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.category?.name?.toLowerCase().includes(q) ?? false)
    );
  }
  return list;
});

const totalVisible = computed(() => visibleItems.value.length);

async function load() {
  loading.value = true;
  try {
    const all: TutorialRecord[] = [];
    let page = 1;
    let lastPage = 1;
    do {
      const res = await tutorialsApi.list({ page, per_page: 50, order_by: "id", order_dir: "asc" });
      const pag = res.tutorials;
      all.push(...(pag?.data ?? []));
      lastPage = pag?.last_page ?? 1;
      page += 1;
    } while (page <= lastPage);
    items.value = all;
  } catch {
    notifyError("Não foi possível carregar os tutoriais.");
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function goDetail(id: number) {
  router.push({ name: props.detailRouteName, params: { id: String(id) } });
}

function selectCategory(id: number | null) {
  selectedCategoryId.value = id;
}

const resultLabel = computed(() => {
  const n = filteredItems.value.length;
  if (n === 0) return "Nenhum resultado";
  if (n === 1) return "1 tutorial";
  return `${n} tutoriais`;
});

onMounted(load);
</script>

<template>
  <div class="py-4 tutorials-page">
    <header class="tutorials-hero mb-4">
      <h1 class="tutorials-hero-title">Tutoriais</h1>
      <p class="tutorials-hero-lead text-muted mb-0">
        Vídeos e materiais para você aproveitar o máximo do Emplyon. Filtre por tema e pesquise quando precisar.
      </p>
    </header>

    <div v-if="loading" class="text-body-secondary py-5 text-center">
      Carregando…
    </div>

    <div v-else-if="!visibleItems.length" class="text-body-secondary py-5 text-center">
      Ainda não há tutoriais disponíveis para o seu perfil.
    </div>

    <div v-else class="tutorials-shell card border-0 shadow-sm">
      <div class="tutorials-main-inner">
        <div class="tutorials-toolbar d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-3 mb-3">
          <div class="tutorials-search-wrap flex-grow-1 min-w-0">
            <label class="visually-hidden" for="tutorials-search">Pesquisar tutoriais</label>
            <i class="tutorials-search-icon iconoir-search" aria-hidden="true" />
            <b-form-input
              id="tutorials-search"
              v-model="searchQuery"
              type="search"
              autocomplete="off"
              placeholder="Pesquisar por título ou categoria…"
              class="tutorials-search-input form-control"
            />
          </div>
          <div class="tutorials-result-pill text-muted small text-sm-end flex-shrink-0">
            {{ resultLabel }}
          </div>
        </div>

        <div class="tutorials-category-tags mb-4">
          <p class="small fw-semibold text-uppercase text-muted letter-tight mb-1">
            Categorias
          </p>
          <p class="small text-muted mb-2">
            Escolha o tema sobre o qual você precisa de ajuda. As opções se reorganizam conforme a largura da tela.
          </p>
          <nav
            class="tutorials-category-tags-nav d-flex flex-wrap gap-2"
            aria-label="Categorias de tutoriais"
          >
            <button
              type="button"
              class="btn btn-sm tutorials-tag rounded-pill px-3"
              :class="selectedCategoryId === null ? 'tutorials-tag--active' : 'tutorials-tag--idle'"
              @click="selectCategory(null)"
            >
              Todas as categorias
              <span
                class="badge ms-1 rounded-pill tutorials-tag-badge"
                :class="selectedCategoryId === null ? 'tutorials-tag-badge--active' : 'tutorials-tag-badge--idle'"
              >
                {{ totalVisible }}
              </span>
            </button>
            <button
              v-for="c in categoryNav"
              :key="c.id"
              type="button"
              class="btn btn-sm tutorials-tag rounded-pill px-3"
              :class="selectedCategoryId === c.id ? 'tutorials-tag--active' : 'tutorials-tag--idle'"
              @click="selectCategory(c.id)"
            >
              {{ c.name }}
              <span
                class="badge ms-1 rounded-pill tutorials-tag-badge"
                :class="selectedCategoryId === c.id ? 'tutorials-tag-badge--active' : 'tutorials-tag-badge--idle'"
              >
                {{ c.count }}
              </span>
            </button>
          </nav>
        </div>

        <p v-if="filteredItems.length === 0" class="tutorials-empty text-body-secondary text-center py-5 mb-0 rounded-3 border border-dashed">
          Nenhum tutorial corresponde à categoria ou à pesquisa.
        </p>

        <div v-else class="row g-4 tutorials-cards-row">
          <div v-for="t in filteredItems" :key="t.id" class="col-12 col-sm-6 col-xl-4">
            <article
              class="tutorial-card h-100 rounded-3 border bg-white overflow-hidden"
              role="button"
              tabindex="0"
              @click="goDetail(t.id)"
              @keydown.enter="goDetail(t.id)"
            >
              <div class="ratio ratio-16x9 tutorial-card-media">
                <img
                  :src="t.thumbnail"
                  :alt="t.title"
                  class="object-fit-cover w-100 h-100"
                  loading="lazy"
                >
              </div>
              <div class="p-3 d-flex flex-column flex-grow-1">
                <span v-if="t.category?.name" class="tutorial-card-meta">{{ t.category.name }}</span>
                <h2 class="tutorial-card-title h6 mb-0 mt-1">{{ t.title }}</h2>
                <span class="tutorial-card-cta small mt-3">Ver conteúdo →</span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tutorials-page {
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}

.tutorials-hero-title {
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 0.35rem;
  color: var(--bs-emphasis-color, #1a1d24);
}

.tutorials-hero-lead {
  font-size: 0.95rem;
  max-width: 42rem;
  line-height: 1.5;
}

.letter-tight {
  letter-spacing: 0.06em;
  font-size: 0.7rem;
}

.tutorials-shell {
  border-radius: 1rem;
  overflow: hidden;
  min-width: 0;
  max-width: 100%;
}

.tutorials-category-tags {
  min-width: 0;
  max-width: 100%;
}

.tutorials-category-tags-nav {
  min-width: 0;
  width: 100%;
}

.tutorials-category-tags-nav .tutorials-tag {
  max-width: 100%;
  white-space: normal;
  text-align: start;
  word-break: break-word;
  hyphens: auto;
}

.tutorials-category-tags .tutorials-tag {
  font-weight: 500;
  line-height: 1.35;
  border-width: 1px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.tutorials-tag--idle {
  background: var(--bs-body-bg, #fff);
  border-color: var(--bs-border-color);
  color: var(--bs-body-color);
}

.tutorials-tag--idle:hover {
  background: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.07);
  border-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.35);
  color: var(--bs-primary);
}

.tutorials-tag--active {
  background: var(--bs-primary);
  border-color: var(--bs-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(var(--bs-primary-rgb, 13, 110, 253), 0.25);
}

.tutorials-tag-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.2em 0.5em;
  vertical-align: middle;
}

.tutorials-tag-badge--idle {
  background: rgba(0, 0, 0, 0.08);
  color: inherit;
}

.tutorials-tag-badge--active {
  background: rgba(255, 255, 255, 0.28);
  color: #fff;
}

.tutorials-main-inner {
  min-width: 0;
  max-width: 100%;
  padding: 1.35rem 1.25rem 1.5rem;
  box-sizing: border-box;
}

.tutorials-cards-row {
  min-width: 0;
  max-width: 100%;
}

.tutorials-cards-row > [class*="col-"] {
  min-width: 0;
}

@media (min-width: 768px) {
  .tutorials-main-inner {
    padding: 1.5rem 1.5rem 2rem;
  }
}

.tutorials-search-wrap {
  position: relative;
  min-width: 0;
}

.tutorials-search-icon {
  position: absolute;
  left: 0.95rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  opacity: 0.45;
  pointer-events: none;
  z-index: 2;
}

.tutorials-search-input {
  padding-left: 2.65rem;
  border-radius: 0.65rem;
  min-height: 2.65rem;
  max-width: 100%;
}

.tutorials-result-pill {
  padding: 0.35rem 0;
}

.tutorials-empty {
  background: var(--bs-tertiary-bg, #f8f9fa);
}

.tutorial-card {
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  max-width: 100%;
}

.tutorial-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0.65rem 1.75rem rgba(0, 0, 0, 0.09);
  border-color: rgba(var(--bs-primary-rgb, 13, 110, 253), 0.35) !important;
}

.tutorial-card:focus-visible {
  outline: 2px solid var(--bs-primary);
  outline-offset: 2px;
}

.tutorial-card-media {
  background: var(--bs-tertiary-bg, #eef1f6);
}

.tutorial-card-meta {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bs-secondary-color);
}

.tutorial-card-title {
  font-weight: 600;
  line-height: 1.35;
  color: var(--bs-emphasis-color);
  overflow-wrap: anywhere;
}

.tutorial-card-cta {
  font-weight: 600;
  color: var(--bs-primary);
}

.object-fit-cover {
  object-fit: cover;
}
</style>
