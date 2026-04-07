<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useRoute, RouterView } from "vue-router";
import {
  docNavGroups,
  docBreadcrumbLabels,
  isDocNavSubgroup,
  type DocNavSubgroup,
} from "./docNav";

withDefaults(
  defineProps<{
    /** Quando true, esconde o cabeçalho público e adapta altura ao layout do painel (DefaultLayout). */
    embedded?: boolean;
  }>(),
  { embedded: false }
);

const route = useRoute();
const navOpen = ref(false);
/** Submenus abertos (id do subgroup); inicia fechado e abre se a rota atual for filha */
const openSubgroups = ref<Set<string>>(new Set());

const currentDocLabel = computed(() => docBreadcrumbLabels[String(route.name)] ?? "");
const isDocHome = computed(() => route.name === "documentation.home");

function isActive(name: string): boolean {
  return route.name === name;
}

function subgroupContainsActive(sg: DocNavSubgroup): boolean {
  return sg.children.some((c) => c.name === route.name);
}

function toggleSubgroup(id: string) {
  const next = new Set(openSubgroups.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  openSubgroups.value = next;
}

function subgroupIsOpen(sg: DocNavSubgroup): boolean {
  return openSubgroups.value.has(sg.id) || subgroupContainsActive(sg);
}

function syncOpenSubgroupsForRoute() {
  const next = new Set(openSubgroups.value);
  for (const group of docNavGroups) {
    for (const item of group.items) {
      if (isDocNavSubgroup(item) && subgroupContainsActive(item)) {
        next.add(item.id);
      }
    }
  }
  openSubgroups.value = next;
}

watch(
  () => route.name,
  () => syncOpenSubgroupsForRoute(),
  { immediate: true }
);

function onKeyEscape(e: KeyboardEvent) {
  if (e.key === "Escape") navOpen.value = false;
}

onMounted(() => document.addEventListener("keydown", onKeyEscape));
onUnmounted(() => document.removeEventListener("keydown", onKeyEscape));
</script>

<template>
  <div class="doc-app" :class="{ 'doc-app--embedded': embedded }">
    <header v-if="!embedded" class="doc-app-header">
      <div class="doc-app-header-inner">
        <router-link to="/auth/sign-in" class="doc-app-brand">
          <img src="/logohorizontal.svg" alt="Emplyon" class="doc-app-brand-img" />
        </router-link>
        <div class="doc-app-header-actions">
          <button
            type="button"
            class="doc-app-btn-menu"
            aria-label="Abrir menu"
            @click="navOpen = true"
          >
            Menu
          </button>
          <router-link :to="{ name: 'documentation.home' }" class="doc-app-btn-ghost doc-app-hide-sm">
            Doc
          </router-link>
          <router-link to="/auth/sign-in" class="doc-app-btn-primary"> Entrar </router-link>
        </div>
      </div>
    </header>

    <div
      class="doc-app-backdrop"
      :class="{ 'is-open': navOpen }"
      aria-hidden="true"
      @click="navOpen = false"
    />

    <div class="doc-app-body">
      <aside class="doc-app-sidebar" :class="{ 'is-open': navOpen }">
        <p class="doc-app-sidebar-heading">Documentação</p>
        <nav class="doc-app-nav" aria-label="Secções">
          <div v-for="group in docNavGroups" :key="group.id" class="doc-app-nav-group">
            <p class="doc-app-nav-group-title">{{ group.title }}</p>
            <template v-for="item in group.items" :key="isDocNavSubgroup(item) ? item.id : item.name">
              <div v-if="isDocNavSubgroup(item)" class="doc-app-nav-subgroup">
                <button
                  type="button"
                  class="doc-app-nav-subgroup-btn"
                  :class="{ 'is-open': subgroupIsOpen(item), 'has-active-child': subgroupContainsActive(item) }"
                  :aria-expanded="subgroupIsOpen(item)"
                  @click="toggleSubgroup(item.id)"
                >
                  <span class="doc-app-nav-chevron" aria-hidden="true">{{
                    subgroupIsOpen(item) ? "▼" : "▶"
                  }}</span>
                  {{ item.label }}
                </button>
                <div v-show="subgroupIsOpen(item)" class="doc-app-nav-subgroup-children">
                  <RouterLink
                    v-for="ch in item.children"
                    :key="ch.name"
                    :to="{ name: ch.name }"
                    class="doc-app-nav-link doc-app-nav-link-nested"
                    :class="{ 'is-active': isActive(ch.name) }"
                    @click="navOpen = false"
                  >
                    {{ ch.label }}
                  </RouterLink>
                </div>
              </div>
              <RouterLink
                v-else
                :to="{ name: item.name }"
                class="doc-app-nav-link"
                :class="{ 'is-active': isActive(item.name) }"
                @click="navOpen = false"
              >
                {{ item.label }}
              </RouterLink>
            </template>
          </div>
        </nav>
      </aside>

      <div class="doc-app-main-wrap">
        <nav class="doc-app-breadcrumb" aria-label="Localização">
          <RouterLink :to="{ name: 'documentation.home' }" class="doc-app-bc-link">
            Documentação
          </RouterLink>
          <template v-if="!isDocHome && currentDocLabel">
            <span class="doc-app-bc-sep" aria-hidden="true">/</span>
            <span class="doc-app-bc-current">{{ currentDocLabel }}</span>
          </template>
        </nav>

        <main class="doc-app-main">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
/* Escopo global limitado a .doc-app — estilo tipo GitHub / readme profissional */
.doc-app {
  height: 100vh;
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #1f2328;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "Noto Sans",
    Helvetica,
    Arial,
    sans-serif;
  font-size: 16px;
  line-height: 1.6;
  --doc-border: #d1d9e0;
  --doc-muted: #59636e;
  --doc-link: #0969da;
  --doc-code-bg: #f6f8fa;
  --doc-sidebar-bg: #f6f8fa;
  --doc-active-bg: #ddf4ff;
  --doc-active-border: #0969da;
}

.doc-app.doc-app--embedded {
  height: auto;
  min-height: 0;
  overflow: visible;
}

.doc-app.doc-app--embedded .doc-app-body {
  min-height: min(78vh, 920px);
}

.doc-app-header {
  flex-shrink: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid var(--doc-border);
  backdrop-filter: blur(8px);
}

.doc-app-header-inner {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 10px 20px 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.doc-app-brand-img {
  height: 36px;
  width: auto;
  display: block;
}

.doc-app-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.doc-app-btn-menu {
  display: none;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--doc-border);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.doc-app-btn-ghost {
  font-size: 14px;
  font-weight: 600;
  color: var(--doc-link);
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 6px;
  &:hover {
    background: var(--doc-code-bg);
  }
}

.doc-app-btn-primary {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--doc-link);
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 6px;
  &:hover {
    opacity: 0.92;
    color: #fff;
  }
}

.doc-app-body {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: none;
  margin: 0;
  display: grid;
  grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);
  overflow: hidden;
  align-items: stretch;
}

