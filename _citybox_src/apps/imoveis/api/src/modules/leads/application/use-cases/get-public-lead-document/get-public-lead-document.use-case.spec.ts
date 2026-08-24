import { GetPublicLeadDocumentUseCase } from './get-public-lead-document.use-case';
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

describe('GetPublicLeadDocumentUseCase', () => {
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
    const send = new SendLeadDocumentWhatsAppUseCase(leads, sync);
    const sent = await send.execute({
      storeId: 's1',
      leadId: lead.id,
      documentId: uploaded.documents[0]!.id,
    });
    const token = sent.lead.documents[0]!.shareToken!;
    return {
      getPublic: new GetPublicLeadDocumentUseCase(leads, storage),
      token,
    };
  }

  it('entrega o arquivo com token válido', async () => {
    const { getPublic, token } = await setup();
    const result = await getPublic.execute({ token });
    expect(result.name).toBe('proposta.pdf');
    expect(result.buffer.toString()).toContain('%PDF-1.4 public');
  });

  it('404 para token expirado', async () => {
    const { getPublic, token } = await setup();
    await expect(
      getPublic.execute({
        token,
        now: new Date(Date.now() + 49 * 60 * 60 * 1000),
      }),
    ).rejects.toBeInstanceOf(LeadDocumentNotFoundError);
  });

  it('404 para token inexistente', async () => {
    const { getPublic } = await setup();
    await expect(
      getPublic.execute({ token: 'nao-existe' }),
    ).rejects.toBeInstanceOf(LeadDocumentNotFoundError);
  });
});
