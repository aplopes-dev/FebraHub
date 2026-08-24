import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { BankAccountLookup } from '../../domain/repositories/bank-account-lookup.interface';

/**
 * Implementação local da porta: uma consulta direta em `BankAccount`, sem
 * importar o módulo `bank-accounts`.
 *
 * Quando o contrato de cartão precisar de mais que "existe?", o certo é passar a
 * depender do repositório daquele módulo — não engordar esta porta.
 */
@Injectable()
export class PrismaBankAccountLookup extends BankAccountLookup {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async exists(organizationId: string, id: string): Promise<boolean> {
    const row = await this.prisma.scoped.bankAccount.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });
    return row !== null;
  }
}
