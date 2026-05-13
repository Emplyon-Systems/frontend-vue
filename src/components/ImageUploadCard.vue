<script setup lang="ts">
import { ref } from "vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
import { notifyError } from "@/helpers/notify";

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    previewUrl?: string | null;
    uploading?: boolean;
    disabled?: boolean;
    /** Pré-visualização quadrada ou circular (foto de perfil). */
    variant?: "square" | "circle";
  }>(),
  {
    description: "",
    previewUrl: null,
    uploading: false,
    disabled: false,
    variant: "square",
  }
);

const emit = defineEmits<{
  (e: "select", file: File): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const ACCEPT_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPT_EXT = [".jpg", ".jpeg", ".png", ".webp"];

function hasAllowedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPT_EXT.some((ext) => lower.endsWith(ext));
}

function triggerPick() {
  if (props.disabled || props.uploading) return;
  inputRef.value?.click();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  const mimeOk = ACCEPT_MIME.includes((file.type || "").toLowerCase());
  const extOk = hasAllowedExtension(file.name);
  if (!mimeOk && !extOk) {
    notifyError("Use JPEG, PNG ou WebP.");
    return;
  }
  emit("select", file);
}
</script>

<template>
  <UIComponentCard :title="title">
    <p v-if="description" class="text-muted small mb-3">{{ description }}</p>
    <div class="d-flex flex-wrap align-items-start gap-3">
      <div
        class="bg-light border d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
        :class="variant === 'circle' ? 'rounded-circle' : 'rounded'"
        :style="{
          width: variant === 'circle' ? '120px' : '160px',
          height: variant === 'circle' ? '120px' : '96px',
        }"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          :alt="title"
          class="w-100 h-100"
          :style="{ objectFit: variant === 'circle' ? 'cover' : 'contain' }"
        />
        <span v-else class="text-muted small px-2 text-center">Sem imagem</span>
      </div>
      <div>
        <input
          ref="inputRef"
          type="file"
          class="d-none"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          @change="onFileChange"
        />
        <b-button
          type="button"
          variant="outline-primary"
          size="sm"
          :disabled="disabled || uploading"
          @click="triggerPick"
        >
          {{ uploading ? "Enviando…" : previewUrl ? "Alterar imagem" : "Carregar imagem" }}
        </b-button>
        <div class="small text-muted mt-2">JPEG, PNG ou WebP</div>
      </div>
    </div>
  </UIComponentCard>
</template>
