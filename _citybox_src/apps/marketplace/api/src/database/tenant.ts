import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/tenant/client.js';

export type TenantPrisma = PrismaClient;

export type { StoreSettings, StoreRole, StoreUserRole } from '../generated/tenant/client.js';
export { StoreTheme, StoreBrandAccent } from '../generated/tenant/client.js';

let tenantPool: Pool | undefined;
let tenantClient: TenantPrisma | undefined;

function resolveTenantDatabaseUrl(): string {
  if (process.env.TENANT_DATABASE_URL) {
    return process.env.TENANT_DATABASE_URL;
  }
  const template =
    process.env.TENANT_DATABASE_URL_TEMPLATE ??
    'postgresql://citybox:citybox@127.0.0.1:15433/{db}';
  return template.replace('{db}', 'ilheus_dev');
}

export function getTenantClient(): TenantPrisma {
  if (tenantClient) {
    return tenantClient;
  }
  const connectionString = resolveTenantDatabaseUrl();
  tenantPool = new Pool({ connectionString });
  const adapter = new PrismaPg(tenantPool);
  tenantClient = new PrismaClient({ adapter });
  return tenantClient;
}

/** @deprecated Use getTenantClient — dbName is ignored in single-tenant mode. */
export function createTenantClient(_dbName?: string): TenantPrisma {
  return getTenantClient();
}

export async function disconnectTenantPools() {
  if (tenantPool) {
    await tenantPool.end();
    tenantPool = undefined;
    tenantClient = undefined;
  }
}
