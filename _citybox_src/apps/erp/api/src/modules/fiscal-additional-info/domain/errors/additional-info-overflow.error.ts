import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type {
  AdditionalInfoTarget,
  FiscalDocumentType,
} from '../entities/fiscal-additional-info.entity';

const TARGET_LABEL: Record<AdditionalInfoTarget, string> = {
  INF_CPL: 'contribuinte',
  INF_AD_FISCO: 'fisco',
};

/**
 * A soma das informações de um mesmo (tipo, destino) passou do teto do XSD.
 * Impedir, nunca truncar (plan D6): o texto entra num documento transmitido —
 * cortar mudaria o conteúdo fiscal sem o lojista perceber.
 */
export class AdditionalInfoOverflowError extends ValidatorDomainError {
  constructor(
    documentType: FiscalDocumentType,
    target: AdditionalInfoTarget,
    total: number,
    max: number,
  ) {
    super({
      internalMessage: `additional info overflow ${documentType}/${target}: ${total} > ${max}`,
      externalMessage: `As informações do campo do ${TARGET_LABEL[target]} somam ${total} caracteres e passam do limite de ${max} para ${documentType}. Reduza ou remova alguma informação.`,
      context: AdditionalInfoOverflowError.name,
    });
  }
}
