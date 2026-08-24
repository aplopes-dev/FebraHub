import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../domain/errors/financial-entry-not-found.error';
import { FinancialEntryNotRemovableError } from '../../../domain/errors/financial-entry-not-removable.error';
import { BankStatementMatchRepository } from '../../../../bank-reconciliation/domain/repositories/bank-statement-match.repository.interface';
import type { DeleteFinancialEntryDto } from '../../dtos/financial-entry.dto';

/**
 * Exclui o lançamento (soft-delete).
 *
 * Nunca apaga: o lançamento entra em relatórios já fechados e pode ter parcelas
 * de contrato apontando para ele.
 *
 * `specs/erp/007-financeiro-ajustes-ui` US10/FR-006e: bloqueia a exclusão se
 * algum pagamento do lançamento tem conciliação bancária ativa
 * (`BankStatementMatch` — a linha só existe enquanto a conciliação está
 * ativa, hard-deletada por `UndoReconciliationUseCase`, ver `research.md` R9).
 * Reaproveita `findActiveFinancialEntryIds`, já usado por
 * `reconcile-transaction` para o mesmo tipo de checagem.
 */
@Injectable()
export class DeleteFinancialEntryUseCase implements IUseCase<
  DeleteFinancialEntryDto,
  void
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
    private readonly bankStatementMatchRepository: BankStatementMatchRepository,
  ) {}

  async execute(input: DeleteFinancialEntryDto): Promise<void> {
    const entry = await this.financialEntryRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!entry || entry.deletedAt) {
      throw new FinancialEntryNotFoundError(input.id);
    }

    const activeReconciliations =
      await this.bankStatementMatchRepository.findActiveFinancialEntryIds(
        input.organizationId,
        [entry.id],
      );
    if (activeReconciliations.has(entry.id)) {
      throw new FinancialEntryNotRemovableError(entry.id);
    }

    const deleted = entry.softDelete();
    await this.financialEntryRepository.softDelete(
      input.organizationId,
      input.id,
      deleted.deletedAt ?? new Date(),
    );
  }
}
