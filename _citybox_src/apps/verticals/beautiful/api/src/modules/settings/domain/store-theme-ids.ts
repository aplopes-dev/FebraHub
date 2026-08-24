export const ALLOWED_THEME_IDS = [
  'purple',
  'rose',
  'emerald',
  'sapphire',
  'amber',
  'burgundy',
  'barber',
  'coral',
] as const;

export type StoreThemeId = (typeof ALLOWED_THEME_IDS)[number];

export const DEFAULT_STORE_THEME_ID: StoreThemeId = 'purple';

export function isStoreThemeId(value: string): value is StoreThemeId {
  return (ALLOWED_THEME_IDS as readonly string[]).includes(value);
}
