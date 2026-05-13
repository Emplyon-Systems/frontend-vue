<script setup lang="ts">
import MenuItem from "@/components/AppMenu/MenuItem.vue";
import type { MenuItemType, SubMenus } from "@/types/menu";
import { useRoute } from "vue-router";
import { ref, watch } from "vue";

const props = defineProps<SubMenus>();

const route = useRoute();

function hasActiveDescendant(item: MenuItemType): boolean {
  const rn = route.name as string | undefined;
  if (item.route?.name && item.route.name === rn) return true;
  if (!item.children?.length) return false;
  return item.children.some((child) => hasActiveDescendant(child));
}

const open = ref(false);
/** Se o utilizador fechou este nível com rota activa dentro, não reabrir ao mudar só entre páginas do mesmo grupo. */
const userCollapsed = ref(false);

watch(
  () => route.name,
  () => {
    const active = hasActiveDescendant(props.item);
    if (!active) {
      open.value = false;
      userCollapsed.value = false;

      return;
    }
    if (!userCollapsed.value) {
      open.value = true;
    }
  },
  { immediate: true, flush: "post" },
);

function toggleCollapsed() {
  const active = hasActiveDescendant(props.item);
  open.value = !open.value;
  if (active) {
    userCollapsed.value = !open.value;
  }
}

const badgeClass = () => {
  const variant = props.item.badge?.variant;
  if (variant === "warning") return "rounded text-warning bg-warning-subtle ms-1";
  if (variant === "danger") return "rounded text-danger bg-danger-subtle ms-1";
  if (variant === "success") return "rounded text-success bg-success-subtle ms-1";
  return "rounded text-primary bg-primary-subtle ms-1";
};
</script>

<template>
  <li :class="className">
    <a
      class="nav-link"
      :class="{ active: hasActiveDescendant(item) }"
      data-bs-toggle="collapse"
      @click.stop.prevent="toggleCollapsed"
      role="button"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="item.key"
    >
      <i class="menu-icon" :class="item.icon" v-if="item.icon" />
      <span>{{ item.label }}</span>

      <b-badge
        :variant="null"
        :class="badgeClass()"
        v-if="item.badge"
      >
        {{ item.badge.text }}
      </b-badge>
    </a>
    <b-collapse :id="item.key" v-model="open">
      <ul :class="subMenuClassName">
        <template v-for="(link, idx) in item.children || []" :key="idx">
          <MenuItemWithChildren
            v-if="link.children"
            :item="link"
            className="nav-item"
            subMenuClassName="nav flex-column"
          />
          <MenuItem
            v-else
            :item="link"
            className="nav-item"
            linkClassName="nav-link"
          />
        </template>
      </ul>
    </b-collapse>
  </li>
</template>
