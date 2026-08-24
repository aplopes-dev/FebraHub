import { Campaign } from '../../../../marketing/campaigns/domain/entities/campaign.entity';
import { InMemoryCampaignRepository } from '../../../../marketing/campaigns/tests/in-memory-campaign.repository';
import { WhatsappConnection } from '../../../domain/entities/whatsapp-connection.entity';
import { InMemoryBirthdayCampaignPatientRepository } from '../../../tests/in-memory-birthday-campaign-patient.repository';
import { InMemoryWhatsappConnectionRepository } from '../../../tests/in-memory-whatsapp-connection.repository';
import { InMemoryWhatsappMessageRepository } from '../../../tests/in-memory-whatsapp-message.repository';
import {
  birthdaySendSlotsAvailable,
  DispatchDueBirthdayCampaignsUseCase,
  formatBrazilCivilYmd,
  isAtOrAfterBrazilSevenAm,
  isBrazilSevenAmMinute,
} from './dispatch-due-birthday-campaigns.use-case';

class FakeClinicProfileRepository {
  async findByStoreId() {
    return {
      communicationsName: 'Clínica Teste',
      clinicName: 'Clínica Teste',
      mobile: '11999999999',
      phone: '',
    };
  }
}

class FakePublisher {
  readonly sent: Array<{ storeId: string; messageId: string }> = [];
  async publishSend(payload: { storeId: string; messageId: string }) {
    this.sent.push(payload);
  }
}

function createCampaign(overrides: Partial<{ id: string; storeId: string }> = {}) {
  return Campaign.create({
    storeId: overrides.storeId ?? 'store-1',
    name: 'Aniversariantes',
    slug: 'aniversariantes',
    segment: 'relacionamento_pos_venda',
    type: 'aniversario',
    strategy: 'BROADCAST',
    channel: 'whatsapp',
    statusType: 'always_active',
    startDate: new Date(),
    endDate: null,
    leadLimit: null,
    funnelId: null,
    stageId: null,
    content: {
      planIds: [],
      specialtyIds: [],
      genders: [],
      messageBody: 'Feliz aniversário, {nome_paciente}! — {nome_clinica}',
    },
    publicUrl: 'https://example.com',
  });
}

function seedTodayPatients(
  patients: InMemoryBirthdayCampaignPatientRepository,
  now: Date,
) {
  const civil = formatBrazilCivilYmd(now);
  const [, m, d] = civil.split('-').map(Number);
  patients.seed([
    {
      id: 'p1',
      storeId: 'store-1',
      name: 'Ana',
      phone: '11988887777',
      guardianPhone: '',
      birthMonth: m!,
      birthDay: d!,
    },
    {
      id: 'p2',
      storeId: 'store-1',
      name: 'Bruno',
      phone: '11977776666',
      guardianPhone: '',
      birthMonth: m!,
      birthDay: d!,
    },
    {
      id: 'p3',
      storeId: 'store-1',
      name: 'Carla',
      phone: '11966665555',
      guardianPhone: '',
      birthMonth: m!,
      birthDay: d!,
    },
  ]);
}

describe('birthdaySendSlotsAvailable', () => {
  it('is 0 before 07:00 BRT', () => {
    // 06:59 BRT = 09:59 UTC
    expect(
      birthdaySendSlotsAvailable(new Date('2026-07-30T09:59:00.000Z')),
    ).toBe(0);
  });

  it('is 1 at 07:00 BRT and grows every 5 minutes', () => {
    // 07:00 BRT = 10:00 UTC
    expect(
      birthdaySendSlotsAvailable(new Date('2026-07-30T10:00:00.000Z')),
    ).toBe(1);
    // 07:04 BRT
    expect(
      birthdaySendSlotsAvailable(new Date('2026-07-30T10:04:59.000Z')),
    ).toBe(1);
    // 07:05 BRT
    expect(
      birthdaySendSlotsAvailable(new Date('2026-07-30T10:05:00.000Z')),
    ).toBe(2);
    // 07:10 BRT
    expect(
      birthdaySendSlotsAvailable(new Date('2026-07-30T10:10:00.000Z')),
    ).toBe(3);
  });
});

describe('isAtOrAfterBrazilSevenAm', () => {
  it('is false before 07:00 BRT and true after', () => {
    expect(
      isAtOrAfterBrazilSevenAm(new Date('2026-07-30T09:59:00.000Z')),
    ).toBe(false);
    expect(
      isAtOrAfterBrazilSevenAm(new Date('2026-07-30T10:00:00.000Z')),
    ).toBe(true);
  });
});

