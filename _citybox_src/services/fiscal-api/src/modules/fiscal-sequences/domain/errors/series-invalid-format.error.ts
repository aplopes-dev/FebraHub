import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Série fora do formato aceito (→ 422). SEFAZ aceita a série como número de até
/// 3 dígitos para NF-e/NFC-e; aqui exigimos 1–3 dígitos numéricos.
export class SeriesInvalidFormatError extends DomainError {
  constructor(context: string, value: string) {
    super({
      internalMessage: `Invalid series format: "${value}"`,
      externalMessage:
        'Série inválida. Informe um número de 1 a 3 dígitos (ex.: 1, 001).',
      context,
    });
  }
}
