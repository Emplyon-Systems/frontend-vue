<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { branchesApi } from "@/api/resources";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const authStore = useAuthStore();

const branchId = computed(() => {
  const id = Number(route.params.id ?? 0);
  return Number.isFinite(id) && id > 0 ? id : 0;
});

const branchName = ref("");

type TabDef = { key: string; label: string; name: string; visible?: boolean };

const tabs = computed<TabDef[]>(() => {
  const can = (slug: string) => authStore.hasPermission(slug);
  const canAny = (slugs: string[]) => slugs.some(can);
  const isSuperadmin = authStore.hasRole("superadmin");

  const main: TabDef[] = [
    { key: "summary", label: "Resumo", name: "company.branch.overview", visible: true },
    {
      key: "sectors",
      label: "Setores",
      name: "company.branch.sectors",
      visible: isSuperadmin || canAny(["sectors.index", "sectors.read"]),
    },
    {
      key: "employees",
      label: "Funcionários",
      name: "company.branch.employees",
      visible: isSuperadmin || canAny(["employees.index", "employees.read"]),
    },
    {
      key: "users",
      label: "Usuários",
      name: "company.branch.users",
      visible: isSuperadmin || canAny(["users.index", "users.read"]),
    },
    {
      key: "roles",
      label: "Perfis",
      name: "company.branch.roles",
      visible: isSuperadmin || canAny(["roles.index", "roles.read"]),
    },
    {
      key: "modality-types",
      label: "Modalidade de domingo",
      name: "company.branch.modality-types",
      visible: isSuperadmin || canAny(["modality_types.index", "modality_types.read"]),
    },
    {
      key: "scale-types",
      label: "Tipos de escala",
      name: "company.branch.scale-types",
      visible: isSuperadmin || canAny(["scale_types.index", "scale_types.read"]),
    },
    {
      key: "positions",
      label: "Cargos",
      name: "company.branch.positions",
      visible: isSuperadmin || canAny(["positions.index", "positions.read", "roles.index", "roles.read"]),
    },
  ];

  return main.filter((t) => t.visible !== false);
});

function tabTo(tab: TabDef) {
  return { name: tab.name, params: { id: String(branchId.value) } };
}

function isTabActive(tab: TabDef): boolean {
  const n = String(route.name ?? "");
  if (n === tab.name) return true;
  if (tab.name === "company.branch.overview") return n === "company.branch.overview";
  return n === tab.name || n.startsWith(`${tab.name}.`);
}

async function loadBranchName() {
  if (branchId.value <= 0) {
    branchName.value = "";
    return;
  }
  try {
    const res = await branchesApi.getById(branchId.value);
    branchName.value = res.branch?.name?.trim() || `Filial #${branchId.value}`;
  } catch {
    branchName.value = `Filial #${branchId.value}`;
  }
}

onMounted(loadBranchName);
watch(branchId, loadBranchName);

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
  <div>
    <nav aria-label="breadcrumb" class="mb-2">
      <ol class="breadcrumb mb-0 small">
        <li class="breadcrumb-item">
          <router-link :to="{ name: 'panels.company.dashboard' }">Dashboard</router-link>
        </li>
        <li class="breadcrumb-item">
          <router-link :to="{ name: 'company.branches' }">Filiais</router-link>
        </li>
        <li class="breadcrumb-item active" aria-current="page">
          {{ branchName || "…" }}
        </li>
      </ol>
    </nav>

    <div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
      <div>
        <h1 class="h4 mb-1">{{ branchName || "Filial" }}</h1>
        <p class="text-muted mb-0 small">Secções desta filial.</p>
      </div>
    </div>

    <div v-if="tabs.length" class="company-workspace-tabs-strip mb-3">
      <div
        ref="tabsScrollRef"
        class="company-workspace-tabs-scroll"
        role="tablist"
        aria-label="Secções da filial"
        @mousedown="onMouseDown"
      >
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
</template>

<style scoped>
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
  margin-bottom: -1px;
}

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
}

@media (hover: hover) {
  .company-workspace-tabs-scroll {
    scrollbar-width: none;
    cursor: grab;
  }
  .company-workspace-tabs-scroll::-webkit-scrollbar {
    height: 0;
  }
  .company-workspace-tabs-strip:hover .company-workspace-tabs-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
  }
  .company-workspace-tabs-strip:hover .company-workspace-tabs-scroll::-webkit-scrollbar {
    height: 1px;
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
}

.company-workspace-tab--active {
  background-color: var(--bs-primary, #0d6efd);
  color: #fff !important;
  font-weight: 600;
  border-color: var(--bs-primary, #0d6efd);
}
</style>