describe('DispatchDueBirthdayCampaignsUseCase', () => {
  it('enqueues only the first patient at 07:00 BRT', async () => {
    const campaigns = new InMemoryCampaignRepository();
    const connections = new InMemoryWhatsappConnectionRepository();
    const messages = new InMemoryWhatsappMessageRepository();
    const patients = new InMemoryBirthdayCampaignPatientRepository();
    const publisher = new FakePublisher();

    const campaign = createCampaign();
    await campaigns.create(campaign);

    await connections.save(
      WhatsappConnection.create({
        storeId: 'store-1',
        status: 'connected',
        phoneE164: '+5511999999999',
      }),
    );

    const now = new Date('2026-07-30T10:00:00.000Z'); // 07:00 BRT
    seedTodayPatients(patients, now);

    const useCase = new DispatchDueBirthdayCampaignsUseCase(
      campaigns,
      connections,
      messages,
      patients,
      new FakeClinicProfileRepository() as never,
      publisher as never,
    );

    const result = await useCase.execute({ now });
    expect(result.enqueued).toBe(1);
    expect(publisher.sent).toHaveLength(1);

    const after = await campaigns.findById('store-1', campaign.id);
    expect(after?.views).toBe(1);

    const again = await useCase.execute({ now });
    expect(again.enqueued).toBe(0);
  });

  it('enqueues the next patient only after 5 minutes', async () => {
    const campaigns = new InMemoryCampaignRepository();
    const connections = new InMemoryWhatsappConnectionRepository();
    const messages = new InMemoryWhatsappMessageRepository();
    const patients = new InMemoryBirthdayCampaignPatientRepository();
    const publisher = new FakePublisher();

    const campaign = createCampaign();
    await campaigns.create(campaign);

    await connections.save(
      WhatsappConnection.create({
        storeId: 'store-1',
        status: 'connected',
        phoneE164: '+5511999999999',
      }),
    );

    seedTodayPatients(patients, new Date('2026-07-30T10:00:00.000Z'));

    const useCase = new DispatchDueBirthdayCampaignsUseCase(
      campaigns,
      connections,
      messages,
      patients,
      new FakeClinicProfileRepository() as never,
      publisher as never,
    );

    expect(
      (await useCase.execute({ now: new Date('2026-07-30T10:00:00.000Z') }))
        .enqueued,
    ).toBe(1);

    expect(
      (await useCase.execute({ now: new Date('2026-07-30T10:04:00.000Z') }))
        .enqueued,
    ).toBe(0);

    expect(
      (await useCase.execute({ now: new Date('2026-07-30T10:05:00.000Z') }))
        .enqueued,
    ).toBe(1);
    expect(publisher.sent).toHaveLength(2);

    expect(
      (await useCase.execute({ now: new Date('2026-07-30T10:10:00.000Z') }))
        .enqueued,
    ).toBe(1);
    expect(publisher.sent).toHaveLength(3);
  });

  it('does not enqueue before 07:00 BRT', async () => {
    const campaigns = new InMemoryCampaignRepository();
    const connections = new InMemoryWhatsappConnectionRepository();
    const messages = new InMemoryWhatsappMessageRepository();
    const patients = new InMemoryBirthdayCampaignPatientRepository();

    await campaigns.create(createCampaign());
    await connections.save(
      WhatsappConnection.create({
        storeId: 'store-1',
        status: 'connected',
        phoneE164: '+5511999999999',
      }),
    );

    const now = new Date('2026-07-30T09:59:00.000Z'); // 06:59 BRT
    seedTodayPatients(patients, now);

    const useCase = new DispatchDueBirthdayCampaignsUseCase(
      campaigns,
      connections,
      messages,
      patients,
      new FakeClinicProfileRepository() as never,
      { publishSend: async () => undefined } as never,
    );

    const result = await useCase.execute({ now });
    expect(result.enqueued).toBe(0);
    expect(result.scannedCampaigns).toBe(0);
  });

  it('skips when whatsapp is not connected', async () => {
    const campaigns = new InMemoryCampaignRepository();
    const connections = new InMemoryWhatsappConnectionRepository();
    const messages = new InMemoryWhatsappMessageRepository();
    const patients = new InMemoryBirthdayCampaignPatientRepository();

    await campaigns.create(createCampaign());

    const useCase = new DispatchDueBirthdayCampaignsUseCase(
      campaigns,
      connections,
      messages,
      patients,
      new FakeClinicProfileRepository() as never,
      { publishSend: async () => undefined } as never,
    );

    const result = await useCase.execute({
      now: new Date('2026-07-30T10:00:00.000Z'),
    });
    expect(result.enqueued).toBe(0);
    expect(result.skipped).toBe(1);
  });
});

describe('isBrazilSevenAmMinute', () => {
  it('detects 07:00 BRT', () => {
    // 07:00 BRT = 10:00 UTC
    expect(
      isBrazilSevenAmMinute(new Date('2026-07-30T10:00:30.000Z')),
    ).toBe(true);
    expect(
      isBrazilSevenAmMinute(new Date('2026-07-30T10:01:00.000Z')),
    ).toBe(false);
  });
});
