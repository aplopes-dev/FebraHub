import { Injectable } from '@nestjs/common';
import { getTenantClient, type TenantPrisma } from '../database/tenant.js';

@Injectable()
export class TenantResolverService {
  async resolve(): Promise<{ client: TenantPrisma }> {
    return { client: getTenantClient() };
  }
}
