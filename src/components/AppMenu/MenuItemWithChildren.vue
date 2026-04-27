<script setup lang="ts">
import { computed, ref } from "vue";
import MenuItem from "@/components/AppMenu/MenuItem.vue";
import type { MenuItemType, SubMenus } from "@/types/menu";
import { useRoute } from "vue-router";
const props = defineProps<SubMenus>();

const visible = ref(false);
const route = useRoute();
const currentRouteName = computed(() => route.name);

function hasActiveDescendant(item: MenuItemType): boolean {
  if (item.route?.name && item.route.name === currentRouteName.value) return true;
  if (!item.children?.length) return false;
  return item.children.some((child) => hasActiveDescendant(child));
}

const toggle = () => {
  return visible.value || hasActiveDescendant(props.item);
};

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
      @click="visible = !visible"
      data-bs-toggle="collapse"
      role="button"
      :aria-expanded="toggle() ? 'true' : 'false'"
      :aria-controls="item.key"
    >
      <i class="menu-icon" :class="item.icon" v-if="item.icon" />
      <span> {{ item.label }} </span>

      <b-badge
        :variant="null"
        :class="badgeClass()"
        v-if="item.badge"
      >
        {{ item.badge.text }}
      </b-badge>
    </a>
    <b-collapse :id="item.key" :visible="toggle()">
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
