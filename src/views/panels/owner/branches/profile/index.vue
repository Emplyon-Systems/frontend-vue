<template>
  <div>
    <b-row class="justify-content-center">
      <ProfileInfo
        :name="name"
        :cnpj="cnpj"
        :subtitle="subtitle"
        :usersCount="usersCount"
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
                    :onEdit="onEdit"
                    full-width
                  />
                </b-row>
              </b-tab>
              <b-tab title="Usuários">
                <BranchUsersTab :users="users" />
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
import type { BranchRecord } from "@/types/api";

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
    subtitle?: string;
    onEdit?: () => void;
  }>(),
  {
    users: () => [],
    usersCount: 0,
  }
);
</script>
