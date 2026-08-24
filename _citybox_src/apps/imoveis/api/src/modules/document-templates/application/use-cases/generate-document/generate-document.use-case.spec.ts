import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { SyncActiveDealForLeadUseCase } from '../../../../deals/application/use-cases/sync-active-deal-for-lead/sync-active-deal-for-lead.use-case';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { makeCreateLeadUseCase } from '../../../../leads/application/use-cases/shared/lead-use-case-test-fixtures';
import { InMemoryLeadRepository } from '../../../../leads/infrastructure/database/in-memory-lead.repository';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryAgentProfileRepository } from '../../../../settings/infrastructure/database/in-memory-agent-profile.repository';
import { InMemoryStoreSettingsRepository } from '../../../../settings/infrastructure/database/in-memory-store-settings.repository';
import { seedTransaction } from '../../../../transactions/application/use-cases/shared/transaction-test-fixtures';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { DocumentContextForbiddenError } from '../../../domain/errors/document-context-forbidden.error';
import { DocumentPdfRenderer } from '../../../domain/pdf/document-pdf-renderer';
import { InMemoryDocumentTemplateRepository } from '../../../infrastructure/database/in-memory-document-template.repository';
import { InMemoryGeneratedDocumentRepository } from '../../../infrastructure/database/in-memory-generated-document.repository';
import { DocumentMergeContextLoader } from '../../services/document-merge-context.loader';
import { GenerateDocumentUseCase } from './generate-document.use-case';
import { PreviewDocumentUseCase } from '../preview-document/preview-document.use-case';

class FakePdfRenderer extends DocumentPdfRenderer {
  async render(): Promise<Buffer> {
    return Buffer.from('%PDF-1.4 fake');
  }
}

const STORE = 'store-1';

