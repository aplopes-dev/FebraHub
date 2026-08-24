import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { runWithoutTenantScope } from '../../../../shared/infra/tenancy/tenant-context';
import {
  PosTerminal,
  type PosTerminalProps,
  type PosTerminalStatusValue,
} from '../../domain/entities/pos-terminal.entity';
import {
  PosTerminalRepository,
  type PosTerminalListCriteria,
} from '../../domain/repositories/pos-terminal.repository.interface';

type PosTerminalRow = {
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  status: string;
  printer: string | null;
  scale: string | null;
  nfceContingency: boolean;
  offlineServerId: string | null;
  pairingCode: string | null;
  pairingCodeExpiresAt: Date | null;
  deviceTokenHash: string | null;
  pairedAt: Date | null;
  pairedDeviceLabel: string | null;
  lastSeenAt: Date | null;
  moduleOverrides: unknown;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPosTerminalRepository extends PosTerminalRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<PosTerminal | null> {
    const row = await this.prisma.scoped.posTerminal.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  /**
   * Busca pelo código de pareamento — **sem organização**, porque quem chama é
   * o `redeem`, uma rota pública em que o dispositivo ainda não sabe de que
   * loja é. `runWithoutTenantScope` é obrigatório: sem ele a extensão de
   * tenant-scope lança por falta de contexto.
   */
  async findByPairingCode(code: string): Promise<PosTerminal | null> {
    const row = await runWithoutTenantScope(() =>
      this.prisma.posTerminal.findFirst({
        where: { pairingCode: code.trim().toUpperCase(), deletedAt: null },
      }),
    );
    return row ? this.toEntity(row) : null;
  }

  /** Mesma razão do anterior: o guard só tem o token, não a organização. */
  async findByDeviceTokenHash(hash: string): Promise<PosTerminal | null> {
    const row = await runWithoutTenantScope(() =>
      this.prisma.posTerminal.findFirst({
        where: { deviceTokenHash: hash, deletedAt: null },
      }),
    );
    return row ? this.toEntity(row) : null;
  }

  /**
   * Grava fora do escopo de tenant — usado pelo `redeem` e pelo
   * `DeviceAuthGuard`, que já resolveram o terminal e conhecem a organização
   * dele, mas rodam sem `TenantContext` na requisição.
   */
  saveUnscoped(posTerminal: PosTerminal): Promise<PosTerminal> {
    return runWithoutTenantScope(() => this.persist(posTerminal));
  }

  async findAll(
    organizationId: string,
    criteria: PosTerminalListCriteria = {},
  ): Promise<PosTerminal[]> {
    const rows = await this.prisma.scoped.posTerminal.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { createdAt: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: PosTerminalListCriteria = {},
  ): Promise<number> {
    return this.prisma.scoped.posTerminal.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  save(posTerminal: PosTerminal): Promise<PosTerminal> {
    return this.persist(posTerminal);
  }

  private async persist(posTerminal: PosTerminal): Promise<PosTerminal> {
    const data = {
      organizationId: posTerminal.organizationId,
      branchId: posTerminal.branchId,
      name: posTerminal.name,
      status: posTerminal.status,
      printer: posTerminal.printer,
      scale: posTerminal.scale,
      nfceContingency: posTerminal.nfceContingency,
      offlineServerId: posTerminal.offlineServerId,
      pairingCode: posTerminal.pairingCode,
      pairingCodeExpiresAt: posTerminal.pairingCodeExpiresAt,
      deviceTokenHash: posTerminal.deviceTokenHash,
      pairedAt: posTerminal.pairedAt,
      pairedDeviceLabel: posTerminal.pairedDeviceLabel,
      lastSeenAt: posTerminal.lastSeenAt,
      // `null` no domínio vira `Prisma.DbNull`, não `JsonNull`: a coluna é
      // nullable, e o que se quer gravar é "não há sobrescrita", não o valor
      // JSON `null`. Confundir os dois faria a herança parar de funcionar.
      moduleOverrides:
        posTerminal.moduleOverrides === null
          ? Prisma.DbNull
          : posTerminal.moduleOverrides,
      deletedAt: posTerminal.deletedAt,
      updatedAt: posTerminal.updatedAt,
    };

    const row = await this.prisma.scoped.posTerminal.upsert({
      where: { id: posTerminal.id },
      create: { id: posTerminal.id, ...data, createdAt: posTerminal.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  private buildWhere(
    organizationId: string,
    criteria: PosTerminalListCriteria,
  ): Prisma.PosTerminalWhereInput {
    const where: Prisma.PosTerminalWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (criteria.status) where.status = criteria.status;
    // `null` significa "todas" (OWNER/ADMIN); lista vazia significa "nenhuma".
    if (criteria.allowedBranchIds !== null && criteria.allowedBranchIds) {
      where.branchId = { in: criteria.allowedBranchIds };
    }
    if (criteria.search?.trim()) {
      where.name = { contains: criteria.search.trim(), mode: 'insensitive' };
    }

    return where;
  }

  private toEntity(row: PosTerminalRow): PosTerminal {
    const props: PosTerminalProps = {
      organizationId: row.organizationId,
      branchId: row.branchId,
      name: row.name,
      status: row.status as PosTerminalStatusValue,
      printer: row.printer,
      scale: row.scale,
      nfceContingency: row.nfceContingency,
      offlineServerId: row.offlineServerId,
      pairingCode: row.pairingCode,
      pairingCodeExpiresAt: row.pairingCodeExpiresAt,
      deviceTokenHash: row.deviceTokenHash,
      pairedAt: row.pairedAt,
      pairedDeviceLabel: row.pairedDeviceLabel,
      lastSeenAt: row.lastSeenAt,
      moduleOverrides:
        row.moduleOverrides === null || row.moduleOverrides === undefined
          ? null
          : (row.moduleOverrides as Record<string, string>),
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PosTerminal.with(props, row.id);
  }
}
