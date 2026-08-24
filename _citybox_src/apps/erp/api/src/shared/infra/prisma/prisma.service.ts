import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  type PrismaClient,
  PrismaClient as PrismaClientClass,
} from '../../../../generated/prisma/client';
import { tenantScopeExtension } from './tenant-scope.extension';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function extendWithTenantScope(client: PrismaClient) {
  return client.$extends(tenantScopeExtension);
}

/** Cliente com o recorte por organização ligado. */
export type ScopedPrismaClient = ReturnType<typeof extendWithTenantScope>;

/**
 * Tipo do `tx` recebido dentro de `prisma.scoped.$transaction(async (tx) => …)`.
 * O client `$extends`-ado (`ScopedPrismaClient`) não é estruturalmente
 * compatível com `Prisma.TransactionClient` (o tipo do client "cru") — por
 * isso funções que recebem `tx` de uma transação aberta em `prisma.scoped`
 * devem usar este tipo, não `Prisma.TransactionClient`.
 */
export type ScopedTransactionClient = Parameters<
  Parameters<ScopedPrismaClient['$transaction']>[0]
>[0];

@Injectable()
export class PrismaService
  extends (PrismaClientClass as unknown as new (opts: unknown) => PrismaClient)
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Use este cliente em TODO repositório de model tenant-scoped (`Branch`,
   * `Membership`, `BranchAccess`): ele injeta o `organizationId` do contexto da
   * requisição em qualquer query, mesmo que o chamador esqueça.
   *
   * O acesso cru (`this.branch`, `this.membership`, …) fica reservado ao
   * `TenantContextGuard` — que precisa ler antes de existir contexto — e a
   * consultas cross-tenant declaradas com `runWithoutTenantScope`.
   *
   * `$extends` devolve um proxy sobre o mesmo engine e pool: não abre conexão
   * nova nem duplica o cliente.
   */
  readonly scoped: ScopedPrismaClient;

  constructor() {
    super({ adapter: new PrismaPg(pool) });
    this.scoped = extendWithTenantScope(this);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
