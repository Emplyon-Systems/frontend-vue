<template>
  <div>
    <b-row class="justify-content-center">
      <ProfileInfo
        :name="name"
        :cnpj="cnpj"
        :subtitle="subtitle"
        :logo-src="logoSrc"
        :usersCount="usersCount"
        :userLimit="userLimit"
        :zipCode="zipCode"
        :state="state"
      />
    </b-row>

    <b-row class="justify-content-center">
      <b-col cols="12">
        <b-card no-body>
          <b-card-body>
            <b-tabs content-class="pt-3">
              <b-tab title="Informação da filial" active>
                <b-row class="justify-content-center">
                  <BranchInformation
                    :name="name"
                    :cnpj="cnpj"
                    :companyName="companyName"
                    :zipCode="zipCode"
                    :street="street"
                    :streetNumber="streetNumber"
                    :neighborhood="neighborhood"
                    :city="city"
                    :state="state"
                    :user-limit="userLimit"
                    :users-used="usersUsedDisplay"
                    :onEdit="onEdit"
                    full-width
                  />
                </b-row>
              </b-tab>
              <b-tab title="Usuários">
                <BranchUsersTab :users="users" />
              </b-tab>
              <b-tab v-if="!branchWorkspaceOverview" title="Setores">
                <BranchSectorsTab :sectors="sectors" />
              </b-tab>
              <b-tab title="Horários">
                <BranchScheduleRulesTab :rules="scheduleRules" />
              </b-tab>
              <b-tab v-if="!branchWorkspaceOverview && showEmployeesTab && branchId" title="Funcionários">
                <BranchEmployeesTab :branch-id="branchId" />
              </b-tab>
            </b-tabs>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script setup lang="ts">
import ProfileInfo from "./ProfileInfo.vue";
import BranchInformation from "./BranchInformation.vue";
import BranchUsersTab from "./BranchUsersTab.vue";
import BranchSectorsTab from "./BranchSectorsTab.vue";
import BranchEmployeesTab from "./BranchEmployeesTab.vue";
import BranchScheduleRulesTab from "./BranchScheduleRulesTab.vue";
import type { BranchRecord, BranchScheduleRuleRecord } from "@/types/api";

withDefaults(
  defineProps<{
    name?: string;
    cnpj?: string;
    companyName?: string;
    zipCode?: string;
    street?: string;
    streetNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    users?: BranchRecord["users"];
    usersCount?: number;
    sectors?: BranchRecord["sectors"];
    subtitle?: string;
    logoSrc?: string;
    onEdit?: () => void;
    userLimit?: number | null;
    usersUsedDisplay?: number | null;
    /** ID da filial (para a aba Funcionários). */
    branchId?: number;
    /** Ex.: superadmin — lista API de funcionários desta filial. */
    showEmployeesTab?: boolean;
    /** Regras de expediente / loja (aba Horários). */
    scheduleRules?: BranchScheduleRuleRecord[];
    /** Painel empresa: resumo da filial com tabs superiores — esconde Setores/Funcionários duplicados. */
    branchWorkspaceOverview?: boolean;
  }>(),
  {
    users: () => [],
    usersCount: 0,
    sectors: () => [],
    userLimit: null,
    usersUsedDisplay: null,
    branchId: 0,
    showEmployeesTab: false,
    scheduleRules: () => [],
    branchWorkspaceOverview: false,
  }
);
</script>
