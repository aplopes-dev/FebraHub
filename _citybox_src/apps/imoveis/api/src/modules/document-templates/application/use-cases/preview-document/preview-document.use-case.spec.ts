import { PreviewDocumentUseCase } from './preview-document.use-case';
import { DocumentMergeContextLoader } from '../../services/document-merge-context.loader';
import { InMemoryDocumentTemplateRepository } from '../../../infrastructure/database/in-memory-document-template.repository';
import { InMemoryLeadRepository } from '../../../../leads/infrastructure/database/in-memory-lead.repository';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryTransactionRepository } from '../../../../transactions/infrastructure/database/in-memory-transaction.repository';
import { InMemoryAgentProfileRepository } from '../../../../settings/infrastructure/database/in-memory-agent-profile.repository';
import { InMemoryStoreSettingsRepository } from '../../../../settings/infrastructure/database/in-memory-store-settings.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { CreateDocumentTemplateUseCase } from '../create-document-template/create-document-template.use-case';
import { makeCreateLeadUseCase } from '../../../../leads/application/use-cases/shared/lead-use-case-test-fixtures';

describe('PreviewDocumentUseCase', () => {
  it('interpola sem persistir', async () => {
    const templates = new InMemoryDocumentTemplateRepository();
    const leads = new InMemoryLeadRepository();
    const deals = new InMemoryDealRepository();
    const appointments = new InMemoryAppointmentRepository();
    const loader = new DocumentMergeContextLoader(
      leads,
      new InMemoryPropertyRepository(),
      appointments,
      new InMemoryTransactionRepository(),
      new InMemoryAgentProfileRepository(),
      new InMemoryStoreSettingsRepository(),
      deals,
    );
    const lead = await makeCreateLeadUseCase(leads, appointments, deals).execute({
      storeId: 's1',
      name: 'Ana',
      status: 'new',
      leadSource: 'website',
      interestedPropertyType: 'house',
      purpose: 'buying',
    });
    const template = await new CreateDocumentTemplateUseCase(templates).execute({
      storeId: 's1',
      nome: 'Outro',
      tipo: 'outro',
      conteudoHtml: '<p>{{lead.nome}}</p>',
    });
    const preview = await new PreviewDocumentUseCase(templates, loader).execute({
      storeId: 's1',
      templateId: template.id,
      leadId: lead.id,
    });
    expect(preview.html).toBe('<p>Ana</p>');
  });
});
