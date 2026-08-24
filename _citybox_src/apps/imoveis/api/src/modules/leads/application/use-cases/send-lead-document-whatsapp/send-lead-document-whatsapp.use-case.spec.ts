import { SendLeadDocumentWhatsAppUseCase } from './send-lead-document-whatsapp.use-case';
import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import { makeCreateLeadUseCase } from '../shared/lead-use-case-test-fixtures';
import { UploadLeadDocumentUseCase } from '../upload-lead-document/upload-lead-document.use-case';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';

const STORE = 's1';

describe('SendLeadDocumentWhatsAppUseCase', () => {
  async function setup() {
    const leads = new InMemoryLeadRepository();
    const deals = new InMemoryDealRepository();
    const appointments = new InMemoryAppointmentRepository();
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const storage = new InMemoryObjectStorage();
    const sync = new SyncActiveDealForLeadUseCase(
      deals,
      properties,
      transactions,
    );
    const createLead = makeCreateLeadUseCase(leads, appointments, deals);
    const upload = new UploadLeadDocumentUseCase(leads, storage, sync);
    const send = new SendLeadDocumentWhatsAppUseCase(leads, sync);
    return {
      leads,
      deals,
      properties,
      storage,
      createLead,
      upload,
      send,
    };
  }

  it('grava token e abre WhatsApp no envio do contrato', async () => {
    const ctx = await setup();
    const property = await ctx.properties.create({
      storeId: STORE,
      name: 'Casa Pontal',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const lead = await ctx.createLead.execute({
      storeId: STORE,
      name: 'Ana',
      phone: '73988887777',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      matchedProperties: [{ id: property.id, name: property.name }],
    });
    const uploaded = await ctx.upload.execute({
      storeId: STORE,
      leadId: lead.id,
      buffer: Buffer.from('%PDF-1.4 test'),
      filename: 'contrato.pdf',
      kind: 'contract',
    });
    const uploadedDeal = await ctx.deals.findActiveByLeadId(STORE, lead.id);
    expect(uploadedDeal?.stage).toBe('contract_sent');

    const result = await ctx.send.execute({
      storeId: STORE,
      leadId: lead.id,
      documentId: uploaded.documents[0]!.id,
    });

    expect(result.shareUrl).toMatch(/\/d\//);
    expect(result.whatsappUrl).toContain('wa.me/5573988887777');
    expect(result.whatsappUrl).toContain(encodeURIComponent(result.shareUrl));
    const sentDoc = result.lead.documents[0];
    expect(sentDoc?.sentAt).toBeTruthy();
    expect(sentDoc?.sentChannel).toBe('whatsapp');
    expect(sentDoc?.shareToken).toBeTruthy();
    const deal = await ctx.deals.findActiveByLeadId(STORE, lead.id);
    expect(deal?.stage).toBe('contract_sent');
  });

  it('não avança o funil ao enviar anexo que não é contrato', async () => {
    const ctx = await setup();
    const property = await ctx.properties.create({
      storeId: STORE,
      name: 'Casa Pontal',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const lead = await ctx.createLead.execute({
      storeId: STORE,
      name: 'Ana',
      phone: '73988887777',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
      matchedProperties: [{ id: property.id, name: property.name }],
    });
    const uploaded = await ctx.upload.execute({
      storeId: STORE,
      leadId: lead.id,
      buffer: Buffer.from('%PDF-1.4 test'),
      filename: 'rg.pdf',
      kind: 'other',
    });

    await ctx.send.execute({
      storeId: STORE,
      leadId: lead.id,
      documentId: uploaded.documents[0]!.id,
    });

    const deal = await ctx.deals.findActiveByLeadId(STORE, lead.id);
    expect(deal?.stage).toBe('property_selected');
  });

  it('rejeita envio sem telefone', async () => {
    const ctx = await setup();
    const lead = await ctx.createLead.execute({
      storeId: STORE,
      name: 'Ana',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const uploaded = await ctx.upload.execute({
      storeId: STORE,
      leadId: lead.id,
      buffer: Buffer.from('%PDF-1.4 test'),
      filename: 'rg.pdf',
      kind: 'other',
    });

    await expect(
      ctx.send.execute({
        storeId: STORE,
        leadId: lead.id,
        documentId: uploaded.documents[0]!.id,
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });
});