.doc-app-sidebar {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 12px 32px 20px;
  border-right: 1px solid var(--doc-border);
  background: var(--doc-sidebar-bg);
  -webkit-overflow-scrolling: touch;
}

.doc-app-sidebar-heading {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--doc-muted);
  margin: 0 0 12px 8px;
}

.doc-app-nav-group {
  margin-bottom: 20px;
}

.doc-app-nav-group-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--doc-muted);
  margin: 0 0 6px 8px;
}

.doc-app-nav-subgroup {
  margin: 4px 0 6px;
}

.doc-app-nav-subgroup-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  color: #424a53;
  cursor: pointer;
  &:hover {
    background: #eaeef2;
  }
  &.has-active-child {
    color: var(--doc-link);
  }
}

.doc-app-nav-chevron {
  font-size: 9px;
  opacity: 0.65;
  width: 12px;
  flex-shrink: 0;
}

.doc-app-nav-subgroup-children {
  padding: 2px 0 4px 6px;
  border-left: 2px solid var(--doc-border);
  margin: 2px 0 4px 10px;
}

.doc-app-nav-link {
  display: block;
  padding: 6px 10px;
  margin: 2px 0;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2328;
  text-decoration: none;
  border-left: 2px solid transparent;
  &:hover {
    background: #eaeef2;
  }
  &.is-active {
    background: var(--doc-active-bg);
    color: var(--doc-link);
    font-weight: 600;
    border-left-color: var(--doc-active-border);
  }
}

