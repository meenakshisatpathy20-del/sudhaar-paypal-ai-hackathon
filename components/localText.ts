import type { Lang } from "@/lib/i18n";

/** Text for one UI string in every Sudhaar language. English is the fallback. */
export type L8 = { en: string } & Partial<Record<Lang, string>>;

/** Pick the current language and fill {placeholders}. */
export function lx(s: L8, lang: Lang, vars: Record<string, string | number> = {}) {
  const raw = s[lang] ?? s.en;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
