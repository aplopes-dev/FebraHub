import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../domain/repositories/fiscal-document.repository.interface';
import type { FiscalDocumentStatusCounts } from '../../../domain/repositories/fiscal-document.repository.interface';
import type { GetFiscalDocumentsSummaryDto } from '../../dtos/fiscal-document.dto';

/**
 * Cards de totais da aba "Emitido" (spec `009-facilita-nfe-screen`, FR-003).
 * 3 contagens sobre o mesmo filtro da listagem (sem `status`/paginação) —
 * `Promise.all` de 3 `count()` em vez de um método novo no repositório
 * (`groupBy`), para não abrir uma segunda forma de agregar no contrato do
 * repositório por uma tela só. "Manifestações finais"/"Não manifestadas" não
 * entram aqui — não têm equivalente no domínio de documento emitido
 * (research.md §3.3 dessa spec).
 */
@Injectable()
export class GetFiscalDocumentsSummaryUseCase implements IUseCase<
  GetFiscalDocumentsSummaryDto,
  FiscalDocumentStatusCounts
> {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
  ) {}

  async execute(
    dto: GetFiscalDocumentsSummaryDto,
  ): Promise<FiscalDocumentStatusCounts> {
    const [total, authorized, cancelled] = await Promise.all([
      this.fiscalDocumentRepository.count(dto),
      this.fiscalDocumentRepository.count({ ...dto, status: 'AUTHORIZED' }),
      this.fiscalDocumentRepository.count({
        ...dto,
        status: 'CANCEL_AUTHORIZED',
      }),
    ]);

    return { total, authorized, cancelled };
  }
}
