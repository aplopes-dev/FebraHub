import { CreateCampaignUseCase } from '../application/use-cases/create-campaign/create-campaign.use-case';
import { GetPublicCampaignUseCase } from '../application/use-cases/get-public-campaign/get-public-campaign.use-case';
import { TrackPublicCampaignViewUseCase } from '../application/use-cases/track-public-campaign-view/track-public-campaign-view.use-case';
import type { FormLeadContent } from '../domain/content/form-lead.content';
import { InMemoryCampaignRepository } from './in-memory-campaign.repository';
import { InMemorySalesFunnelRepository } from '../../../sales/funnels/tests/in-memory-sales-funnel.repository';

function validContent(): FormLeadContent {
  return {
    notifyOnLead: false,
    duplicityRule: 'block',
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

describe('Public campaign views tracking', () => {
  const storeId = 'store-1';

  function createHarness() {
    const campaigns = new InMemoryCampaignRepository();
    const funnels = new InMemorySalesFunnelRepository();
    return {
      campaigns,
      create: new CreateCampaignUseCase(campaigns, funnels),
      getPublic: new GetPublicCampaignUseCase(campaigns),
      trackView: new TrackPublicCampaignViewUseCase(campaigns),
    };
  }

  it('GET public does not increment views', async () => {
    const harness = createHarness();
    const campaign = await harness.create.execute({
      storeId,
      name: 'Form Views',
      segment: 'captacao_leads',
      type: 'form_lead',
      content: validContent(),
    });
    expect(campaign.views).toBe(0);

    await harness.getPublic.execute({ storeId, slug: campaign.slug });
    await harness.getPublic.execute({ storeId, slug: campaign.slug });

    const after = await harness.campaigns.findById(storeId, campaign.id);
    expect(after?.views).toBe(0);
  });

  it('POST track view increments once per call (dedupe is client cookie)', async () => {
    const harness = createHarness();
    const campaign = await harness.create.execute({
      storeId,
      name: 'Form Track',
      segment: 'captacao_leads',
      type: 'form_lead',
      content: validContent(),
    });

    await harness.trackView.execute({ storeId, slug: campaign.slug });
    await harness.trackView.execute({ storeId, slug: campaign.slug });

    const after = await harness.campaigns.findById(storeId, campaign.id);
    expect(after?.views).toBe(2);
  });
});
