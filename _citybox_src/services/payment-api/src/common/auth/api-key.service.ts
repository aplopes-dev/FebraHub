import { Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual, createHash } from 'node:crypto';
import { DEV_TENANT_ID } from '../../dev/dev-constants.js';

export type ApiClientRecord = {
  sourceSystem: string;
  keyHash: string;
  tenantId: string;
  isAdmin: boolean;
};

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class ApiKeyService {
  private readonly clients: ApiClientRecord[];

  constructor() {
    this.clients = ApiKeyService.parseClients();
  }

  static parseClients(): ApiClientRecord[] {
    const defaultTenant = process.env.PAYMENTS_DEFAULT_TENANT_ID?.trim() ?? DEV_TENANT_ID;
    const rawClients = process.env.PAYMENTS_API_CLIENTS?.trim();
    if (rawClients) {
      let parsed: Record<string, { key: string; tenantId?: string; admin?: boolean }>;
      try {
        parsed = JSON.parse(rawClients) as Record<
          string,
          { key: string; tenantId?: string; admin?: boolean }
        >;
      } catch {
        throw new Error('PAYMENTS_API_CLIENTS contém JSON inválido');
      }
      return Object.entries(parsed).map(([sourceSystem, cfg]) => ({
        sourceSystem,
        keyHash: hashKey(cfg.key),
        tenantId: cfg.tenantId ?? defaultTenant,
        isAdmin: cfg.admin === true,
      }));
    }

    const rawKeys = process.env.PAYMENTS_API_KEYS?.trim();
    if (!rawKeys) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PAYMENTS_API_CLIENTS ou PAYMENTS_API_KEYS é obrigatório em produção');
      }
      const devCoreKey = process.env.PAYMENTS_DEV_CORE_API_KEY?.trim() ?? 'dev-core-api-key';
      const devAdminKey = process.env.PAYMENTS_DEV_ADMIN_API_KEY?.trim() ?? 'dev-admin-key';
      return [
        {
          sourceSystem: 'core-api',
          keyHash: hashKey(devCoreKey),
          tenantId: defaultTenant,
          isAdmin: false,
        },
        {
          sourceSystem: 'admin',
          keyHash: hashKey(devAdminKey),
          tenantId: defaultTenant,
          isAdmin: true,
        },
      ];
    }

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(rawKeys) as Record<string, string>;
    } catch {
      throw new Error('PAYMENTS_API_KEYS contém JSON inválido');
    }
    return Object.entries(parsed).map(([sourceSystem, key]) => ({
      sourceSystem,
      keyHash: hashKey(key),
      tenantId: defaultTenant,
      isAdmin: sourceSystem === 'admin',
    }));
  }

  resolve(apiKey: string): ApiClientRecord {
    const match = this.clients.find((client) => safeEqual(client.keyHash, hashKey(apiKey)));
    if (!match) {
      throw new UnauthorizedException('API Key inválida');
    }
    return match;
  }
}
