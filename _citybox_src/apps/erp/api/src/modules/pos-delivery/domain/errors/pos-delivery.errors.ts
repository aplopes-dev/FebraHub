import { DomainError } from '../../../../shared/core/errors/domain.error';

abstract class PosDeliveryError extends DomainError {
  constructor(internalMessage: string, externalMessage: string) {
    super({
      internalMessage,
      externalMessage,
      context: new.target.name,
    });
  }
}

export class PosDeliveryOrderNotFoundError extends PosDeliveryError {
  constructor(id: string) {
    super(
      `PosDeliveryOrder ${id} not found`,
      'Pedido de delivery não encontrado.',
    );
  }
}

export class InvalidStatusTransitionError extends PosDeliveryError {
  constructor(from: string, to: string) {
    super(
      `Invalid delivery status transition: ${from} -> ${to}`,
      'Transição de status inválida.',
    );
  }
}

export class CourierRequiredError extends PosDeliveryError {
  constructor() {
    super(
      'Courier is required for dispatch',
      'Informe o entregador antes de despachar.',
    );
  }
}

export class AddressRequiredError extends PosDeliveryError {
  constructor() {
    super('Address is required for delivery', 'Informe o endereço de entrega.');
  }
}

export class AlreadySoldError extends PosDeliveryError {
  constructor() {
    super(
      'Delivery order already linked to a sale',
      'O pedido já possui uma venda vinculada.',
    );
  }
}

export class ImmutableAfterSaleError extends PosDeliveryError {
  constructor() {
    super(
      'Delivery order is immutable after sale',
      'O pedido não pode mais ser alterado após a venda.',
    );
  }
}
