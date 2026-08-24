import { CreateCampaignUseCase } from '../application/use-cases/create-campaign/create-campaign.use-case';
import { ListCampaignSubmissionsUseCase } from '../application/use-cases/list-campaign-submissions/list-campaign-submissions.use-case';
import { SubmitPublicCampaignUseCase } from '../application/use-cases/submit-public-campaign/submit-public-campaign.use-case';
import type { FormLeadContent } from '../domain/content/form-lead.content';
import { CampaignNotAcceptingSubmissionsError } from '../domain/errors/campaign-not-accepting.error';
import { InMemoryCampaignRepository } from './in-memory-campaign.repository';
import { InMemoryCampaignSubmissionRepository } from './in-memory-campaign-submission.repository';
import { CreateSalesFunnelUseCase } from '../../../sales/funnels/application/use-cases/create-sales-funnel/create-sales-funnel.use-case';
import { InMemorySalesFunnelRepository } from '../../../sales/funnels/tests/in-memory-sales-funnel.repository';
import { CreateSalesOpportunityUseCase } from '../../../sales/opportunities/application/use-cases/create-sales-opportunity/create-sales-opportunity.use-case';
import { InMemorySalesOpportunityRepository } from '../../../sales/opportunities/tests/in-memory-sales-opportunity.repository';
import { InMemorySalesLabelRepository } from '../../../sales/labels/tests/in-memory-sales-label.repository';

function validContent(
  duplicityRule: FormLeadContent['duplicityRule'] = 'block',
): FormLeadContent {
  return {
    notifyOnLead: false,
    duplicityRule,
    successAction: 'message',
    successMessage: 'Obrigado!',
    questions: [
      {
        id: 'field-name',
        type: 'text',
        label: 'Nome',
        required: true,
      },
      {
        id: 'field-phone',
        type: 'phone',
        label: 'Telefone',
        required: true,
      },
    ],
    lgpdConsent: { text: 'LGPD' },
  };
}

