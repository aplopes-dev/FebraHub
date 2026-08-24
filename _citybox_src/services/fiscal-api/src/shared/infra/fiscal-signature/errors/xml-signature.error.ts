import { InfrastructureError } from '../../../core/errors/infrastructure.error';

export class XmlSignatureError extends InfrastructureError {
  constructor(reason: string) {
    super({
      internalMessage: `XML signature failed: ${reason}`,
      externalMessage: 'Falha ao assinar o documento fiscal',
      context: 'XmlSigner',
    });
  }
}
