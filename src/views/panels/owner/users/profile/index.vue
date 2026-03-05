<template>
  <div>
    <b-row class="justify-content-center">
      <ProfileInfo
        :name="name"
        :email="email"
        :subtitle="subtitle"
        :avatarSrc="avatarSrc"
        :companyNames="companyNames"
        :branchNames="branchNames"
        :roleNames="roleNames"
        :permissionCount="permissions.length"
      />
    </b-row>

    <b-row class="justify-content-center">
      <b-col cols="12">
        <b-card no-body>
          <b-card-body>
            <b-tabs content-class="pt-3">
              <b-tab title="Informação pessoal" active>
                <b-row class="justify-content-center">
                  <PersonalInformation
                    :name="name"
                    :email="email"
                    :roleNames="roleNames"
                    :companyNames="companyNames"
                    :branchNames="branchNames"
                    :description="description"
                    :showSocial="showSocial"
                    :onEdit="onEdit"
                    full-width
                  />
                </b-row>
              </b-tab>
              <b-tab title="Permissões">
                <b-row class="justify-content-center">
                  <PermissionsTab :permissions="permissions" />
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
import ProfileInfo from "./ProfileInfo.vue";
import PersonalInformation from "./PersonalInformation.vue";
import PermissionsTab from "./PermissionsTab.vue";

withDefaults(
  defineProps<{
    name?: string;
    email?: string;
    subtitle?: string;
    avatarSrc?: string;
    roleNames?: string[];
    companyNames?: string[];
    branchNames?: string[];
    permissions?: Array<{ name: string; slug: string }>;
    description?: string;
    showSocial?: boolean;
    onEdit?: () => void;
  }>(),
  {
    roleNames: () => [],
    companyNames: () => [],
    branchNames: () => [],
    permissions: () => [],
    showSocial: false,
  }
);
</script>
