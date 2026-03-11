<template>
  <div>
    <b-row class="justify-content-center">
      <ProfileInfo
        :name="name"
        :subtitle="subtitle"
        :users-count="usersCount"
        :branch-name="branchName"
      />
    </b-row>

    <b-row class="justify-content-center">
      <b-col cols="12">
        <b-card no-body>
          <b-card-body>
            <b-tabs content-class="pt-3">
              <b-tab title="Informação do setor" active>
                <b-row class="justify-content-center">
                  <SectorInformation
                    :name="name"
                    :slug="slug"
                    :branch-name="branchName"
                    :on-edit="onEdit"
                    full-width
                  />
                </b-row>
              </b-tab>
              <b-tab title="Usuários">
                <SectorUsersTab :users="users" />
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
import SectorInformation from "./SectorInformation.vue";
import SectorUsersTab from "./SectorUsersTab.vue";
import type { SectorUser } from "./SectorUsersTab.vue";

withDefaults(
  defineProps<{
    name?: string;
    slug?: string;
    branchName?: string;
    subtitle?: string;
    users?: SectorUser[];
    usersCount?: number;
    onEdit?: () => void;
  }>(),
  {
    users: () => [],
    usersCount: 0,
  }
);
</script>
