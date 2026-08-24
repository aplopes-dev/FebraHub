import { Injectable } from '@nestjs/common';
import type { SignaturePackageRequestStatus as PrismaStatus } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { SignaturePackageRequestRepository } from '../../domain/repositories/signature-package-request.repository.interface';
import {
  SignaturePackageRequest,
  type SignaturePackageRequestProps,
  type SignaturePackageRequestStatus,
} from '../../domain/entities/signature-package-request.entity';
import {
  SignatureCreditBalance,
  type SignatureCreditBalanceProps,
} from '../../domain/entities/signature-credit-balance.entity';

type SignaturePackageRequestRow = {
  id: string;
  storeId: string;
  packageId: string;
  quantity: number;
  priceCents: number;
  status: PrismaStatus;
  createdAt: Date;
  liberatedAt: Date | null;
};

type SignatureCreditBalanceRow = {
  storeId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaSignaturePackageRequestRepository extends SignaturePackageRequestRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<SignaturePackageRequest | null> {
    const row = await this.prisma.signaturePackageRequest.findFirst({
      where: { id, storeId },
    });
    return row ? this.toRequestEntity(row) : null;
  }

  async findAllByStoreId(
    storeId: string,
  ): Promise<SignaturePackageRequest[]> {
    const rows = await this.prisma.signaturePackageRequest.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toRequestEntity(row));
  }

  async findPageByStoreId(
    storeId: string,
    params: {
      page: number;
      perPage: number;
      status?: SignaturePackageRequestStatus;
    },
  ): Promise<{ items: SignaturePackageRequest[]; total: number }> {
    const where = {
      storeId,
      ...(params.status ? { status: params.status } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.signaturePackageRequest.count({ where }),
      this.prisma.signaturePackageRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.perPage,
        take: params.perPage,
      }),
    ]);
    return {
      total,
      items: rows.map((row) => this.toRequestEntity(row)),
    };
  }

  async save(
    request: SignaturePackageRequest,
  ): Promise<SignaturePackageRequest> {
    const row = await this.prisma.signaturePackageRequest.upsert({
      where: { id: request.id },
      create: {
        id: request.id,
        storeId: request.storeId,
        packageId: request.packageId,
        quantity: request.quantity,
        priceCents: request.priceCents,
        status: request.status,
        createdAt: request.createdAt,
        liberatedAt: request.liberatedAt,
      },
      update: {
        packageId: request.packageId,
        quantity: request.quantity,
        priceCents: request.priceCents,
        status: request.status,
        liberatedAt: request.liberatedAt,
      },
    });
    return this.toRequestEntity(row);
  }

  async liberateAndCredit(
    request: SignaturePackageRequest,
    balance: SignatureCreditBalance,
  ): Promise<{
    request: SignaturePackageRequest;
    balance: SignatureCreditBalance;
  }> {
    const [requestRow, balanceRow] = await this.prisma.$transaction([
      this.prisma.signaturePackageRequest.update({
        where: { id: request.id },
        data: {
          status: request.status,
          liberatedAt: request.liberatedAt,
        },
      }),
      this.prisma.signatureCreditBalance.upsert({
        where: { storeId: balance.storeId },
        create: {
          storeId: balance.storeId,
          balance: balance.balance,
          createdAt: balance.createdAt,
          updatedAt: balance.updatedAt,
        },
        update: {
          balance: balance.balance,
          updatedAt: balance.updatedAt,
        },
      }),
    ]);

    return {
      request: this.toRequestEntity(requestRow),
      balance: this.toBalanceEntity(balanceRow),
    };
  }

  private toRequestEntity(
    row: SignaturePackageRequestRow,
  ): SignaturePackageRequest {
    const props: SignaturePackageRequestProps = {
      storeId: row.storeId,
      packageId: row.packageId,
      quantity: row.quantity,
      priceCents: row.priceCents,
      status: row.status as SignaturePackageRequestStatus,
      createdAt: row.createdAt,
      liberatedAt: row.liberatedAt,
    };
    return SignaturePackageRequest.with(props, row.id);
  }

  private toBalanceEntity(
    row: SignatureCreditBalanceRow,
  ): SignatureCreditBalance {
    const props: SignatureCreditBalanceProps = {
      storeId: row.storeId,
      balance: row.balance,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return SignatureCreditBalance.with(props);
  }
}
