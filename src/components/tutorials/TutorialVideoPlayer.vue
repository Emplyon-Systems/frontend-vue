<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
  videoId: string;
  thumbnail?: string | null;
  title?: string;
}>();

/* ─── estado do player ─── */
const containerRef = ref<HTMLElement | null>(null);
const playerHostRef = ref<HTMLElement | null>(null);
const started     = ref(false);   // usuário clicou em play pela 1ª vez
const playing     = ref(false);
const currentTime = ref(0);
const duration    = ref(0);
const bufferedSec = ref(0);
const volumeLevel = ref(100);
const isMuted     = ref(false);
const isFullscreen = ref(false);
const showCtrl    = ref(true);
const seeking     = ref(false);

let yt: any = null;            // instância YT.Player
let tickId: ReturnType<typeof setInterval> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

/* ─── helpers ─── */
function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}`;
}

const progressPct = computed(() =>
  duration.value ? (currentTime.value / duration.value) * 100 : 0
);
const bufferedPct = computed(() =>
  duration.value ? (bufferedSec.value / duration.value) * 100 : 0
);
const volumeIcon = computed(() => {
  if (isMuted.value || volumeLevel.value === 0) return "iconoir-sound-off";
  if (volumeLevel.value < 50) return "iconoir-sound-low";
  return "iconoir-sound-high";
});

/* ─── YT IFrame API ─── */
function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    const w = window as any;
    if (w.YT?.Player) { resolve(); return; }
    if (!document.getElementById("emplyon-yt-api")) {
      const tag = document.createElement("script");
      tag.id  = "emplyon-yt-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      resolve();
    };
  });
}

function tick() {
  if (!yt) return;
  currentTime.value = yt.getCurrentTime?.() ?? 0;
  duration.value    = yt.getDuration?.()    ?? 0;
  bufferedSec.value = (yt.getVideoLoadedFraction?.() ?? 0) * duration.value;
}

function startTick() {
  if (tickId) return;
  tickId = setInterval(tick, 200);
}

function stopTick() {
  if (tickId) { clearInterval(tickId); tickId = null; }
}

function initPlayer() {
  if (!playerHostRef.value) return;
  yt = new (window as any).YT.Player(playerHostRef.value, {
    videoId: props.videoId,
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      disablekb: 1,
      iv_load_policy: 3,
      cc_load_policy: 0,
      fs: 0,
    },
    events: {
      onReady(e: any) {
        e.target.setVolume(volumeLevel.value);
        e.target.playVideo();
        duration.value = e.target.getDuration();
      },
      onStateChange(e: any) {
        const S = (window as any).YT.PlayerState;
        if (e.data === S.PLAYING) {
          playing.value = true;
          startTick();
          scheduleHide();
        } else {
          playing.value = false;
          stopTick();
          tick();
          showCtrl.value = true;
          clearHideTimer();
        }
      },
    },
  });
}

async function launch() {
  started.value = true;
  await loadYTApi();
  initPlayer();
}

/* ─── controles ─── */
function togglePlay() {
  if (!yt) return;
  if (playing.value) yt.pauseVideo();
  else yt.playVideo();
}

function setVol(val: number) {
  volumeLevel.value = val;
  if (val === 0) { yt?.mute();   isMuted.value = true; }
  else           { yt?.unMute(); isMuted.value = false; yt?.setVolume(val); }
}

function toggleMute() {
  if (isMuted.value || volumeLevel.value === 0) {
    const v = volumeLevel.value || 70;
    volumeLevel.value = v;
    yt?.unMute();
    yt?.setVolume(v);
    isMuted.value = false;
  } else {
    yt?.mute();
    isMuted.value = true;
  }
}

function onProgressClick(e: MouseEvent | TouchEvent) {
  if (!yt || !duration.value) return;
  const bar  = (e.currentTarget as HTMLElement);
  const rect = bar.getBoundingClientRect();
  const x    = (e instanceof MouseEvent ? e.clientX : e.touches[0].clientX) - rect.left;
  const frac = Math.max(0, Math.min(1, x / rect.width));
  const t    = frac * duration.value;
  yt.seekTo(t, true);
  currentTime.value = t;
}

function toggleFullscreen() {
  const el = containerRef.value;
  if (!el) return;
  if (!document.fullscreenElement) el.requestFullscreen?.();
  else document.exitFullscreen?.();
}

/* ─── auto-hide dos controles ─── */
function clearHideTimer() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
}
function scheduleHide() {
  clearHideTimer();
  hideTimer = setTimeout(() => { showCtrl.value = false; }, 3200);
}
function onMouseMove() {
  showCtrl.value = true;
  if (playing.value) scheduleHide();
}

/* ─── ciclo de vida ─── */
onMounted(() => {
  document.addEventListener("fullscreenchange", () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
});

onBeforeUnmount(() => {
  stopTick();
  clearHideTimer();
  yt?.destroy();
});
</script>

<template>
  <!-- Poster: thumbnail + botão play (antes de iniciar) -->
  <div
    v-if="!started"
    class="tvp-poster ratio ratio-16x9"
    role="button"
    tabindex="0"
    aria-label="Reproduzir vídeo"
    @click="launch"
    @keydown.enter.prevent="launch"
    @keydown.space.prevent="launch"
  >
    <img
      v-if="thumbnail"
      :src="thumbnail"
      :alt="title"
      class="tvp-thumb"
      draggable="false"
    >
    <div class="tvp-poster-overlay">
      <div class="tvp-play-btn">
        <i class="iconoir-play-solid tvp-play-icon" aria-hidden="true" />
      </div>
      <span v-if="title" class="tvp-poster-title">{{ title }}</span>
    </div>
  </div>

  <!-- Player ativo -->
  <div
    v-else
    ref="containerRef"
    class="tvp-container"
    :class="{ 'tvp-fullscreen': isFullscreen, 'tvp-hide-cursor': !showCtrl && playing }"
    @mousemove="onMouseMove"
    @touchstart="onMouseMove"
  >
    <!-- iframe do YouTube (apenas frame, sem controles nativos) -->
    <div class="tvp-iframe-wrap ratio ratio-16x9">
      <div ref="playerHostRef" class="tvp-player-host" />
    </div>

    <!-- Clique no centro para play/pause -->
    <div class="tvp-click-area" @click="togglePlay" />

    <!-- Controles customizados -->
    <transition name="tvp-ctrl-fade">
      <div v-show="showCtrl || !playing" class="tvp-controls">
        <!-- Barra de progresso -->
        <div
          class="tvp-progress"
          role="slider"
          :aria-valuenow="Math.round(progressPct)"
          aria-valuemin="0"
          aria-valuemax="100"
          @click.stop="onProgressClick"
          @touchstart.stop="onProgressClick"
        >
          <div class="tvp-progress-bg">
            <div class="tvp-progress-buffered" :style="{ width: bufferedPct + '%' }" />
            <div class="tvp-progress-played"   :style="{ width: progressPct  + '%' }">
              <span class="tvp-progress-thumb" />
            </div>
          </div>
        </div>

        <!-- Rodapé dos controles -->
        <div class="tvp-bar d-flex align-items-center gap-3">
          <!-- Play / Pause -->
          <button
            type="button"
            class="tvp-btn"
            :aria-label="playing ? 'Pausar' : 'Reproduzir'"
            @click.stop="togglePlay"
          >
            <i :class="playing ? 'iconoir-pause-solid' : 'iconoir-play-solid'" />
          </button>

          <!-- Tempo -->
          <span class="tvp-time">{{ fmt(currentTime) }} / {{ fmt(duration) }}</span>

          <!-- Spacer -->
          <div class="flex-grow-1" />

          <!-- Volume -->
          <div class="tvp-vol-group d-flex align-items-center gap-1">
            <button
              type="button"
              class="tvp-btn"
              :aria-label="isMuted ? 'Reativar som' : 'Silenciar'"
              @click.stop="toggleMute"
            >
              <i :class="volumeIcon" />
            </button>
            <input
              type="range"
              class="tvp-vol-slider"
              min="0"
              max="100"
              :value="isMuted ? 0 : volumeLevel"
              aria-label="Volume"
              @input.stop="setVol(Number(($event.target as HTMLInputElement).value))"
            >
          </div>

          <!-- Tela cheia -->
          <button
            type="button"
            class="tvp-btn"
            :aria-label="isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'"
            @click.stop="toggleFullscreen"
          >
            <i :class="isFullscreen ? 'iconoir-compress' : 'iconoir-expand'" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ── Poster ────────────────────────────────── */
.tvp-poster {
  cursor: pointer;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #000;
  outline: none;
  position: relative;
}

.tvp-poster:focus-visible {
  box-shadow: 0 0 0 3px var(--bs-primary);
}

.tvp-thumb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.tvp-poster-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.1rem;
  background: rgba(0, 0, 0, 0.3);
  transition: background 0.2s;
}

.tvp-poster:hover .tvp-poster-overlay,
.tvp-poster:focus-visible .tvp-poster-overlay {
  background: rgba(0, 0, 0, 0.44);
}

.tvp-play-btn {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.93);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 28px rgba(0, 0, 0, 0.45);
  transition: transform 0.18s, background 0.18s, box-shadow 0.18s;
}

.tvp-poster:hover .tvp-play-btn,
.tvp-poster:focus-visible .tvp-play-btn {
  transform: scale(1.1);
  background: #fff;
  box-shadow: 0 8px 36px rgba(0, 0, 0, 0.55);
}

.tvp-play-icon {
  font-size: 34px;
  color: var(--bs-primary);
  margin-left: 4px;
  display: block;
  line-height: 1;
}

.tvp-poster-title {
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  text-shadow: 0 1px 6px rgba(0,0,0,0.7);
  max-width: 80%;
  text-align: center;
  line-height: 1.35;
}

/* ── Container do player ─────────────────── */
.tvp-container {
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #000;
  user-select: none;
}

.tvp-container.tvp-fullscreen {
  border-radius: 0;
}

.tvp-container.tvp-hide-cursor {
  cursor: none;
}

/* ── Iframe/Host ─────────────────────────── */
.tvp-iframe-wrap {
  border-radius: 0;
}

.tvp-player-host {
  width: 100%;
  height: 100%;
  pointer-events: none; /* controles ficam por cima */
}

/* Garante que o iframe gerado pelo YT ocupe tudo */
:deep(.tvp-player-host iframe) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

/* ── Área de clique central (play/pause) ─── */
.tvp-click-area {
  position: absolute;
  inset: 0 0 56px 0; /* deixa a faixa de controles livre */
  cursor: pointer;
}

/* ── Controles ───────────────────────────── */
.tvp-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 12px 10px;
  background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.0) 100%);
}

/* Transição fade dos controles */
.tvp-ctrl-fade-enter-active,
.tvp-ctrl-fade-leave-active {
  transition: opacity 0.3s ease;
}
.tvp-ctrl-fade-enter-from,
.tvp-ctrl-fade-leave-to {
  opacity: 0;
}

/* Barra de progresso */
.tvp-progress {
  padding: 8px 0 6px;
  cursor: pointer;
}

.tvp-progress-bg {
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  overflow: visible;
  transition: height 0.15s;
}

.tvp-progress:hover .tvp-progress-bg {
  height: 6px;
}

.tvp-progress-buffered {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  pointer-events: none;
  transition: width 0.3s linear;
}

.tvp-progress-played {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  background: var(--bs-primary);
  border-radius: 999px;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.tvp-progress-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 4px rgba(0,0,0,0.5);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.tvp-progress:hover .tvp-progress-thumb {
  opacity: 1;
}

/* Rodapé da barra */
.tvp-bar {
  height: 36px;
}

.tvp-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #fff;
  font-size: 22px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: background 0.15s, transform 0.12s;
}

.tvp-btn:hover {
  background: rgba(255,255,255,0.14);
  transform: scale(1.08);
}

.tvp-btn:focus-visible {
  outline: 2px solid rgba(255,255,255,0.7);
  outline-offset: 2px;
}

.tvp-time {
  color: rgba(255,255,255,0.88);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Volume */
.tvp-vol-group {
  display: none; /* esconde em mobile */
}

@media (min-width: 480px) {
  .tvp-vol-group {
    display: flex;
  }
}

.tvp-vol-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 72px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255,255,255,0.3);
  outline: none;
  cursor: pointer;
  accent-color: var(--bs-primary);
}

.tvp-vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 3px rgba(0,0,0,0.4);
}
</style>
