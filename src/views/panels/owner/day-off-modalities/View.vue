<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "./form/DataForm.vue";
import { branchesApi, dayOffModalitiesApi } from "@/api/resources";
import { dayOffModalityInitialForm, type DayOffModalityFormData } from "@/core/schemas";
import { usePanelScope } from "@/composables/usePanelScope";

const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params.id));
const { isOwnerWorkspace, isCompanyScoped, isBranchScoped, currentBranchId } = usePanelScope();
const form = ref<DayOffModalityFormData>(dayOffModalityInitialForm());
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);

function listRoute() {
  if (isBranchScoped.value) return "branch.day-off-modalities";
  if (isCompanyScoped.value) return "company.day-off-modalities";
  return "owner.day-off-modalities";
}

onMounted(async () => {
  const [plucks, one] = await Promise.all([branchesApi.plucks(), dayOffModalitiesApi.getById(id.value)]);
  branchOptions.value = (plucks as any[]).map((b) => ({ id: b.id, name: b.name, company_name: b.company_name }));
  const m = one.dayOffModality;
  form.value = {
    branch_id: m.branch_id,
    name: m.name,
    description: m.description ?? "",
    is_default: !!m.is_default,
  };
  if (isBranchScoped.value && currentBranchId.value > 0) form.value.branch_id = currentBranchId.value;
});
</script>

<template>
  <component :is="isOwnerWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <h1 class="h4 mb-3">Visualizar modalidade de folga</h1>
      <DataForm v-model="form" :branch-options="branchOptions" :lock-branch-id="isBranchScoped ? currentBranchId : null" mode="view" />
      <b-button class="mt-3" variant="outline-secondary" @click="router.push({ name: listRoute() })">Voltar</b-button>
    </div>
  </component>
</template>
