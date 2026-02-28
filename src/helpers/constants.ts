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

/** Chaves de sessionStorage usadas pela auth (http-client usa para Bearer) */
export const AUTH_STORAGE_KEYS = {
  USER: "emplyon_user",
  TOKEN: "emplyon_token",
} as const;
