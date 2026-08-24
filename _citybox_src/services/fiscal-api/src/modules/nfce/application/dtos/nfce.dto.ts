import type { NfeItemDto } from '../../../nfe/domain/validators/nfe-item.zod.validator';
import type { NfcePaymentInput } from '../../domain/payment.entity';
import type { AuthenticatedUser } from '../../../../shared/infra/http/auth/authenticated-user';

/// Consumidor **opcional**: venda a consumidor não identificado é o caso comum
/// no balcão, e precisa ser autorizada normalmente (FR-003). Só passa a ser
/// exigido acima do limite estadual — ver `rules/consumer-limit.ts`.
export type IssueNfceConsumerDto = {
  document: string;
  documentType: 'CPF' | 'CNPJ';
  /// Ausente na maioria das vendas: no cupom o consumidor costuma informar só
  /// o documento.
  name?: string;
};

export type IssueNfceDto = {
  /// Emitente afirmado pelo chamador (header `X-Company-Id`). Sozinho **não
  /// autoriza nada** — ver `user`.
  companyId: string;
  /// Solicitante autenticado: a única entrada que o chamador não pode forjar,
  /// porque vem do JWT verificado pelo guard.
  user: AuthenticatedUser;
  sourceSystem: string;
  externalReference: string;
  idempotencyKey: string;
  environment?: 'HOMOLOGATION' | 'PRODUCTION';
  /// @default 'VENDA AO CONSUMIDOR'
  operationNature?: string;
  consumer?: IssueNfceConsumerDto;
  items: NfeItemDto[];
  /// ⚠️ Lista, não valor único: parte em cartão e resto em dinheiro é rotina
  /// no varejo. Ver `domain/payment.entity.ts`.
  payments: NfcePaymentInput[];
};

/// Não há `operationType`, `destinationIndicator`, `finalConsumer` nem
/// `presenceIndicator`: no modelo 65 os quatro são fixos (saída, operação
/// interna, consumidor final, presencial no estabelecimento). Aceitá-los do
/// chamador só criaria maneiras de emitir cupom inválido.
