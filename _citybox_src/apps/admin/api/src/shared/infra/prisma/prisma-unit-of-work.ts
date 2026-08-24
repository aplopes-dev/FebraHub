import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../core/unit-of-work';
import { PrismaService } from './prisma.service';
import {
  currentTransaction,
  transactionStorage,
  type PrismaTransactionClient,
} from './transaction.context';

@Injectable()
export class PrismaUnitOfWork extends UnitOfWork {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async run<T>(work: () => Promise<T>): Promise<T> {
    // Reentrante: já dentro de uma transação, participa da existente em vez de
    // abrir uma aninhada (Prisma não suporta transação aninhada de verdade).
    const existing = currentTransaction();
    if (existing) return work();

    return this.prisma.$transaction(async (tx) => {
      return transactionStorage.run(tx, work);
    });
  }
}
