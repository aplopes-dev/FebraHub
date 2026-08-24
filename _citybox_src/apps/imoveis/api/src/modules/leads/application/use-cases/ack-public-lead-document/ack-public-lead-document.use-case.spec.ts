import { AckPublicLeadDocumentUseCase } from './ack-public-lead-document.use-case';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import { makeCreateLeadUseCase } from '../shared/lead-use-case-test-fixtures';
import { UploadLeadDocumentUseCase } from '../upload-lead-document/upload-lead-document.use-case';
import { SendLeadDocumentWhatsAppUseCase } from '../send-lead-document-whatsapp/send-lead-document-whatsapp.use-case';
import { LeadDocumentNotFoundError } from '../../../domain/errors/lead-document-not-found.error';

describe('AckPublicLeadDocumentUseCase', () => {
  async function setup() {
    const leads = new InMemoryLeadRepository();
    const deals = new InMemoryDealRepository();
    const appointments = new InMemoryAppointmentRepository();
    const storage = new InMemoryObjectStorage();
    const sync = new SyncActiveDealForLeadUseCase(
      deals,
      new InMemoryPropertyRepository(),
      new InMemoryTransactionRepository(),
    );
    const lead = await makeCreateLeadUseCase(
      leads,
      appointments,
      deals,
    ).execute({
      storeId: 's1',
      name: 'Ana',
      phone: '73988887777',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const uploaded = await new UploadLeadDocumentUseCase(
      leads,
      storage,
      sync,
    ).execute({
      storeId: 's1',
      leadId: lead.id,
      buffer: Buffer.from('%PDF-1.4 public'),
      filename: 'proposta.pdf',
      kind: 'other',
    });
    const sent = await new SendLeadDocumentWhatsAppUseCase(leads, sync).execute({
      storeId: 's1',
      leadId: lead.id,
      documentId: uploaded.documents[0]!.id,
    });
    const token = sent.lead.documents[0]!.shareToken!;
    return {
      ack: new AckPublicLeadDocumentUseCase(leads),
      leads,
      token,
      documentId: uploaded.documents[0]!.id,
    };
  }

  it('grava viewedAt na primeira vez', async () => {
    const { ack, leads, token, documentId } = await setup();
    const first = await ack.execute({ token });
    expect(first.viewedAt).toBeInstanceOf(Date);
    const found = await leads.findDocumentByShareToken(token);
    expect(found?.document.viewedAt?.getTime()).toBe(first.viewedAt.getTime());
    expect(found?.document.id).toBe(documentId);
  });

  it('é idempotente — segunda chamada não altera viewedAt', async () => {
    const { ack, token } = await setup();
    const first = await ack.execute({
      token,
      now: new Date('2026-08-21T12:00:00.000Z'),
    });
    const second = await ack.execute({
      token,
      now: new Date('2026-08-21T13:00:00.000Z'),
    });
    expect(second.viewedAt.getTime()).toBe(first.viewedAt.getTime());
  });

  it('404 para token expirado', async () => {
    const { ack, token } = await setup();
    await expect(
      ack.execute({
        token,
        now: new Date(Date.now() + 49 * 60 * 60 * 1000),
      }),
    ).rejects.toBeInstanceOf(LeadDocumentNotFoundError);
  });

  it('404 para token inexistente', async () => {
    const { ack } = await setup();
    await expect(ack.execute({ token: 'nao-existe' })).rejects.toBeInstanceOf(
      LeadDocumentNotFoundError,
    );
  });
});
