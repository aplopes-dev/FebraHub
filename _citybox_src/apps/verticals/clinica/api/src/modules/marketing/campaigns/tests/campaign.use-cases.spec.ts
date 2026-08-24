import { CampaignTypeNotImplementedError } from '../domain/errors/campaign-type-not-implemented.error';
import { CampaignInvalidFunnelError } from '../domain/errors/campaign-invalid-funnel.error';
import { CampaignInvalidSegmentTypeError } from '../domain/errors/campaign-invalid-segment-type.error';
import { CampaignNotFoundError } from '../domain/errors/campaign-not-found.error';
import type { FormLeadContent } from '../domain/content/form-lead.content';
import { Campaign } from '../domain/entities/campaign.entity';
import { brazilCivilYmd } from '../domain/utils/campaign-period.utils';
import { CreateCampaignUseCase } from '../application/use-cases/create-campaign/create-campaign.use-case';
import { GetCampaignUseCase } from '../application/use-cases/get-campaign/get-campaign.use-case';
import { ListCampaignsUseCase } from '../application/use-cases/list-campaigns/list-campaigns.use-case';
import { UpdateCampaignStatusUseCase } from '../application/use-cases/update-campaign-status/update-campaign-status.use-case';
import { InMemoryCampaignRepository } from './in-memory-campaign.repository';
import { CreateSalesFunnelUseCase } from '../../../sales/funnels/application/use-cases/create-sales-funnel/create-sales-funnel.use-case';
import { InMemorySalesFunnelRepository } from '../../../sales/funnels/tests/in-memory-sales-funnel.repository';
import { InMemoryWhatsappMessageRepository } from '../../../whatsapp/tests/in-memory-whatsapp-message.repository';

function validFormLeadContent(
  overrides: Partial<FormLeadContent> = {},
): FormLeadContent {
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
    lgpdConsent: { text: 'Concordo com o tratamento dos dados.' },
    ...overrides,
  };
}

function createHarness() {
  const campaigns = new InMemoryCampaignRepository();
  const funnels = new InMemorySalesFunnelRepository();
  const whatsappMessages = new InMemoryWhatsappMessageRepository();
  return {
    campaigns,
    funnels,
    whatsappMessages,
    createFunnel: new CreateSalesFunnelUseCase(funnels),
    create: new CreateCampaignUseCase(campaigns, funnels),
    list: new ListCampaignsUseCase(campaigns, whatsappMessages),
    get: new GetCampaignUseCase(campaigns, whatsappMessages),
    updateStatus: new UpdateCampaignStatusUseCase(campaigns),
  };
}

