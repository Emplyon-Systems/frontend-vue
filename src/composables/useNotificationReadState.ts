import { computed, ref, watch } from "vue";
import { getNotificationReadStorageKey, loadNotificationReadIdsFromStorage, saveNotificationReadIdsToStorage } from "@/helpers/notificationReadState";
import { useAuthStore } from "@/stores/auth";

/**
 * Lidas/não lidas persistidas no browser (igual ao sino).
 * Cada id é único (ex. leave-request-1, leave-response-2).
 */
export function useNotificationReadState() {
  const authStore = useAuthStore();
  const readIds = ref<string[]>([]);

  const readStorageKey = computed(() => getNotificationReadStorageKey(Number(authStore.user?.id ?? 0)));

  function reload() {
    readIds.value = loadNotificationReadIdsFromStorage(readStorageKey.value);
  }

  function markRead(id: string) {
    if (readIds.value.includes(id)) return;
    readIds.value = [...readIds.value, id];
    saveNotificationReadIdsToStorage(readStorageKey.value, readIds.value);
  }

  function isRead(id: string) {
    return readIds.value.includes(id);
  }

  function markAll(ids: string[]) {
    if (!ids.length) return;
    readIds.value = Array.from(new Set([...readIds.value, ...ids]));
    saveNotificationReadIdsToStorage(readStorageKey.value, readIds.value);
  }

  watch(
    () => authStore.user?.id,
    () => reload(),
    { immediate: true }
  );

  return { readIds, isRead, markRead, markAll, reload, readStorageKey };
}