.doc-app-nav-link-nested {
  font-size: 13px;
  padding: 5px 8px;
  margin: 1px 0;
}

.doc-app-main-wrap {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 40px 64px 36px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.doc-app-breadcrumb {
  font-size: 13px;
  color: var(--doc-muted);
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.doc-app-bc-sep {
  margin: 0 2px;
  color: var(--doc-border);
}

.doc-app-bc-link {
  color: var(--doc-link);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.doc-app-bc-current {
  color: #1f2328;
  font-weight: 600;
}

.doc-app-main {
  max-width: none;
  width: 100%;
}

/* Largura confortável só para texto corrido; tabelas e pre usam a área útil toda */
.doc-app .doc-article > p,
.doc-app .doc-article > ul,
.doc-app .doc-article > ol,
.doc-app .doc-article > h1,
.doc-app .doc-article > h2,
.doc-app .doc-article > h3,
.doc-app .doc-article > .doc-lead,
.doc-app .doc-article > .doc-callout {
  max-width: 75ch;
}

/* Tipografia do artigo — aplicada a filhos do RouterView */
.doc-app .doc-article {
  color: #1f2328;
}

.doc-app .doc-article h1 {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.25;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--doc-border);
  letter-spacing: -0.02em;
}

.doc-app .doc-article h2 {
  font-size: 1.35rem;
  font-weight: 700;
  margin: 32px 0 12px;
  line-height: 1.3;
}

.doc-app .doc-article h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 24px 0 8px;
}

.doc-app .doc-article p {
  margin: 0 0 14px;
}

.doc-app .doc-article ul,
.doc-app .doc-article ol {
  margin: 0 0 14px;
  padding-left: 1.5rem;
}

.doc-app .doc-article li {
  margin-bottom: 6px;
}

.doc-app .doc-article .doc-lead {
  font-size: 1.05rem;
  color: var(--doc-muted);
  margin-bottom: 20px;
}

.doc-app .doc-article code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.9em;
  background: var(--doc-code-bg);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e6eaef;
}

.doc-app .doc-article pre.doc-pre {
  background: var(--doc-code-bg);
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
  margin: 14px 0;
}

.doc-app .doc-article pre.doc-pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: inherit;
}

.doc-app .doc-article .doc-table-wrap {
  overflow-x: auto;
  margin: 14px 0 20px;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
}

.doc-app .doc-article table.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.doc-app .doc-article table.doc-table th,
.doc-app .doc-article table.doc-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--doc-border);
  vertical-align: top;
}

.doc-app .doc-article table.doc-table th {
  background: var(--doc-code-bg);
  font-weight: 600;
}

.doc-app .doc-article table.doc-table tr:last-child td {
  border-bottom: none;
}

.doc-app .doc-article .doc-callout {
  border-left: 4px solid var(--doc-link);
  padding: 10px 14px;
  margin: 16px 0;
  background: #f6f8fa;
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  color: #424a53;
}

.doc-app .doc-article .doc-next-links {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--doc-border);
  font-size: 14px;
}

.doc-app .doc-article .doc-next-links a {
  color: var(--doc-link);
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.doc-app-backdrop {
  display: none;
}

@media (max-width: 991.98px) {
  .doc-app-hide-sm {
    display: none;
  }

  .doc-app-btn-menu {
    display: inline-block;
  }

  .doc-app-body {
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
  }

  .doc-app-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(300px, 90vw);
    z-index: 60;
    height: auto;
    max-height: none;
    border-right: 1px solid var(--doc-border);
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.12);
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    &.is-open {
      transform: translateX(0);
    }
  }

  .doc-app-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(0, 0, 0, 0.35);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    &.is-open {
      opacity: 1;
      pointer-events: auto;
    }
  }

  .doc-app-main-wrap {
    flex: 1;
    min-height: 0;
    padding: 16px 16px 48px;
  }
}
</style>
