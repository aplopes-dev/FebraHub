import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  maxLengthFor,
  type AdditionalInfoTarget,
  type FiscalAdditionalInfo,
  type FiscalDocumentType,
} from '../../../domain/entities/fiscal-additional-info.entity';
import { AdditionalInfoOverflowError } from '../../../domain/errors/additional-info-overflow.error';
import { FiscalAdditionalInfoRepository } from '../../../domain/repositories/fiscal-additional-info.repository.interface';
import type { ResolvedDocumentAdditionalInfo } from '../../dtos/fiscal-additional-info.dto';

type Input = {
  organizationId: string;
  documentType: FiscalDocumentType;
};

/** Separador entre textos do mesmo destino (plan D7). */
const SEPARATOR = ' ';

/**
 * Resolve as informações adicionais de um documento na emissão (spec erp/017,
 * plan D7): busca as infos do tipo, concatena por destino na ordem de criação,
 * valida o total ≤ teto do XSD e devolve `{ infCpl?, infAdFisco? }` pronto para
 * o emissor repassar à fiscal-api (que recebe texto, não conhece o cadastro).
 *
 * Para NFS-e só `infCpl` é possível (não há `infAdFisco` — plan D10); a entidade
 * já impede o cadastro, então aqui nem aparece.
 */
@Injectable()
export class ResolveDocumentAdditionalInfoUseCase implements IUseCase<
  Input,
  ResolvedDocumentAdditionalInfo
> {
  constructor(private readonly repository: FiscalAdditionalInfoRepository) {}

  async execute(input: Input): Promise<ResolvedDocumentAdditionalInfo> {
    const infos = await this.repository.listByOrganization(
      input.organizationId,
      input.documentType,
    );

    const infCpl = this.concat(infos, input.documentType, 'INF_CPL');
    const infAdFisco = this.concat(infos, input.documentType, 'INF_AD_FISCO');

    const resolved: ResolvedDocumentAdditionalInfo = {};
    if (infCpl) resolved.infCpl = infCpl;
    if (infAdFisco) resolved.infAdFisco = infAdFisco;
    return resolved;
  }

  private concat(
    infos: FiscalAdditionalInfo[],
    documentType: FiscalDocumentType,
    target: AdditionalInfoTarget,
  ): string | undefined {
    // `infos` já vem ordenada por `createdAt` (contrato do repositório).
    const texts = infos
      .filter((info) => info.target === target)
      .map((info) => info.text);
    if (texts.length === 0) return undefined;

    const concatenated = texts.join(SEPARATOR);
    const max = maxLengthFor(documentType, target);
    if (concatenated.length > max) {
      throw new AdditionalInfoOverflowError(
        documentType,
        target,
        concatenated.length,
        max,
      );
    }
    return concatenated;
  }
}
