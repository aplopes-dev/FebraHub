import { permissionsForRole } from '../../../../settings/domain/entities/team-member.entity';
import { InMemoryLeadRepository } from '../../../../leads/infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { makeCreateLeadUseCase } from '../../../../leads/application/use-cases/shared/lead-use-case-test-fixtures';
import { InMemoryPropertyRepository } from '../../../../properties/infrastructure/database/in-memory-property.repository';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  StoreSettingsEntity,
} from '../../../../settings/domain/entities/store-settings.entity';
import { InMemoryStoreSettingsRepository } from '../../../../settings/infrastructure/database/in-memory-store-settings.repository';
import { InMemoryTeamMemberRepository } from '../../../../settings/infrastructure/database/in-memory-team-member.repository';
import {
  PublicLeadMailer,
  type PublicLeadEmailPayload,
} from '../../ports/public-lead-mailer.port';
import { PublicAgentNotFoundError } from '../../../domain/errors/public-agent-not-found.error';
import { GetPublicListingUseCase } from '../get-public-listing/get-public-listing.use-case';
import { NotifyPublicLeadUseCase } from '../notify-public-lead/notify-public-lead.use-case';
import { SubmitPublicLeadUseCase } from './submit-public-lead.use-case';

const STORE = 'dev-store-imoveis';

class FakePublicLeadMailer extends PublicLeadMailer {
  readonly sent: PublicLeadEmailPayload[] = [];

  async sendLeadAlert(
    payload: PublicLeadEmailPayload,
  ): Promise<PublicLeadEmailPayload> {
    this.sent.push(payload);
    return payload;
  }
}

describe('SubmitPublicLeadUseCase', () => {
  let members: InMemoryTeamMemberRepository;
  let properties: InMemoryPropertyRepository;
  let leads: InMemoryLeadRepository;
  let storeSettings: InMemoryStoreSettingsRepository;
  let mailer: FakePublicLeadMailer;
  let useCase: SubmitPublicLeadUseCase;
  let listingId: string;

  beforeEach(async () => {
    members = new InMemoryTeamMemberRepository();
    properties = new InMemoryPropertyRepository();
    leads = new InMemoryLeadRepository();
    storeSettings = new InMemoryStoreSettingsRepository();
    mailer = new FakePublicLeadMailer();

    await members.create(STORE, {
      agentId: 'ana-helena',
      name: 'Ana Helena',
      email: 'ana@imob.com',
      phone: '',
      role: 'broker',
      initials: 'AH',
      active: true,
      permissions: permissionsForRole('broker'),
      temporaryPassword: null,
      passwordHash: null,
      mustChangePassword: false,
      lastAccessAt: null,
    });

    const listing = await properties.create({
      storeId: STORE,
      name: 'Apartamento Centro',
      type: 'apartment',
      status: 'available',
      listingType: 'rent',
      agentId: 'ana-helena',
      cost: 2500,
      bedrooms: 2,
      sizeSqm: 72,
      city: 'Ilhéus',
      state: 'BA',
      address: 'Centro, Ilhéus',
    });
    listingId = listing.id;

    const createLead = makeCreateLeadUseCase(
      leads,
      new InMemoryAppointmentRepository(),
      new InMemoryDealRepository(),
    );

    useCase = new SubmitPublicLeadUseCase(
      members,
      properties,
      new GetPublicListingUseCase(members, properties),
      createLead,
      new NotifyPublicLeadUseCase(storeSettings, mailer),
    );
  });

  it('cria lead com defaults website e agentId do slug', async () => {
    const result = await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
      name: 'João Visitante',
      phone: '(73) 98888-7777',
    });

    expect(result.name).toBe('João Visitante');
    expect(result.leadSource).toBe('website');
    expect(result.status).toBe('new');
    expect(result.agentIds).toEqual(['ana-helena']);
    expect(result.purpose).toBe('buying');
    expect(result.interestedPropertyType).toBe('apartment');
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]?.to).toBe('ana@imob.com');
    expect(mailer.sent[0]?.leadName).toBe('João Visitante');
    expect(mailer.sent[0]?.leadPhone).toBe('(73) 98888-7777');
  });

  it('infere purpose e imóvel quando listingId informado', async () => {
    const result = await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
      name: 'Maria',
      email: 'maria@example.com',
      listingId,
      message: 'Quero agendar visita',
    });

    expect(result.purpose).toBe('renting');
    expect(result.interestedPropertyType).toBe('apartment');
    expect(result.matchedProperties).toEqual([
      expect.objectContaining({
        propertyId: listingId,
        propertyName: 'Apartamento Centro',
      }),
    ]);
    expect(result.notes).toBe('Quero agendar visita');
    expect(
      result.activities.some(
        (a) => a.message === 'Lead criado via catálogo público',
      ),
    ).toBe(true);
    expect(mailer.sent[0]?.propertyName).toBe('Apartamento Centro');
    expect(mailer.sent[0]?.message).toBe('Quero agendar visita');
    expect(mailer.sent[0]?.leadEmail).toBe('maria@example.com');
  });

  it('não envia e-mail quando alertas de leads estão desligados', async () => {
    await storeSettings.upsert(STORE, {
      system: StoreSettingsEntity.default(STORE).system,
      notifications: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        leadsAlerts: false,
      },
      integrations: StoreSettingsEntity.default(STORE).integrations,
    });

    await useCase.execute({
      storeId: STORE,
      slug: 'ana-helena',
      name: 'Sem e-mail',
      phone: '73999999999',
    });

    expect(mailer.sent).toHaveLength(0);
  });

  it('ainda cria o lead se o mailer falhar', async () => {
    const brokenMailer = new FakePublicLeadMailer();
    brokenMailer.sendLeadAlert = async () => {
      throw new Error('smtp down');
    };

    const createLead = makeCreateLeadUseCase(
      leads,
      new InMemoryAppointmentRepository(),
      new InMemoryDealRepository(),
    );
    const failing = new SubmitPublicLeadUseCase(
      members,
      properties,
      new GetPublicListingUseCase(members, properties),
      createLead,
      new NotifyPublicLeadUseCase(storeSettings, brokenMailer),
    );

    const result = await failing.execute({
      storeId: STORE,
      slug: 'ana-helena',
      name: 'Lead ok',
      phone: '73988887777',
    });

    expect(result.name).toBe('Lead ok');
  });

  it('rejeita slug inexistente', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        slug: 'inexistente',
        name: 'Test',
        phone: '73999999999',
      }),
    ).rejects.toBeInstanceOf(PublicAgentNotFoundError);
  });

  it('rejeita quando falta telefone e e-mail', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        slug: 'ana-helena',
        name: 'Test',
      }),
    ).rejects.toMatchObject({ message: 'Informe telefone ou e-mail' });
  });
});