describe('Campaign use cases', () => {
  const storeId = 'store-1';

  it('creates form_lead campaign with canonical content', async () => {
    const harness = createHarness();
    const created = await harness.create.execute({
      storeId,
      name: 'Formulário Avaliação',
      segment: 'captacao_leads',
      type: 'form_lead',
      content: validFormLeadContent(),
    });

    expect(created.type).toBe('form_lead');
    expect(created.strategy).toBe('PAGE');
    expect(created.channel).toBe('web');
    expect(created.slug).toBe('formulario-avaliacao');
    expect(created.publicUrl).toContain(created.slug);
    expect(created.status).toBe('active');
  });

  it('creates form_lead from wizard step payload', async () => {
    const harness = createHarness();
    const created = await harness.create.execute({
      storeId,
      name: 'Lead WhatsApp',
      segment: 'captacao_leads',
      type: 'form_lead',
      content: {
        stepTwo: {
          notifyOnLead: true,
          duplicityRule: 'update',
          successAction: 'message',
          successMessage: 'Recebido',
        },
        stepThree: {
          questions: validFormLeadContent().questions,
          lgpdConsent: { text: 'LGPD ok' },
        },
        stepFour: { statusType: 'always_active' },
      },
    });

    expect(created.content).toMatchObject({
      notifyOnLead: true,
      duplicityRule: 'update',
      successMessage: 'Recebido',
    });
  });

  it('rejects invalid segment/type pair', async () => {
    const harness = createHarness();
    await expect(
      harness.create.execute({
        storeId,
        name: 'Inválida',
        segment: 'operacional_atendimento',
        type: 'form_lead',
        content: validFormLeadContent(),
      }),
    ).rejects.toBeInstanceOf(CampaignInvalidSegmentTypeError);
  });

  it('rejects unimplemented campaign type', async () => {
    const harness = createHarness();
    await expect(
      harness.create.execute({
        storeId,
        name: 'NPS Campanha',
        segment: 'relacionamento_pos_venda',
        type: 'nps',
        content: {},
      }),
    ).rejects.toBeInstanceOf(CampaignTypeNotImplementedError);
  });

  it('creates aniversario campaign with audience content', async () => {
    const harness = createHarness();
    const created = await harness.create.execute({
      storeId,
      name: 'Aniversariantes Julho',
      segment: 'relacionamento_pos_venda',
      type: 'aniversario',
      content: {
        planIds: ['plan-1'],
        specialtyIds: [],
        genders: ['female'],
        messageBody: 'Feliz aniversário, {nome_paciente}!',
      },
    });

    expect(created.type).toBe('aniversario');
    expect(created.strategy).toBe('BROADCAST');
    expect(created.channel).toBe('whatsapp');
    expect(created.content).toMatchObject({
      planIds: ['plan-1'],
      genders: ['female'],
      messageBody: 'Feliz aniversário, {nome_paciente}!',
    });
  });

  it('rejects period without endDate', async () => {
    const harness = createHarness();
    await expect(
      harness.create.execute({
        storeId,
        name: 'Por período',
        segment: 'captacao_leads',
        type: 'form_lead',
        statusType: 'period',
        content: validFormLeadContent(),
      }),
    ).rejects.toThrow();
  });

  it('validates funnel and stage when provided', async () => {
    const harness = createHarness();
    const funnel = await harness.createFunnel.execute({
      storeId,
      name: 'Funil CRM',
    });
    const stageId = funnel.stages[0].id;

    const created = await harness.create.execute({
      storeId,
      name: 'Com funil',
      segment: 'captacao_leads',
      type: 'form_lead',
      funnelId: funnel.id,
      stageId,
      content: validFormLeadContent(),
    });

    expect(created.funnelId).toBe(funnel.id);
    expect(created.stageId).toBe(stageId);

    await expect(
      harness.create.execute({
        storeId,
        name: 'Funil inválido',
        segment: 'captacao_leads',
        type: 'form_lead',
        funnelId: '00000000-0000-4000-8000-000000000099',
        stageId: '00000000-0000-4000-8000-000000000098',
        content: validFormLeadContent(),
      }),
    ).rejects.toBeInstanceOf(CampaignInvalidFunnelError);
  });

  it('lists with status filter and pagination', async () => {
    const harness = createHarness();
    await harness.create.execute({
      storeId,
      name: 'Campanha A',
      segment: 'captacao_leads',
      type: 'form_lead',
      content: validFormLeadContent(),
    });
    const b = await harness.create.execute({
      storeId,
      name: 'Campanha B',
      segment: 'captacao_leads',
      type: 'form_lead',
      content: validFormLeadContent(),
    });
    await harness.updateStatus.execute({
      storeId,
      id: b.id,
      newStatus: 'finished',
    });

    const active = await harness.list.execute({
      storeId,
      status: 'active',
      page: 1,
      perPage: 10,
    });
    expect(active.total).toBe(1);
    expect(active.items[0].name).toBe('Campanha A');

    const page = await harness.list.execute({
      storeId,
      page: 1,
      perPage: 1,
    });
    expect(page.items).toHaveLength(1);
    expect(page.totalPages).toBe(2);
  });

  it('get returns 404 for other store', async () => {
    const harness = createHarness();
    const created = await harness.create.execute({
      storeId,
      name: 'Só nesta loja',
      segment: 'captacao_leads',
      type: 'form_lead',
      content: validFormLeadContent(),
    });

    await expect(
      harness.get.execute({ storeId: 'other-store', id: created.id }),
    ).rejects.toBeInstanceOf(CampaignNotFoundError);

    const found = await harness.get.execute({ storeId, id: created.id });
    expect(found.id).toBe(created.id);
  });

  it('updates status to finished', async () => {
    const harness = createHarness();
    const created = await harness.create.execute({
      storeId,
      name: 'Para finalizar',
      segment: 'captacao_leads',
      type: 'form_lead',
      content: validFormLeadContent(),
    });

    const finished = await harness.updateStatus.execute({
      storeId,
      id: created.id,
      newStatus: 'finished',
    });
    expect(finished.status).toBe('finished');
    expect(finished.endDate).toBeInstanceOf(Date);
  });

  it('syncs period campaign to finished from 00:00 BRT of end date', async () => {
    const harness = createHarness();
    const today = brazilCivilYmd(new Date());
    const future = new Date(Date.UTC(today.y, today.m - 1, today.d + 2));
    const endDateIso = future.toISOString().slice(0, 10);

    const created = await harness.create.execute({
      storeId,
      name: 'Por período',
      segment: 'captacao_leads',
      type: 'form_lead',
      statusType: 'period',
      endDate: endDateIso,
      content: validFormLeadContent(),
    });
    expect(created.status).toBe('active');

    // Simula campanha ativa com data fim = hoje (já expirada às 00:00 BRT)
    const todayYmd = `${today.y}-${String(today.m).padStart(2, '0')}-${String(today.d).padStart(2, '0')}`;
    const expired = Campaign.create(
      {
        storeId: created.storeId,
        name: created.name,
        slug: created.slug,
        segment: created.segment,
        type: created.type,
        strategy: created.strategy,
        status: 'active',
        channel: created.channel,
        statusType: 'period',
        startDate: created.startDate,
        endDate: new Date(todayYmd),
        leadLimit: null,
        views: created.views,
        submissions: created.submissions,
        funnelId: created.funnelId,
        stageId: created.stageId,
        content: created.content,
        publicUrl: created.publicUrl,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      created.id,
    );
    await harness.campaigns.save(expired);

    const got = await harness.get.execute({ storeId, id: created.id });
    expect(got.status).toBe('finished');

    const listed = await harness.list.execute({ storeId });
    const row = listed.items.find((item) => item.id === created.id);
    expect(row?.status).toBe('finished');
  });

  it('rejects period endDate on today or past', async () => {
    const harness = createHarness();
    const today = brazilCivilYmd(new Date());
    const todayYmd = `${today.y}-${String(today.m).padStart(2, '0')}-${String(today.d).padStart(2, '0')}`;
    await expect(
      harness.create.execute({
        storeId,
        name: 'Termina hoje',
        segment: 'captacao_leads',
        type: 'form_lead',
        statusType: 'period',
        endDate: todayYmd,
        content: validFormLeadContent(),
      }),
    ).rejects.toThrow(/future calendar day|data futura/i);
  });
});
