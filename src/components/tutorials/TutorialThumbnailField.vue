<script setup lang="ts">
import { ref } from "vue";
import { tutorialsApi } from "@/api/resources";
import { notifyError } from "@/helpers/notify";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    disabled?: boolean;
    videoUrl?: string;
  }>(),
  {
    disabled: false,
    videoUrl: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
}>();

const uploading = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

const ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

function triggerPick() {
  if (props.disabled || uploading.value) return;
  inputRef.value?.click();
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  uploading.value = true;
  try {
    const prev = props.modelValue?.trim() || undefined;
    const data = await tutorialsApi.uploadThumbnail(file, prev);
    if (!data.thumbnail_url) {
      notifyError("Resposta inválida do servidor.");
      return;
    }
    emit("update:modelValue", data.thumbnail_url);
  } catch {
    notifyError("Não foi possível enviar a imagem.");
  } finally {
    uploading.value = false;
  }
}

function suggestFromYoutube() {
  const raw = (props.videoUrl || "").trim();
  if (!raw.includes("youtube") && !raw.includes("youtu.be")) {
    notifyError("Cole primeiro uma URL do YouTube no campo do vídeo.");
    return;
  }
  try {
    const u = new URL(raw);
    let id = u.searchParams.get("v");
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace(/^\//, "").split("/")[0] ?? null;
    }
    if (id) {
      emit("update:modelValue", `https://img.youtube.com/vi/${id}/hqdefault.jpg`);
    }
  } catch {
    notifyError("URL do YouTube inválida.");
  }
}
</script>

<template>
  <div class="tutorial-thumb-field border rounded-3 p-3 bg-light bg-opacity-50">
    <label class="form-label fw-semibold mb-2">Thumbnail</label>
    <p class="small text-muted mb-3">
      Envie uma imagem (salva no servidor) ou use a sugestão do YouTube / URL externa.
    </p>
    <div
      class="ratio ratio-16x9 rounded-2 overflow-hidden bg-white border mb-3 shadow-sm"
      style="max-width: 320px"
    >
      <img
        v-if="modelValue"
        :src="modelValue"
        alt=""
        class="object-fit-cover w-100 h-100"
      >
      <div v-else class="d-flex align-items-center justify-content-center text-muted small">
        Prévia da imagem
      </div>
    </div>
    <div class="d-flex flex-wrap gap-2 mb-2">
      <input
        ref="inputRef"
        type="file"
        class="d-none"
        :accept="ACCEPT"
        :disabled="disabled || uploading"
        @change="onFileChange"
      >
      <b-button
        type="button"
        variant="primary"
        size="sm"
        :disabled="disabled || uploading"
        @click="triggerPick"
      >
        {{ uploading ? "Enviando…" : "Enviar imagem" }}
      </b-button>
      <b-button type="button" variant="outline-secondary" size="sm" :disabled="disabled" @click="suggestFromYoutube">
        Sugerir do YouTube
      </b-button>
    </div>
    <b-form-input
      :model-value="modelValue"
      type="url"
      size="sm"
      placeholder="https://… (URL da imagem)"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', String($event ?? ''))"
    />
    <div class="form-text">JPEG, PNG ou WebP · até 5&nbsp;MB</div>
  </div>
</template>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}
</style>
