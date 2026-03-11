<template>
  <footer class="footer text-center text-sm-start d-print-none">
    <div class="container-xxl">
      <b-row>
        <b-col cols="12">
          <b-card no-body class="mb-0 rounded-bottom-0">
            <b-card-body>
              <p class="text-muted mb-0">
                ©
                {{ currentYear }}
                Emplyon
                <span class="text-muted d-none d-sm-inline-block float-end">
                  Versão 1.0
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
import { currentYear } from "@/helpers/constants";
</script>
