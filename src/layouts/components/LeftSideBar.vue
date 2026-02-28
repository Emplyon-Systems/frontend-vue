<template>
  <div class="startbar d-print-none" id="startbar">
    <div class="brand">
      <LogoBox />
    </div>
    <div class="startbar-menu">
      <simplebar class="startbar-collapse" id="startbarCollapse" data-simplebar>
        <div class="d-flex align-items-start flex-column w-100">
          <AppMenu :menu-items="menuItems" />
        </div>
      </simplebar>
    </div>
  </div>
  <div class="startbar-overlay d-print-none"></div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import simplebar from "simplebar-vue";
import { getMenuItemsForUser } from "@/helpers/menu";
import { useAuthStore } from "@/stores/auth";
import LogoBox from "@/components/LogoBox.vue";

const authStore = useAuthStore();
const menuItems = computed(() => getMenuItemsForUser(authStore.user?.roles));
</script>
