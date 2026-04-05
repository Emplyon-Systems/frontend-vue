<template>
  <footer class="footer text-center text-sm-start d-print-none">
    <div class="container-xxl">
      <b-row>
        <b-col cols="12">
          <b-card no-body class="mb-0 rounded-bottom-0">
            <b-card-body>
              <p class="text-muted mb-0 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <span>
                  ©
                  {{ currentYear }}
                  Emplyon
                </span>
                <span class="text-muted d-flex flex-wrap align-items-center gap-2 ms-sm-auto">
                  <router-link
                    v-if="showDocLink"
                    :to="{ name: 'documentation.home' }"
                    class="link-secondary text-decoration-none"
                  >
                    Documentação v1
                  </router-link>
                  <span v-if="showDocLink" class="text-muted opacity-50" aria-hidden="true">·</span>
                  <span>Versão 1.0</span>
                </span>
              </p>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </footer>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { currentYear } from "@/helpers/constants";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
/** Mesmo critério da rota da documentação (`panel: owner` / superadmin). */
const showDocLink = computed(() => auth.hasRole("superadmin"));
</script>
