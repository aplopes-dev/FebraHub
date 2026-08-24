import { Campaign } from '../../../domain/entities/campaign.entity';
import { birthdayMessageCorrelationId } from '../../../domain/content/aniversario.content';
import { InMemoryCampaignRepository } from '../../../tests/in-memory-campaign.repository';
import { WhatsappMessage } from '../../../../../whatsapp/domain/entities/whatsapp-message.entity';
import { InMemoryWhatsappMessageRepository } from '../../../../../whatsapp/tests/in-memory-whatsapp-message.repository';
import { ListCampaignWhatsappMessagesUseCase } from './list-campaign-whatsapp-messages.use-case';

describe('ListCampaignWhatsappMessagesUseCase', () => {
  it('lists birthday messages with patient names', async () => {
    const campaigns = new InMemoryCampaignRepository();
    const messages = new InMemoryWhatsappMessageRepository();

    const campaign = Campaign.create({
      storeId: 'store-1',
      name: 'Aniversariantes',
      slug: 'aniversariantes',
      segment: 'relacionamento_pos_venda',
      type: 'aniversario',
      strategy: 'BROADCAST',
      channel: 'whatsapp',
      statusType: 'always_active',
      content: {
        planIds: [],
        specialtyIds: [],
        genders: [],
        messageBody: 'Feliz aniversário!',
      },
    });
    await campaigns.create(campaign);

    messages.seedPatientName('p1', 'Ana Silva');
    await messages.save(
      WhatsappMessage.create({
        storeId: 'store-1',
        patientId: 'p1',
        direction: 'outbound',
        body: 'oi',
        toE164: '+5511999999999',
        status: 'sent',
        templateKey: 'birthday',
        correlationId: birthdayMessageCorrelationId(
          campaign.id,
          'p1',
          '2026-07-30',
        ),
      }),
    );

    const useCase = new ListCampaignWhatsappMessagesUseCase(
      campaigns,
      messages,
    );
    const result = await useCase.execute({
      storeId: 'store-1',
      campaignId: campaign.id,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.patientName).toBe('Ana Silva');
    expect(result.items[0]?.status).toBe('sent');
    expect(result.items[0]?.replyBody).toBeNull();
  });

  it('filters only messages with patient replies', async () => {
    const campaigns = new InMemoryCampaignRepository();
    const messages = new InMemoryWhatsappMessageRepository();

    const campaign = Campaign.create({
      storeId: 'store-1',
      name: 'Aniversariantes',
      slug: 'aniversariantes',
      segment: 'relacionamento_pos_venda',
      type: 'aniversario',
      strategy: 'BROADCAST',
      channel: 'whatsapp',
      statusType: 'always_active',
      content: {
        planIds: [],
        specialtyIds: [],
        genders: [],
        messageBody: 'Feliz aniversário!',
      },
    });
    await campaigns.create(campaign);

    const correlation = birthdayMessageCorrelationId(
      campaign.id,
      'p1',
      '2026-07-30',
    );
    messages.seedPatientName('p1', 'Ana Silva');
    await messages.save(
      WhatsappMessage.create({
        storeId: 'store-1',
        patientId: 'p1',
        direction: 'outbound',
        body: 'Feliz!',
        toE164: '+5511999999999',
        status: 'sent',
        templateKey: 'birthday',
        correlationId: correlation,
      }),
    );
    await messages.save(
      WhatsappMessage.create({
        storeId: 'store-1',
        patientId: 'p1',
        direction: 'inbound',
        body: 'Obrigada!',
        toE164: '+5511999999999',
        status: 'received',
        templateKey: 'birthday',
        correlationId: correlation,
      }),
    );

    const useCase = new ListCampaignWhatsappMessagesUseCase(
      campaigns,
      messages,
    );
    const result = await useCase.execute({
      storeId: 'store-1',
      campaignId: campaign.id,
      withRepliesOnly: true,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.replyBody).toBe('Obrigada!');
  });

  it('matches reply by patient window when correlation differs', async () => {
    const campaigns = new InMemoryCampaignRepository();
    const messages = new InMemoryWhatsappMessageRepository();

    const campaign = Campaign.create({
      storeId: 'store-1',
      name: 'Aniversariantes',
      slug: 'aniversariantes',
      segment: 'relacionamento_pos_venda',
      type: 'aniversario',
      strategy: 'BROADCAST',
      channel: 'whatsapp',
      statusType: 'always_active',
      content: {
        planIds: [],
        specialtyIds: [],
        genders: [],
        messageBody: 'Feliz aniversário!',
      },
    });
    await campaigns.create(campaign);

    const outboundAt = new Date('2026-07-30T13:25:00.000Z');
    messages.seedPatientName('p1', 'Lorena Reis');
    await messages.save(
      WhatsappMessage.create({
        storeId: 'store-1',
        patientId: 'p1',
        direction: 'outbound',
        body: 'Feliz!',
        toE164: '+5573981990809',
        status: 'sent',
        templateKey: 'birthday',
        correlationId: birthdayMessageCorrelationId(
          campaign.id,
          'p1',
          '2026-07-30',
        ),
        createdAt: outboundAt,
        updatedAt: outboundAt,
      }),
    );
    const replyAt = new Date('2026-07-30T13:32:00.000Z');
    await messages.save(
      WhatsappMessage.create({
        storeId: 'store-1',
        patientId: 'p1',
        direction: 'inbound',
        body: 'Obrigada',
        toE164: '+5573981990809',
        status: 'received',
        correlationId: 'appointment-uuid-old',
        createdAt: replyAt,
        updatedAt: replyAt,
      }),
    );

    const useCase = new ListCampaignWhatsappMessagesUseCase(
      campaigns,
      messages,
    );
    const result = await useCase.execute({
      storeId: 'store-1',
      campaignId: campaign.id,
      withRepliesOnly: true,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.patientName).toBe('Lorena Reis');
    expect(result.items[0]?.replyBody).toBe('Obrigada');
  });

  it('filters by patient name search', async () => {
    const campaigns = new InMemoryCampaignRepository();
    const messages = new InMemoryWhatsappMessageRepository();

    const campaign = Campaign.create({
      storeId: 'store-1',
      name: 'Aniversariantes',
      slug: 'aniversariantes',
      segment: 'relacionamento_pos_venda',
      type: 'aniversario',
      strategy: 'BROADCAST',
      channel: 'whatsapp',
      statusType: 'always_active',
      content: {
        planIds: [],
        specialtyIds: [],
        genders: [],
        messageBody: 'Feliz aniversário!',
      },
    });
    await campaigns.create(campaign);

    messages.seedPatientName('p1', 'Lorena Reis');
    messages.seedPatientName('p2', 'Ana Silva');
    await messages.save(
      WhatsappMessage.create({
        storeId: 'store-1',
        patientId: 'p1',
        direction: 'outbound',
        body: 'Feliz!',
        toE164: '+5573981990809',
        status: 'sent',
        templateKey: 'birthday',
        correlationId: birthdayMessageCorrelationId(
          campaign.id,
          'p1',
          '2026-07-30',
        ),
      }),
    );
    await messages.save(
      WhatsappMessage.create({
        storeId: 'store-1',
        patientId: 'p2',
        direction: 'outbound',
        body: 'Feliz!',
        toE164: '+5511999999999',
        status: 'sent',
        templateKey: 'birthday',
        correlationId: birthdayMessageCorrelationId(
          campaign.id,
          'p2',
          '2026-07-30',
        ),
      }),
    );

    const useCase = new ListCampaignWhatsappMessagesUseCase(
      campaigns,
      messages,
    );
    const result = await useCase.execute({
      storeId: 'store-1',
      campaignId: campaign.id,
      search: 'lorena',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.patientName).toBe('Lorena Reis');
  });
});
