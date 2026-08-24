import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { SignatureCreditBalanceRepository } from '../../domain/repositories/signature-credit-balance.repository.interface';
import {
  SignatureCreditBalance,
  type SignatureCreditBalanceProps,
} from '../../domain/entities/signature-credit-balance.entity';
import { SignatureCreditsInsufficientError } from '../../domain/errors/signature-credits-insufficient.error';

type SignatureCreditBalanceRow = {
  storeId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaSignatureCreditBalanceRepository extends SignatureCreditBalanceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByStoreId(
    storeId: string,
  ): Promise<SignatureCreditBalance | null> {
    const row = await this.prisma.signatureCreditBalance.findUnique({
      where: { storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(
    balance: SignatureCreditBalance,
  ): Promise<SignatureCreditBalance> {
    const row = await this.prisma.signatureCreditBalance.upsert({
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
    });
    return this.toEntity(row);
  }

  async debitOrFail(
    storeId: string,
    quantity: number,
  ): Promise<SignatureCreditBalance> {
    const result = await this.prisma.signatureCreditBalance.updateMany({
      where: { storeId, balance: { gte: quantity } },
      data: { balance: { decrement: quantity } },
    });
    if (result.count === 0) {
      const current = await this.findByStoreId(storeId);
      throw new SignatureCreditsInsufficientError(
        PrismaSignatureCreditBalanceRepository.name,
        current?.balance ?? 0,
        quantity,
      );
    }
    const updated = await this.findByStoreId(storeId);
    if (!updated) {
      throw new SignatureCreditsInsufficientError(
        PrismaSignatureCreditBalanceRepository.name,
        0,
        quantity,
      );
    }
    return updated;
  }

  private toEntity(row: SignatureCreditBalanceRow): SignatureCreditBalance {
    const props: SignatureCreditBalanceProps = {
      storeId: row.storeId,
      balance: row.balance,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return SignatureCreditBalance.with(props);
  }
}
