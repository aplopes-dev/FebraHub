import { randomUUID } from 'crypto';
import {
  FiscalDocument,
  type FiscalDocumentProps,
} from '../../domain/entities/fiscal-document.entity';

export function buildFiscalDocument(
  overrides: Partial<FiscalDocumentProps> = {},
  id = randomUUID(),
): FiscalDocument {
  const now = new Date();
  const props: FiscalDocumentProps = {
    companyId: '11111111-1111-4111-8111-111111111111',
    customerId: null,
    documentType: 'NFE',
    provider: 'SEFAZ_BA_NFE',
    environment: 'HOMOLOGATION',
    status: 'AUTHORIZED',
    sourceSystem: 'erp',
    externalReference: 'order-1',
    idempotencyKey: 'idem-1',
    series: '1',
    number: '100',
    rpsSeries: null,
    rpsNumber: null,
    accessKey: 'access-key-1',
    verificationCode: null,
    protocol: 'protocol-1',
    totalAmount: 850,
    xmlObjectKey: `${id}.xml`,
    errorCode: null,
    errorMessage: null,
    issuedAt: now,
    authorizedAt: now,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  return FiscalDocument.with(props, id);
}
