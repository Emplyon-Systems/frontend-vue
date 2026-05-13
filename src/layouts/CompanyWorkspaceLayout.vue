<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { companiesApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();

const companyId = computed(() => {
  const id = Number(route.params.id);
  return Number.isFinite(id) && id > 0 ? id : 0;
});

const companyName = ref("");

type TabDef = { key: string; label: string; name: string; visible?: boolean };

const tabs = computed<TabDef[]>(() => {
  const can = (slug: string) => authStore.hasPermission(slug);
  const canAny = (slugs: string[]) => slugs.some(can);
  const isSuperadmin = authStore.hasRole("superadmin");

  const main: TabDef[] = [
    { key: "overview", label: "Resumo", name: "owner.company.workspace.overview", visible: true },
    {
      key: "branches",
      label: "Filiais",
      name: "owner.company.workspace.branches",
      visible: isSuperadmin || canAny(["branches.index", "branches.read"]),
    },
    {
      key: "sectors",
      label: "Setores",
      name: "owner.company.workspace.sectors",
      visible: isSuperadmin || canAny(["sectors.index", "sectors.read"]),
    },
    {
      key: "employees",
      label: "Funcionários",
      name: "owner.company.workspace.employees",
      visible: isSuperadmin || canAny(["employees.index", "employees.read"]),
    },
    {
      key: "modality-types",
      label: "Modalidade de domingo",
      name: "owner.company.workspace.modality-types",
      visible: isSuperadmin || canAny(["modality_types.index", "modality_types.read"]),
    },
    {
      key: "scale-types",
      label: "Tipos de escala",
      name: "owner.company.workspace.scale-types",
      visible: isSuperadmin || canAny(["scale_types.index", "scale_types.read"]),
    },
    {
      key: "users",
      label: "Usuarios",
      name: "owner.company.workspace.users",
      visible: isSuperadmin || canAny(["users.index", "users.read"]),
    },
    {
      key: "positions",
      label: "Cargos",
      name: "owner.company.workspace.positions",
      visible: isSuperadmin || canAny(["positions.index", "positions.read"]),
    },
    {
      key: "roles",
      label: "Perfis",
      name: "owner.company.workspace.roles",
      visible: isSuperadmin || canAny(["roles.index", "roles.read"]),
    },
  ];

  return main.filter((t) => t.visible !== false);
});

function tabTo(tab: TabDef) {
  return { name: tab.name, params: { id: String(companyId.value) } };
}

function isTabActive(tab: TabDef): boolean {
  const n = String(route.name ?? "");
  return n === tab.name || n.startsWith(`${tab.name}.`);
}

async function loadCompanyName() {
  if (companyId.value <= 0) {
    companyName.value = "";
    return;
  }
  try {
    const res = await companiesApi.getById(companyId.value);
    companyName.value = res.company?.name?.trim() || `Empresa #${companyId.value}`;
  } catch {
    companyName.value = `Empresa #${companyId.value}`;
  }
}

onMounted(loadCompanyName);
watch(companyId, loadCompanyName);

/* ── Drag-to-scroll nas abas ── */
const tabsScrollRef = ref<HTMLElement | null>(null);
let isDragging = false;
let dragStartX = 0;
let scrollStartX = 0;

function onMouseDown(e: MouseEvent) {
  if (!tabsScrollRef.value) return;
  isDragging = true;
  dragStartX = e.pageX;
  scrollStartX = tabsScrollRef.value.scrollLeft;
  tabsScrollRef.value.style.cursor = "grabbing";
  tabsScrollRef.value.style.userSelect = "none";
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging || !tabsScrollRef.value) return;
  const dx = e.pageX - dragStartX;
  tabsScrollRef.value.scrollLeft = scrollStartX - dx;
}

function onMouseUp() {
  if (!isDragging || !tabsScrollRef.value) return;
  isDragging = false;
  tabsScrollRef.value.style.cursor = "grab";
  tabsScrollRef.value.style.userSelect = "";
}

onMounted(() => {
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
});
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <nav aria-label="breadcrumb" class="mb-2">
        <ol class="breadcrumb mb-0 small">
          <li class="breadcrumb-item">
            <router-link :to="{ name: 'owner.companies' }">Empresas</router-link>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            {{ companyName || "…" }}
          </li>
        </ol>
      </nav>

      <div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
        <div>
          <h1 class="h4 mb-1">{{ companyName || "Empresa" }}</h1>
          <p class="text-muted mb-0 small">Navegue pelas secções da empresa.</p>
        </div>
        <router-link :to="{ name: 'owner.companies' }" class="btn btn-outline-secondary btn-sm">
          Voltar às empresas
        </router-link>
      </div>

      <div v-if="tabs.length" class="company-workspace-tabs-strip mb-3">
        <div ref="tabsScrollRef" class="company-workspace-tabs-scroll" role="tablist" aria-label="Secções da empresa" @mousedown="onMouseDown">
          <router-link
            v-for="tab in tabs"
            :key="tab.key"
            class="company-workspace-tab"
            :class="{ 'company-workspace-tab--active': isTabActive(tab) }"
            role="tab"
            :aria-selected="isTabActive(tab)"
            :to="tabTo(tab)"
          >
            {{ tab.label }}
          </router-link>
        </div>
      </div>

      <router-view />
    </div>
  </DefaultLayout>
</template>

<style scoped>
/* Estilo tipo nav-tabs: inativos só texto; só o ativo tem fundo. Scroll horizontal quando há muitas abas. */
.company-workspace-tabs-strip {
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
}

.company-workspace-tabs-scroll {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.15rem;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0;
  margin-bottom: -1px; /* alinha com a linha inferior */
}

/* Touch: scrollbar quase invisível */
@media (hover: none) {
  .company-workspace-tabs-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  }

  .company-workspace-tabs-scroll::-webkit-scrollbar {
    height: 1px;
  }

  .company-workspace-tabs-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 1px;
  }

  .company-workspace-tabs-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
}

/* Mouse: invisível por padrão, aparece ao passar sobre a faixa */
@media (hover: hover) {
  .company-workspace-tabs-scroll {
    scrollbar-width: none;
    cursor: grab;
  }

  .company-workspace-tabs-scroll::-webkit-scrollbar {
    height: 0;
  }

  .company-workspace-tabs-scroll::-webkit-scrollbar-thumb {
    background: transparent;
  }

  .company-workspace-tabs-strip:hover .company-workspace-tabs-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  }

  .company-workspace-tabs-strip:hover .company-workspace-tabs-scroll::-webkit-scrollbar {
    height: 1px;
  }

  .company-workspace-tabs-strip:hover .company-workspace-tabs-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 1px;
  }

  .company-workspace-tabs-strip:hover .company-workspace-tabs-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
}

.company-workspace-tab {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.85rem;
  margin-bottom: -1px;
  border-radius: 0.375rem 0.375rem 0 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--bs-secondary-color, #6c757d);
  text-decoration: none;
  white-space: nowrap;
  border: 1px solid transparent;
  border-bottom: none;
  background: transparent;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}

.company-workspace-tab:hover:not(.company-workspace-tab--active) {
  color: var(--bs-body-color, #212529);
  border-color: transparent;
}

.company-workspace-tab--active {
  background-color: var(--bs-primary, #0d6efd);
  color: #fff !important;
  font-weight: 600;
  border-color: var(--bs-primary, #0d6efd);
  border-bottom-color: var(--bs-primary, #0d6efd);
}
</style>
