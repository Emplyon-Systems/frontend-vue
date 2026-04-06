<template>
  <div>
    <b-row class="justify-content-center">
      <ProfileInfo :employee="employee" />
    </b-row>

    <b-row class="justify-content-center">
      <b-col cols="12">
        <b-card no-body>
          <b-card-body>
            <b-tabs content-class="pt-3">
              <b-tab title="Informação pessoal" active>
                <b-row class="justify-content-center">
                  <PersonalInformation :employee="employee" :on-edit="onEdit" />
                </b-row>
              </b-tab>
              <b-tab title="Filiais e setores">
                <b-row class="justify-content-center">
                  <AssignmentsTab :employee="employee" />
                </b-row>
              </b-tab>
              <b-tab title="Mais informações">
                <b-row class="justify-content-center">
                  <b-col cols="12">
                    <MoreTab />
                  </b-col>
                </b-row>
              </b-tab>
            </b-tabs>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>
<script setup lang="ts">
import type { EmployeeRecord } from "@/types/api";
import ProfileInfo from "./ProfileInfo.vue";
import PersonalInformation from "./PersonalInformation.vue";
import AssignmentsTab from "./AssignmentsTab.vue";
import MoreTab from "./MoreTab.vue";

defineProps<{
  employee: EmployeeRecord;
  onEdit?: () => void;
}>();
</script>
