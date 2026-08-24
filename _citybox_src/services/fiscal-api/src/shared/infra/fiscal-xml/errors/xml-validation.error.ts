import { ValidatorDomainError } from '../../../core/errors/validator-domain.error';

/// Mapeia para 422 via AppExceptionFilter (ValidatorDomainError). FR-009: nenhum
/// XML que falhe a validação XSD pode ser transmitido a um órgão fiscal.
export class XmlValidationError extends ValidatorDomainError {
  constructor(context: string, errors: string[]) {
    const details = errors.join('; ');
    super({
      internalMessage: `XML failed XSD validation: ${details}`,
      externalMessage: `XML inválido contra o schema oficial: ${details}`,
      context,
    });
  }
}
