<script setup lang="ts">
import ProfileInfo from "./ProfileInfo.vue";
import CompanyInformation from "./CompanyInformation.vue";
import CompanyUsersTab from "./CompanyUsersTab.vue";
import CompanyBranchesTab from "./CompanyBranchesTab.vue";
import type { CompanyRecord } from "@/types/api";

defineProps<{
  name?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  street?: string;
  streetNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  users?: CompanyRecord["users"];
  branches?: CompanyRecord["branches"];
  usersCount?: number;
  sectorsCount?: number;
  branchesCount?: number;
  branchesUsed?: number;
  usersUsed?: number;
  branchLimit?: number;
  userLimit?: number;
  subtitle?: string;
  /** Logo da empresa (URL pública). */
  logoSrc?: string;
  onEdit?: () => void;
}>();
</script>

<template>
  <div>
    <b-row class="justify-content-center">
      <ProfileInfo
        :name="name"
        :email="email"
        :subtitle="subtitle"
        :logoSrc="logoSrc"
        :usersCount="usersCount"
        :sectorsCount="sectorsCount"
        :branchesCount="branchesCount"
        :branchesUsed="branchesUsed"
        :usersUsed="usersUsed"
        :branchLimit="branchLimit"
        :userLimit="userLimit"
      />
    </b-row>

    <b-row class="justify-content-center">
      <b-col cols="12">
        <b-card no-body>
          <b-card-body>
            <b-tabs content-class="pt-3">
              <b-tab title="Informação da empresa" active>
                <b-row class="justify-content-center">
                  <CompanyInformation
                    :name="name"
                    :cnpj="cnpj"
                    :email="email"
                    :phone="phone"
                    :zipCode="zipCode"
                    :street="street"
                    :streetNumber="streetNumber"
                    :neighborhood="neighborhood"
                    :city="city"
                    :state="state"
                    :branchesUsed="branchesUsed"
                    :usersUsed="usersUsed"
                    :branchLimit="branchLimit"
                    :userLimit="userLimit"
                    :onEdit="onEdit"
                    full-width
                  />
                </b-row>
              </b-tab>
              <b-tab title="Usuários">
                <CompanyUsersTab :users="users" />
              </b-tab>
              <b-tab title="Filiais">
                <CompanyBranchesTab :branches="branches" />
              </b-tab>
            </b-tabs>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>
