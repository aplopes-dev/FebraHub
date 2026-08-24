import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client.js';
import type { ProviderType } from '../../generated/prisma/enums.js';
import { decimalToNumber } from '../../common/utils/serialization.js';
import { toJson } from '../../common/utils/prisma-json.js';
import { AuditLogService } from '../audit/audit.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateTransferDto } from './dto/transfer.dto.js';

type BalanceSnapshot = {
  merchantId: string;
  currency: string;
  grossSettlements: number;
  available: number;
  pendingTransfer: number;
  withdrawable: number;
};

@Injectable()
export class TransfersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditLogService) private readonly audit: AuditLogService,
  ) {}

  async create(tenantId: string, sourceSystem: string, dto: CreateTransferDto) {
    return this.prisma.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${tenantId}:${dto.merchantId}`}))`;

      const merchant = await tx.merchant.findFirst({
        where: { id: dto.merchantId, tenantId },
      });
      if (!merchant) throw new NotFoundException('Merchant não encontrado');

      const balance = await this.getBalanceTx(tx, tenantId, dto.merchantId);
      if (dto.amount > balance.withdrawable + 0.01) {
        throw new BadRequestException(
          `Saldo insuficiente: disponível ${balance.withdrawable}, solicitado ${dto.amount}`,
        );
      }

      const provider = (dto.provider ?? 'STUB') as ProviderType;
      const transfer = await tx.transfer.create({
        data: {
          tenantId,
          merchantId: dto.merchantId,
          recipientId: dto.recipientId,
          amount: dto.amount,
          provider,
          bankAccountJson: dto.bankAccount ? toJson({ ...dto.bankAccount }) : undefined,
          metadataJson: toJson({
            ...(dto.metadata ?? {}),
            sourceSystem,
          }),
          status: provider === 'STUB' ? 'COMPLETED' : 'PENDING',
          providerTransferId: provider === 'STUB' ? `stub_tr_${randomUUID()}` : undefined,
          processedAt: provider === 'STUB' ? new Date() : undefined,
        },
      });

      await this.audit.log({
        tenantId,
        actor: sourceSystem,
        action: 'transfer.created',
        resourceType: 'transfer',
        resourceId: transfer.id,
        metadata: { merchantId: dto.merchantId, amount: dto.amount, provider },
      });

      return this.toResponse(transfer);
    });
  }

  async get(tenantId: string, id: string) {
    const transfer = await this.prisma.db.transfer.findFirst({
      where: { id, tenantId },
    });
    if (!transfer) throw new NotFoundException('Transferência não encontrada');
    return this.toResponse(transfer);
  }

  async list(tenantId: string, merchantId?: string) {
    const rows = await this.prisma.db.transfer.findMany({
      where: {
        tenantId,
        ...(merchantId ? { merchantId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.toResponse(row));
  }

  async getBalance(tenantId: string, merchantId: string) {
    const merchant = await this.prisma.db.merchant.findFirst({
      where: { id: merchantId, tenantId },
    });
    if (!merchant) throw new NotFoundException('Merchant não encontrado');
    return this.getBalanceTx(this.prisma.db, tenantId, merchantId);
  }

  private async getBalanceTx(
    tx: Prisma.TransactionClient | PrismaService['db'],
    tenantId: string,
    merchantId: string,
  ): Promise<BalanceSnapshot> {
    const settlements = await tx.settlement.findMany({
      where: { tenantId, merchantId, status: 'AVAILABLE' },
      select: { netAmount: true },
    });
    const transfers = await tx.transfer.findMany({
      where: {
        tenantId,
        merchantId,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
      },
      select: { amount: true, status: true },
    });

    const grossSettlements = settlements.reduce(
      (sum, row) => sum + decimalToNumber(row.netAmount),
      0,
    );
    const completedOut = transfers
      .filter((row) => row.status === 'COMPLETED')
      .reduce((sum, row) => sum + decimalToNumber(row.amount), 0);
    const pendingOut = transfers
      .filter((row) => row.status === 'PENDING' || row.status === 'PROCESSING')
      .reduce((sum, row) => sum + decimalToNumber(row.amount), 0);

    const available = Math.max(0, Math.round((grossSettlements - completedOut) * 100) / 100);
    const withdrawable = Math.max(0, Math.round((available - pendingOut) * 100) / 100);

    return {
      merchantId,
      currency: 'BRL',
      grossSettlements: Math.round(grossSettlements * 100) / 100,
      available,
      pendingTransfer: Math.round(pendingOut * 100) / 100,
      withdrawable,
    };
  }

  private toResponse(row: {
    id: string;
    merchantId: string;
    recipientId: string | null;
    amount: { toString(): string };
    feeAmount: { toString(): string };
    status: string;
    provider: string | null;
    providerTransferId: string | null;
    bankAccountJson: unknown;
    failureReason: string | null;
    metadataJson: unknown;
    processedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      merchantId: row.merchantId,
      recipientId: row.recipientId,
      amount: decimalToNumber(row.amount),
      feeAmount: decimalToNumber(row.feeAmount),
      status: row.status,
      provider: row.provider,
      providerTransferId: row.providerTransferId,
      bankAccount: row.bankAccountJson,
      failureReason: row.failureReason,
      metadata: row.metadataJson,
      processedAt: row.processedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
