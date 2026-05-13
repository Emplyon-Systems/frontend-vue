<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import DataForm from "./form/DataForm.vue";
import { branchesApi, dayOffModalitiesApi } from "@/api/resources";
import { dayOffModalityInitialForm, validateDayOffModalityForm, type DayOffModalityFormData } from "@/core/schemas";
import { usePanelScope } from "@/composables/usePanelScope";

const router = useRouter();
const { isOwnerWorkspace, isCompanyScoped, isBranchScoped, currentBranchId } = usePanelScope();
const form = ref<DayOffModalityFormData>(dayOffModalityInitialForm());
const errors = ref<Record<string, string>>({});
const branchOptions = ref<Array<{ id: number; name: string; company_name?: string }>>([]);

function listRoute() {
  if (isBranchScoped.value) return "branch.day-off-modalities";
  if (isCompanyScoped.value) return "company.day-off-modalities";
  return "owner.day-off-modalities";
}

async function submit() {
  const valid = validateDayOffModalityForm(form.value, "create");
  if (!valid.success) {
    errors.value = valid.errors as Record<string, string>;
    return;
  }
  await dayOffModalitiesApi.create(valid.data);
  router.push({ name: listRoute() });
}

onMounted(async () => {
  const plucks = await branchesApi.plucks();
  branchOptions.value = (plucks as any[]).map((b) => ({ id: b.id, name: b.name, company_name: b.company_name }));
  if (isBranchScoped.value && currentBranchId.value > 0) form.value.branch_id = currentBranchId.value;
});
</script>

<template>
  <component :is="isOwnerWorkspace ? 'div' : DefaultLayout">
    <div class="py-4">
      <h1 class="h4 mb-3">Nova modalidade de folga</h1>
      <b-form @submit.prevent="submit">
        <DataForm v-model="form" :errors="errors" :branch-options="branchOptions" :lock-branch-id="isBranchScoped ? currentBranchId : null">
          <template #actions>
            <b-button type="submit" variant="primary">Salvar</b-button>
            <b-button type="button" variant="outline-secondary" @click="router.push({ name: listRoute() })">Cancelar</b-button>
          </template>
        </DataForm>
      </b-form>
    </div>
  </component>
</template>