describe('GenerateDocumentUseCase', () => {
  it('gera PDF e anexa no lead como contrato (avança o funil, sem fingir envio WhatsApp)', async () => {
    const templates = new InMemoryDocumentTemplateRepository();
    const generated = new InMemoryGeneratedDocumentRepository();
    const leads = new InMemoryLeadRepository();
    const deals = new InMemoryDealRepository();
    const appointments = new InMemoryAppointmentRepository();
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const profiles = new InMemoryAgentProfileRepository();
    const settings = new InMemoryStoreSettingsRepository();
    const storage = new InMemoryObjectStorage();
    await profiles.ensure(STORE, 'agent-1');
    await profiles.upsert(STORE, 'agent-1', {
      name: 'João Corretor',
      stateId: '12345-F',
      phone: '(73) 98888-0000',
    });
    const lead = await makeCreateLeadUseCase(leads, appointments, deals).execute({
      storeId: STORE,
      name: 'Ana Silva',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'apartment',
      purpose: 'buying',
      agentIds: ['agent-1'],
      matchedProperties: [{ id: 'prop-1', name: 'Apt Centro' }],
    });
    const template = await templates.create({
      storeId: STORE,
      nome: 'CPCV',
      tipo: 'contrato-promessa-compra-venda',
      conteudoHtml: '<p>Contrato de {{lead.nome}} — {{imovel.titulo}}</p>',
      ativo: true,
    });
    const loader = new DocumentMergeContextLoader(
      leads,
      properties,
      appointments,
      transactions,
      profiles,
      settings,
      deals,
    );
    const useCase = new GenerateDocumentUseCase(
      templates,
      generated,
      loader,
      new FakePdfRenderer(),
      storage,
      leads,
      new SyncActiveDealForLeadUseCase(deals, properties, transactions),
    );

    const result = await useCase.execute({
      storeId: STORE,
      templateId: template.id,
      leadId: lead.id,
    });

    expect(result.document.status).toBe('gerado');
    expect(result.document.conteudoRender).toContain('Ana Silva');
    expect(result.leadDocumentId).toBe(result.document.id);
    const storedLead = await leads.findById(STORE, lead.id);
    expect(storedLead?.documents.some((d) => d.kind === 'contract')).toBe(true);
    const deal = await deals.findActiveByLeadId(STORE, lead.id);
    expect(deal?.stage).toBe('contract_sent');
  });

  it('preview interpola sem persistir', async () => {
    const templates = new InMemoryDocumentTemplateRepository();
    const leads = new InMemoryLeadRepository();
    const deals = new InMemoryDealRepository();
    const appointments = new InMemoryAppointmentRepository();
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const profiles = new InMemoryAgentProfileRepository();
    const settings = new InMemoryStoreSettingsRepository();
    const lead = await makeCreateLeadUseCase(leads, appointments, deals).execute({
      storeId: STORE,
      name: 'Ana',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const template = await templates.create({
      storeId: STORE,
      nome: 'Outro',
      tipo: 'outro',
      conteudoHtml: '<p>{{lead.nome}}</p>',
    });
    const loader = new DocumentMergeContextLoader(
      leads,
      properties,
      appointments,
      transactions,
      profiles,
      settings,
      deals,
    );
    const preview = new PreviewDocumentUseCase(templates, loader);
    const html = await preview.execute({
      storeId: STORE,
      templateId: template.id,
      leadId: lead.id,
    });
    expect(html.html).toBe('<p>Ana</p>');
  });

  it('recusa termo de visita sem compromisso', async () => {
    const templates = new InMemoryDocumentTemplateRepository();
    const generated = new InMemoryGeneratedDocumentRepository();
    const leads = new InMemoryLeadRepository();
    const deals = new InMemoryDealRepository();
    const appointments = new InMemoryAppointmentRepository();
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const profiles = new InMemoryAgentProfileRepository();
    const settings = new InMemoryStoreSettingsRepository();
    const storage = new InMemoryObjectStorage();
    const lead = await makeCreateLeadUseCase(leads, appointments, deals).execute({
      storeId: STORE,
      name: 'Ana',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const template = await templates.create({
      storeId: STORE,
      nome: 'Visita',
      tipo: 'termo-visita',
      conteudoHtml: '<p>{{visita.data}}</p>',
    });
    const loader = new DocumentMergeContextLoader(
      leads,
      properties,
      appointments,
      transactions,
      profiles,
      settings,
      deals,
    );
    const useCase = new GenerateDocumentUseCase(
      templates,
      generated,
      loader,
      new FakePdfRenderer(),
      storage,
      leads,
      new SyncActiveDealForLeadUseCase(deals, properties, transactions),
    );
    await expect(
      useCase.execute({
        storeId: STORE,
        templateId: template.id,
        leadId: lead.id,
      }),
    ).rejects.toBeInstanceOf(DocumentContextForbiddenError);
  });

  it('gera termo de visita a partir do compromisso e anexa como other', async () => {
    const templates = new InMemoryDocumentTemplateRepository();
    const generated = new InMemoryGeneratedDocumentRepository();
    const leads = new InMemoryLeadRepository();
    const deals = new InMemoryDealRepository();
    const appointments = new InMemoryAppointmentRepository();
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const profiles = new InMemoryAgentProfileRepository();
    const settings = new InMemoryStoreSettingsRepository();
    const storage = new InMemoryObjectStorage();
    const lead = await makeCreateLeadUseCase(leads, appointments, deals).execute({
      storeId: STORE,
      name: 'Ana',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const appointment = await appointments.create({
      storeId: STORE,
      title: 'Visita Apt',
      startsAt: new Date('2026-08-19T17:00:00.000Z'),
      endsAt: new Date('2026-08-19T18:00:00.000Z'),
      location: 'Apt Centro',
      kind: 'visit',
      agentId: 'agent-1',
      leadId: lead.id,
      leadName: lead.name,
    });
    const template = await templates.create({
      storeId: STORE,
      nome: 'Termo de visita',
      tipo: 'termo-visita',
      conteudoHtml: '<p>{{lead.nome}} em {{visita.local}}</p>',
    });
    const loader = new DocumentMergeContextLoader(
      leads,
      properties,
      appointments,
      transactions,
      profiles,
      settings,
      deals,
    );
    const useCase = new GenerateDocumentUseCase(
      templates,
      generated,
      loader,
      new FakePdfRenderer(),
      storage,
      leads,
      new SyncActiveDealForLeadUseCase(deals, properties, transactions),
    );
    const result = await useCase.execute({
      storeId: STORE,
      templateId: template.id,
      appointmentId: appointment.id,
    });
    expect(result.document.conteudoRender).toContain('Ana');
    const storedLead = await leads.findById(STORE, lead.id);
    expect(storedLead?.documents.every((d) => d.kind === 'other')).toBe(true);
    const deal = await deals.findActiveByLeadId(STORE, lead.id);
    expect(deal?.stage).not.toBe('contract_sent');
  });

  it('gera recibo a partir da transação', async () => {
    const templates = new InMemoryDocumentTemplateRepository();
    const generated = new InMemoryGeneratedDocumentRepository();
    const leads = new InMemoryLeadRepository();
    const deals = new InMemoryDealRepository();
    const appointments = new InMemoryAppointmentRepository();
    const properties = new InMemoryPropertyRepository();
    const transactions = new InMemoryTransactionRepository();
    const profiles = new InMemoryAgentProfileRepository();
    const settings = new InMemoryStoreSettingsRepository();
    const storage = new InMemoryObjectStorage();
    const lead = await makeCreateLeadUseCase(leads, appointments, deals).execute({
      storeId: STORE,
      name: 'Ana',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const tx = await seedTransaction(transactions, {
      storeId: STORE,
      leadId: lead.id,
      leadName: lead.name,
      propertyId: null,
      paymentMethod: 'pix',
      grossValueCents: 10_000_00,
    });
    const template = await templates.create({
      storeId: STORE,
      nome: 'Recibo',
      tipo: 'recibo-sinal',
      conteudoHtml: '<p>{{negocio.formaPagamento}} {{negocio.valor}}</p>',
    });
    const loader = new DocumentMergeContextLoader(
      leads,
      properties,
      appointments,
      transactions,
      profiles,
      settings,
      deals,
    );
    const useCase = new GenerateDocumentUseCase(
      templates,
      generated,
      loader,
      new FakePdfRenderer(),
      storage,
      leads,
      new SyncActiveDealForLeadUseCase(deals, properties, transactions),
    );
    const result = await useCase.execute({
      storeId: STORE,
      templateId: template.id,
      transactionId: tx.id,
    });
    expect(result.document.conteudoRender).toContain('PIX');
    expect(result.leadDocumentId).toBe(result.document.id);
  });
});
