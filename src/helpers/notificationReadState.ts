const KEY_PREFIX = "app_notifications_read";

export function getNotificationReadStorageKey(userId: number): string {
  return `${KEY_PREFIX}:${userId > 0 ? String(userId) : "anon"}`;
}

export function loadNotificationReadIdsFromStorage(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotificationReadIdsToStorage(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids));
}
