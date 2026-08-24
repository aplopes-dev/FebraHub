import type { FiscalDocumentType } from '../../../fiscal-documents/domain/entities/fiscal-document.entity';
import type { NfeItemDto } from '../../domain/validators/nfe-item.zod.validator';
import type { CustomerAddress } from '../../../fiscal-documents/domain/entities/customer.entity';

export type IssueNfeCustomerDto = {
  documentType: 'CPF' | 'CNPJ';
  document: string;
  name: string;
  email?: string | null;
  address?: CustomerAddress | null;
};

export type IssueNfePaymentDto = {
  method: string;
  amount: number;
  description?: string;
};

export type IssueNfeDto = {
  companyId: string;
  sourceSystem: string;
  externalReference: string;
  idempotencyKey: string;
  environment?: 'HOMOLOGATION' | 'PRODUCTION';
  operationNature: string;
  operationType: '0' | '1';
  destinationIndicator?: '1' | '2' | '3';
  finalConsumer: boolean;
  presenceIndicator: '1' | '2' | '3' | '9';
  paymentMethodCode: string;
  /** Um detPag por forma de pagamento real (spec erp/029) — ausente/vazio
   * mantém o detPag único legado de `paymentMethodCode`. */
  payments?: IssueNfePaymentDto[];
  customer: IssueNfeCustomerDto;
  items: NfeItemDto[];
};

export type ConsultNfeDto = {
  fiscalDocumentId: string;
};

export type CancelNfeDto = {
  fiscalDocumentId: string;
  justification: string;
};

export type CorrectionLetterNfeDto = {
  fiscalDocumentId: string;
  correctionText: string;
};

export type InutilizeNfeDto = {
  companyId: string;
  series: string;
  numberStart: number;
  numberEnd: number;
  justification: string;
  /// Qual numeração inutilizar. `NFCE` e `NFE` têm **sequências separadas**
  /// (`fiscal_sequences` é única por tipo), então inutilizar a faixa errada
  /// deixaria a faixa realmente pulada ainda em aberto junto ao fisco — e
  /// queimaria uma faixa boa do outro tipo.
  ///
  /// @default 'NFE'
  documentType?: FiscalDocumentType;
};