describe('Public campaign submissions + kanban duplicity', () => {
  const storeId = 'store-1';

  function createHarness() {
    const campaigns = new InMemoryCampaignRepository();
    const submissions = new InMemoryCampaignSubmissionRepository();
    const funnels = new InMemorySalesFunnelRepository();
    const opportunities = new InMemorySalesOpportunityRepository();
    const labels = new InMemorySalesLabelRepository();
    const createOpportunity = new CreateSalesOpportunityUseCase(
      opportunities,
      funnels,
      labels,
    );
    return {
      campaigns,
      submissions,
      opportunities,
      createFunnel: new CreateSalesFunnelUseCase(funnels),
      create: new CreateCampaignUseCase(campaigns, funnels),
      submit: new SubmitPublicCampaignUseCase(
        campaigns,
        submissions,
        createOpportunity,
        opportunities,
      ),
      listSubmissions: new ListCampaignSubmissionsUseCase(
        campaigns,
        submissions,
      ),
    };
  }

  async function seedCampaignWithFunnel(
    harness: ReturnType<typeof createHarness>,
    duplicityRule: FormLeadContent['duplicityRule'],
  ) {
    const funnel = await harness.createFunnel.execute({
      storeId,
      name: 'Funil Agendamento',
    });
    const stageId = funnel.stages[0].id;
    const campaign = await harness.create.execute({
      storeId,
      name: 'Campanha Funil',
      segment: 'captacao_leads',
      type: 'form_lead',
      funnelId: funnel.id,
      stageId,
      content: validContent(duplicityRule),
    });
    return { funnel, stageId, campaign };
  }

  it('submits lead and lists it in backoffice', async () => {
    const harness = createHarness();
    const campaign = await harness.create.execute({
      storeId,
      name: 'Form Público',
      segment: 'captacao_leads',
      type: 'form_lead',
      content: validContent(),
    });

    await harness.submit.execute({
      storeId,
      slug: campaign.slug,
      payload: {
        'field-name': 'Maria',
        'field-phone': '(73) 99999-1111',
      },
    });

    const listed = await harness.listSubmissions.execute({
      storeId,
      campaignId: campaign.id,
    });
    expect(listed.total).toBe(1);
    expect(listed.items[0].payload['field-name']).toBe('Maria');
  });

  it('block: accepts duplicate submission with flag and keeps a single kanban card', async () => {
    const harness = createHarness();
    const { funnel, stageId, campaign } = await seedCampaignWithFunnel(
      harness,
      'block',
    );

    const first = await harness.submit.execute({
      storeId,
      slug: campaign.slug,
      payload: {
        'field-name': 'João',
        'field-phone': '(73) 98888-2222',
      },
    });
    expect(first.opportunityId).toBeDefined();
    expect(first.submission.isDuplicate).toBe(false);

    const second = await harness.submit.execute({
      storeId,
      slug: campaign.slug,
      payload: {
        'field-name': 'João 2',
        'field-phone': '73988882222',
      },
    });
    expect(second.submission.isDuplicate).toBe(true);
    expect(second.opportunityId).toBeUndefined();
    expect(second.submission.id).not.toBe(first.submission.id);

    const listed = await harness.listSubmissions.execute({
      storeId,
      campaignId: campaign.id,
    });
    expect(listed.total).toBe(2);

    const cards = await harness.opportunities.findMany(storeId, {
      skip: 0,
      take: 20,
      funnelId: funnel.id,
      stageId,
    });
    expect(cards).toHaveLength(1);
    expect(cards[0].title).toBe('João');
  });

  it('update: creates duplicate submission with new data and updates kanban card', async () => {
    const harness = createHarness();
    const { funnel, stageId, campaign } = await seedCampaignWithFunnel(
      harness,
      'update',
    );

    const first = await harness.submit.execute({
      storeId,
      slug: campaign.slug,
      payload: {
        'field-name': 'Ana',
        'field-phone': '(73) 97777-3333',
      },
    });

    const second = await harness.submit.execute({
      storeId,
      slug: campaign.slug,
      payload: {
        'field-name': 'Ana Paula',
        'field-phone': '73977773333',
      },
    });

    expect(second.submission.id).not.toBe(first.submission.id);
    expect(second.submission.isDuplicate).toBe(true);
    expect(first.submission.isDuplicate).toBe(false);
    expect(second.submission.payload['field-name']).toBe('Ana Paula');
    expect(second.opportunityId).toBe(first.opportunityId);

    const listed = await harness.listSubmissions.execute({
      storeId,
      campaignId: campaign.id,
    });
    expect(listed.total).toBe(2);
    expect(listed.items.find((s) => s.id === first.submission.id)?.payload['field-name']).toBe('Ana');
    expect(listed.items.find((s) => s.id === second.submission.id)?.payload['field-name']).toBe('Ana Paula');

    const cards = await harness.opportunities.findMany(storeId, {
      skip: 0,
      take: 20,
      funnelId: funnel.id,
      stageId,
    });
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe(first.opportunityId);
    expect(cards[0].title).toBe('Ana Paula');
  });

  it('create_new: always creates new submission and new kanban card', async () => {
    const harness = createHarness();
    const { funnel, stageId, campaign } = await seedCampaignWithFunnel(
      harness,
      'create_new',
    );

    const first = await harness.submit.execute({
      storeId,
      slug: campaign.slug,
      payload: {
        'field-name': 'Pedro',
        'field-phone': '(73) 96666-4444',
      },
    });
    const second = await harness.submit.execute({
      storeId,
      slug: campaign.slug,
      payload: {
        'field-name': 'Pedro Silva',
        'field-phone': '73966664444',
      },
    });

    expect(second.submission.id).not.toBe(first.submission.id);
    expect(second.submission.isDuplicate).toBe(true);
    expect(first.submission.isDuplicate).toBe(false);
    expect(second.opportunityId).toBeDefined();
    expect(second.opportunityId).not.toBe(first.opportunityId);

    const listed = await harness.listSubmissions.execute({
      storeId,
      campaignId: campaign.id,
    });
    expect(listed.total).toBe(2);

    const cards = await harness.opportunities.findMany(storeId, {
      skip: 0,
      take: 20,
      funnelId: funnel.id,
      stageId,
    });
    expect(cards).toHaveLength(2);
  });

  it('finishes campaign when lead limit is reached and blocks further submissions', async () => {
    const harness = createHarness();
    const campaign = await harness.create.execute({
      storeId,
      name: 'Limite 3',
      segment: 'captacao_leads',
      type: 'form_lead',
      statusType: 'limit',
      leadLimit: 3,
      content: validContent(),
    });

    for (let i = 0; i < 3; i++) {
      await harness.submit.execute({
        storeId,
        slug: campaign.slug,
        payload: {
          'field-name': `Lead ${i + 1}`,
          'field-phone': `(73) 99999-000${i}`,
        },
      });
    }

    const saved = await harness.campaigns.findById(storeId, campaign.id);
    expect(saved?.status).toBe('finished');
    expect(saved?.submissions).toBe(3);

    await expect(
      harness.submit.execute({
        storeId,
        slug: campaign.slug,
        payload: {
          'field-name': 'Lead 4',
          'field-phone': '(73) 99999-0004',
        },
      }),
    ).rejects.toBeInstanceOf(CampaignNotAcceptingSubmissionsError);
  });
});
