<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { EmployeeRecord } from "@/types/api";
import ProfileInfo from "./ProfileInfo.vue";
import PersonalInformation from "./PersonalInformation.vue";
import AssignmentsTab from "./AssignmentsTab.vue";
import EmployeePeriodRecordsTab from "./EmployeePeriodRecordsTab.vue";
import MoreTab from "./MoreTab.vue";

defineProps<{
  employee: EmployeeRecord;
  onEdit?: () => void;
}>();

const TAB_QUERIES = ["pessoal", "assignments", "vacations", "medical", "leaves", "more"] as const;

const route = useRoute();
const router = useRouter();
const activeTabIndex = ref(0);

function queryToIndex(tab: string | undefined): number {
  if (!tab) return 0;
  const i = TAB_QUERIES.indexOf(tab as (typeof TAB_QUERIES)[number]);
  return i >= 0 ? i : 0;
}

onMounted(() => {
  activeTabIndex.value = queryToIndex(
    typeof route.query.tab === "string" ? route.query.tab : undefined
  );
});

watch(activeTabIndex, (idx) => {
  const q = TAB_QUERIES[idx];
  const next = { ...route.query } as Record<string, string | string[] | undefined>;
  if (idx === 0) {
    delete next.tab;
  } else {
    next.tab = q;
  }
  router.replace({ query: next });
});

watch(
  () => route.query.tab,
  (t) => {
    activeTabIndex.value = queryToIndex(typeof t === "string" ? t : undefined);
  }
);
</script>

<template>
  <div>
    <b-row class="justify-content-center">
      <ProfileInfo :employee="employee" />
    </b-row>

    <b-row class="justify-content-center">
      <b-col cols="12">
        <b-card no-body>
          <b-card-body>
            <b-tabs v-model="activeTabIndex" content-class="pt-3">
              <b-tab title="Informação pessoal">
                <b-row class="justify-content-center">
                  <PersonalInformation :employee="employee" :on-edit="onEdit" />
                </b-row>
              </b-tab>
              <b-tab title="Filiais e setores">
                <b-row class="justify-content-center">
                  <AssignmentsTab :employee="employee" />
                </b-row>
              </b-tab>
              <b-tab title="Férias">
                <b-row class="justify-content-center">
                  <b-col cols="12">
                    <EmployeePeriodRecordsTab :employee-id="employee.id" kind="vacation" />
                  </b-col>
                </b-row>
              </b-tab>
              <b-tab title="Atestados">
                <b-row class="justify-content-center">
                  <b-col cols="12">
                    <EmployeePeriodRecordsTab :employee-id="employee.id" kind="medical" />
                  </b-col>
                </b-row>
              </b-tab>
              <b-tab title="Afastamentos">
                <b-row class="justify-content-center">
                  <b-col cols="12">
                    <EmployeePeriodRecordsTab :employee-id="employee.id" kind="leaf" />
                  </b-col>
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
