<template>
  <router-link
    :class="`${isActive && 'active'} ${className}`"
    :to="{ name: item.route?.name, params: item.route?.params }"
  >
    <i class="menu-icon" :class="item.icon" v-if="item.icon" />
    <span> {{ item.label }} </span>
    <b-badge
      :variant="null"
      class="rounded text-success bg-success-subtle ms-1"
      v-if="item.badge"
    >
      {{ item.badge.text }}
    </b-badge>
  </router-link>
</template>

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
</script>
