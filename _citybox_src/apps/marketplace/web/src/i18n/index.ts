import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR';

void i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': ptBR,
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  defaultNS: 'common',
  ns: Object.keys(ptBR),
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

/** Translate a dotted key like `errors.login.invalid` or `coupons.codeRequired`. */
export function tKey(fullKey: string, options?: Record<string, unknown>): string {
  const [ns, ...rest] = fullKey.split('.');
  if (rest.length === 0) return i18n.t(fullKey, options);
  return i18n.t(rest.join('.'), { ns, ...options });
}

/** Resolve an error key or pass through an already-translated API message. */
export function translateError(message: string): string {
  if (/^(errors|coupons)\./.test(message)) return tKey(message);
  return message;
}

/** Dev-only screen label for `data-screen-label` attributes. */
export function screenLabel(key: string): string {
  return i18n.t(key, { ns: 'screens' });
}
