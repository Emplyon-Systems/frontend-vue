<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import type { SubMenus } from "@/types/menu";

const props = defineProps<SubMenus>();
const route = useRoute();

const isActive = computed(() => {
  const n = route.name;
  const target = props.item.route?.name;
  if (target != null && n === target) return true;
  const prefix = props.item.activeRouteNamePrefix;
  if (prefix && typeof n === "string" && n.startsWith(prefix)) return true;
  return false;
});

const badgeClass = computed(() => {
  const variant = props.item.badge?.variant;
  if (variant === "warning") return "rounded text-warning bg-warning-subtle ms-1";
  if (variant === "danger") return "rounded text-danger bg-danger-subtle ms-1";
  if (variant === "success") return "rounded text-success bg-success-subtle ms-1";
  return "rounded text-primary bg-primary-subtle ms-1";
});
</script>

<template>
  <router-link
    :class="`${isActive && 'active'} ${className}`"
    :to="{ name: item.route?.name, params: item.route?.params }"
  >
    <i class="menu-icon" :class="item.icon" v-if="item.icon" />
    <span> {{ item.label }} </span>
    <b-badge
      :variant="null"
      :class="badgeClass"
      v-if="item.badge"
    >
      {{ item.badge.text }}
    </b-badge>
  </router-link>
</template>
