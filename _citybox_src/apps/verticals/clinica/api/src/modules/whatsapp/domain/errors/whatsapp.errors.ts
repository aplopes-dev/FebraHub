import { DomainError } from '../../../../shared/core/errors/domain.error';

export class WhatsappConnectionNotFoundError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `WhatsApp connection not found for store ${storeId}`,
      externalMessage: 'Conexão WhatsApp não encontrada.',
      context,
    });
  }
}

export class WhatsappNotConnectedError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `WhatsApp not connected for store ${storeId}`,
      externalMessage: 'WhatsApp da clínica não está conectado.',
      context,
    });
  }
}

export class WhatsappInvalidPhoneError extends DomainError {
  constructor(context: string, patientId: string) {
    super({
      internalMessage: `Invalid WhatsApp phone for patient ${patientId}`,
      externalMessage: 'Paciente sem telefone WhatsApp válido.',
      context,
    });
  }
}

export class WhatsappTemplateNotFoundError extends DomainError {
  constructor(context: string, key: string) {
    super({
      internalMessage: `WhatsApp template not found: ${key}`,
      externalMessage: 'Template WhatsApp não encontrado.',
      context,
    });
  }
}

export class WhatsappMessageNotFoundError extends DomainError {
  constructor(context: string, messageId: string) {
    super({
      internalMessage: `WhatsApp message not found: ${messageId}`,
      externalMessage: 'Mensagem WhatsApp não encontrada.',
      context,
    });
  }
}
