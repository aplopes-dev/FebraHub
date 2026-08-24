import { existsSync, readFileSync } from 'node:fs';

// Carrega .env local (dev) sem dependência externa; envs já definidas prevalecem.
const envFile = new URL('../.env', import.meta.url);
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

const env = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 3102),
  databaseUrl: () =>
    env(
      'CONSUMER_DATABASE_URL',
      'postgresql://citybox:citybox@127.0.0.1:15433/ilheus_dev?schema=consumer',
    ),
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:16379',
  /**
   * Realm próprio do marketplace — `citybox-marketplace` (ADR C-16). É o realm
   * B2C: população de consumidores, inteiramente distinta dos realms de
   * backoffice (admin, erp, clínica, beautiful, imóveis).
   */
  keycloak: {
    /** Base interna usada pelo BFF para falar com o Keycloak (token/admin API). */
    baseUrl: process.env.KEYCLOAK_BASE_URL ?? 'http://127.0.0.1:8180',
    realm: process.env.KEYCLOAK_REALM ?? 'citybox-marketplace',
    /** Client público (PKCE) do app do consumidor. */
    appClientId: process.env.KEYCLOAK_CLIENT_ID ?? 'marketplace-app',
    /**
     * Service account de provisionamento — `manage-users` LIMITADO a este realm.
     * Substitui o antigo `citybox-consumer-admin`/`citybox-core-admin`.
     */
    provisioningClientId:
      process.env.KEYCLOAK_PROVISIONING_CLIENT_ID ?? 'marketplace-provisioning',
    provisioningClientSecret: process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET,
    /**
     * Issuer ÚNICO aceito na validação do JWT (invariante 1 do ADR C-16).
     * A lista `KEYCLOAK_ACCEPTED_ISSUERS` foi removida: aceitar mais de um
     * issuer é aceitar token de mais de um realm. Quando o issuer público
     * difere da base interna (produção), defina `KEYCLOAK_ISSUER`.
     */
    issuer(): string {
      return process.env.KEYCLOAK_ISSUER?.trim() || `${this.baseUrl}/realms/${this.realm}`;
    },
  },
  typesense: {
    host: process.env.TYPESENSE_HOST ?? '127.0.0.1',
    port: Number(process.env.TYPESENSE_PORT ?? 8108),
    protocol: (process.env.TYPESENSE_PROTOCOL ?? 'http') as 'http' | 'https',
    apiKey: process.env.TYPESENSE_API_KEY ?? 'citybox-dev-typesense-key',
    productsCollection: process.env.TYPESENSE_PRODUCTS_COLLECTION ?? 'consumer_products',
  },
  /** Base pública onde o BFF é servido (para montar URLs absolutas ex.: avatar). */
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://127.0.0.1:3102/api',
};
