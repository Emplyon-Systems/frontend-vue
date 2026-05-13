<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import { modalityTypeTemplatesApi } from "@/api/resources";
import { notifySuccess, notifyError } from "@/helpers/notify";

const router = useRouter();

const loading = ref(false);
const name = ref("");
const description = ref("");
const provisionScope = ref<"branch" | "company">("branch");

const fieldErrors = ref<Record<string, string>>({});

function mapApiErrors(err: unknown) {
  const e = err as { response?: { data?: { errors?: Record<string, string[]> } } };
  const raw = e.response?.data?.errors;
  if (!raw) return;
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    next[k] = Array.isArray(v) ? v[0] : String(v);
  }
  fieldErrors.value = next;
}

async function submit() {
  fieldErrors.value = {};
  loading.value = true;
  try {
    await modalityTypeTemplatesApi.create({
      name: name.value.trim(),
      description: description.value.trim() || null,
      provision_scope: provisionScope.value,
    });
    notifySuccess("Template criado.");
    router.push({ name: "owner.modality-type-templates" });
  } catch (err: unknown) {
    mapApiErrors(err);
    notifyError("Não foi possível criar o template. Verifique os campos.");
  } finally {
    loading.value = false;
  }
}

function cancel() {
  router.push({ name: "owner.modality-type-templates" });
}
</script>

<template>
  <DefaultLayout>
    <UIComponentCard title="Novo template de modalidade de domingo">
      <p class="text-muted small mb-3">
        A chave é gerada automaticamente no servidor a partir do nome. Escolha se o template se aplica a
        <strong>cada filial</strong> nova ou a <strong>cada empresa</strong> nova.
      </p>

      <b-form @submit.prevent="submit">
        <b-row class="g-3">
          <b-col cols="12">
            <b-form-group label="Nome" label-for="mtt-name">
              <b-form-input
                id="mtt-name"
                v-model="name"
                type="text"
                required
                placeholder="Ex.: Modalidades padrão retalho"
                :state="fieldErrors.name ? false : null"
              />
              <b-form-invalid-feedback v-if="fieldErrors.name">{{ fieldErrors.name }}</b-form-invalid-feedback>
            </b-form-group>
          </b-col>
          <b-col cols="12" md="6">
            <b-form-group label="Aplica-se a" label-for="mtt-scope-rg">
              <b-form-radio-group id="mtt-scope-rg" v-model="provisionScope" stacked class="mb-0">
                <b-form-radio value="branch">Filial (repete em cada nova filial)</b-form-radio>
                <b-form-radio value="company">Empresa (repete em cada nova empresa)</b-form-radio>
              </b-form-radio-group>
            </b-form-group>
          </b-col>
          <b-col cols="12">
            <b-form-group label="Descrição" label-for="mtt-desc">
              <b-form-textarea id="mtt-desc" v-model="description" rows="2" />
              <small class="text-muted">Opcional.</small>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <b-button type="button" variant="outline-secondary" @click="cancel">Cancelar</b-button>
          <b-button type="submit" variant="primary" :disabled="loading">
            {{ loading ? "A criar…" : "Criar template" }}
          </b-button>
        </div>
      </b-form>
    </UIComponentCard>
  </DefaultLayout>
</template>
