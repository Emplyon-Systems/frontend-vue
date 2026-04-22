type CurrencyType = "₹" | "$" | "€";

export const currency: CurrencyType = "$";

export const currentYear = new Date().getFullYear();

export const developedByLink = "https://mannatthemes.com/";

export const developedBy = "Mannatthemes";

export const contactUs = "mannat.themes@gmail.com";

export const buyLink = "";

export const basePath = "";

export const DEFAULT_PAGE_TITLE =
  "Emplyon | Responsive Admin Dashboard Template";

/** Chaves de localStorage usadas pela auth (partilhadas entre guias; http-client usa para Bearer) */
export const AUTH_STORAGE_KEYS = {
  USER: "emplyon_user",
  TOKEN: "emplyon_token",
  ACTIVE_CONTEXT: "emplyon_active_context",
} as const;
