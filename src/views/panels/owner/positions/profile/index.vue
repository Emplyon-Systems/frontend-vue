<script setup lang="ts">
import ProfileInfo from "./ProfileInfo.vue";
import PositionInformation from "./PositionInformation.vue";

withDefaults(
  defineProps<{
    name?: string;
    slug?: string;
    branchName?: string;
    subtitle?: string;
    hideBranchContext?: boolean;
    onEdit?: () => void;
  }>(),
  { hideBranchContext: false }
);
</script>

<template>
  <div>
    <b-row class="justify-content-center">
      <ProfileInfo
        :name="name"
        :subtitle="subtitle"
        :branch-name="branchName"
        :hide-branch-context="hideBranchContext"
      />
    </b-row>

    <b-row class="justify-content-center">
      <b-col cols="12">
        <b-card no-body>
          <b-card-body>
            <b-tabs content-class="pt-3">
              <b-tab title="Informação do cargo" active>
                <b-row class="justify-content-center">
                  <PositionInformation
                    :name="name"
                    :slug="slug"
                    :branch-name="branchName"
                    :hide-branch-context="hideBranchContext"
                    :on-edit="onEdit"
                    full-width
                  />
                </b-row>
              </b-tab>
            </b-tabs>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>
