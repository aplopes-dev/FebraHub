import { Clinic } from '../../domain/entities/clinic.entity';
import {
  Organization,
  type OrganizationPlanSnapshot,
} from '../../domain/entities/organization.entity';
import {
  ClinicQuotaExceededError,
  ClinicSlugTakenError,
  OrganizationNotFoundError,
  OrganizationSuspendedError,
} from '../../domain/errors/tenancy.errors';
import {
  InMemoryClinicRepository,
  InMemoryOrganizationRepository,
} from '../../tests/in-memory-tenancy.repositories';
import { CreateClinicUseCase } from './create-clinic.use-case';

const STORE_ID = 'store-1';

function buildOrganization(
  plan: Partial<OrganizationPlanSnapshot> = {},
  status: 'active' | 'suspended' = 'active',
): Organization {
  return Organization.create(
    {
      storeId: STORE_ID,
      name: 'Org Teste',
      status,
      plan: {
        planId: 'plan-1',
        tier: 'prata',
        maxClinics: 1,
        maxUsers: 5,
        ...plan,
      },
      overQuota: false,
      suspendedReason: null,
      platformUpdatedAt: null,
      syncedAt: new Date(),
    },
    'org-1',
  );
}

function buildRootClinic(): Clinic {
  return Clinic.create(
    {
      organizationId: 'org-1',
      name: 'Matriz',
      slug: 'matriz',
      isRoot: true,
      status: 'active',
      legalName: null,
      document: null,
      stateRegistration: null,
      zipCode: null,
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
      phone: null,
      timezone: 'America/Sao_Paulo',
    },
    STORE_ID,
  );
}

describe('CreateClinicUseCase', () => {
  let organizations: InMemoryOrganizationRepository;
  let clinics: InMemoryClinicRepository;
  let useCase: CreateClinicUseCase;

  beforeEach(() => {
    organizations = new InMemoryOrganizationRepository();
    clinics = new InMemoryClinicRepository();
    useCase = new CreateClinicUseCase(organizations, clinics);
  });

  it('cria a 2ª clínica quando o plano permite', async () => {
    await organizations.save(buildOrganization({ maxClinics: 3 }));
    await clinics.save(buildRootClinic());

    const clinic = await useCase.execute({
      storeId: STORE_ID,
      name: 'Unidade Centro',
    });

    expect(clinic.slug).toBe('unidade-centro');
    expect(clinic.isRoot).toBe(false);
    expect(await clinics.countActiveByOrganizationId('org-1')).toBe(2);
  });

  it('bloqueia quando a quota do plano está no limite', async () => {
    await organizations.save(buildOrganization({ maxClinics: 1 }));
    await clinics.save(buildRootClinic());

    await expect(
      useCase.execute({ storeId: STORE_ID, name: 'Unidade Centro' }),
    ).rejects.toBeInstanceOf(ClinicQuotaExceededError);
  });

  it('libera quando o plano ainda não sincronizou (maxClinics nulo)', async () => {
    // Bloquear por falta de dado nosso puniria o cliente por um evento atrasado.
    await organizations.save(buildOrganization({ maxClinics: null }));
    await clinics.save(buildRootClinic());

    await expect(
      useCase.execute({ storeId: STORE_ID, name: 'Unidade Centro' }),
    ).resolves.toBeDefined();
  });

  it('bloqueia criação quando a organização está overQuota (pós-downgrade)', async () => {
    const org = buildOrganization({ maxClinics: 3 });
    org.applyPlan(
      { planId: 'plan-2', tier: 'prata', maxClinics: 1, maxUsers: 5 },
      3,
    );
    await organizations.save(org);
    await clinics.save(buildRootClinic());

    expect(org.overQuota).toBe(true);
    await expect(
      useCase.execute({ storeId: STORE_ID, name: 'Nova' }),
    ).rejects.toBeInstanceOf(ClinicQuotaExceededError);
  });

  it('bloqueia quando a organização está suspensa', async () => {
    await organizations.save(buildOrganization({ maxClinics: 5 }, 'suspended'));

    await expect(
      useCase.execute({ storeId: STORE_ID, name: 'Unidade Centro' }),
    ).rejects.toBeInstanceOf(OrganizationSuspendedError);
  });

  it('rejeita slug duplicado na mesma organização', async () => {
    await organizations.save(buildOrganization({ maxClinics: 5 }));
    await clinics.save(buildRootClinic());

    await expect(
      useCase.execute({ storeId: STORE_ID, name: 'Matriz' }),
    ).rejects.toBeInstanceOf(ClinicSlugTakenError);
  });

  it('falha quando não existe organização para a loja', async () => {
    await expect(
      useCase.execute({ storeId: 'inexistente', name: 'X' }),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });
});
