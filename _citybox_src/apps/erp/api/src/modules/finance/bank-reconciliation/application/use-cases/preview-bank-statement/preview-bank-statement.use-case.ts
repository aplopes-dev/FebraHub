import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BankAccountRepository } from '../../../../bank-accounts/domain/repositories/bank-account.repository.interface';
import {
  parseOfxFile,
  OfxParseError,
} from '../../../domain/services/ofx-parser';
import { InvalidOfxFileError } from '../../../domain/errors/invalid-ofx-file.error';
import { resolveBankAccountByCode } from '../resolve-bank-account-by-code';
import type {
  PreviewBankStatementDto,
  PreviewBankStatementResult,
} from '../../dtos/bank-statement.dto';

/**
 * Só faz o parse do arquivo e sugere a conta bancária (FR-007a) — não
 * persiste nada. Existe para o diálogo de importação poder pré-selecionar a
 * conta **antes** de o usuário confirmar (User Story 4, Acceptance Scenario
 * 1) — o parser OFX só roda no backend, então não dá pra resolver isso só no
 * client sem duplicar a lógica de charset/formato (ver `research.md` R8).
 */
@Injectable()
export class PreviewBankStatementUseCase implements IUseCase<
  PreviewBankStatementDto,
  PreviewBankStatementResult
> {
  constructor(private readonly bankAccountRepository: BankAccountRepository) {}

  async execute(
    dto: PreviewBankStatementDto,
  ): Promise<PreviewBankStatementResult> {
    if (!/\.ofx$/i.test(dto.fileName)) {
      throw new InvalidOfxFileError(
        `unsupported file extension: "${dto.fileName}"`,
      );
    }

    let parsed: ReturnType<typeof parseOfxFile>;
    try {
      parsed = parseOfxFile(dto.buffer);
    } catch (error) {
      if (error instanceof OfxParseError) {
        throw new InvalidOfxFileError(error.message);
      }
      throw error;
    }

    const suggestedBankAccountId = await resolveBankAccountByCode(
      this.bankAccountRepository,
      dto.organizationId,
      parsed.bankCode,
    );

    return { bankCode: parsed.bankCode, suggestedBankAccountId };
  }
}
