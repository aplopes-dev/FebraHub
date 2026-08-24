import { Organization } from '../../../tenancy/domain/entities/organization.entity';
import { InMemoryOrganizationRepository } from '../../../tenancy/tests/in-memory-tenancy.repositories';
import { InMemoryMemberRepository } from '../../tests/in-memory-member.repository';
import { GetMyAccessUseCase } from './get-my-access.use-case';

const STORE_ID = 'a1b2c3d4-1111-4111-8111-111111111111';
const ORGANIZATION_ID = 'org-1';
const CLINIC_ID = 'clinic-root';

async function buildUseCase() {
  const members = new InMemoryMemberRepository();
  const organizations = new InMemoryOrganizationRepository();

  await organizations.save(
    Organization.create(
      {
        storeId: STORE_ID,
        name: 'Clínica Demo',
        status: 'active',
        plan: { planId: null, tier: null, maxClinics: null, maxUsers: null },
        overQuota: false,
        suspendedReason: null,
        platformUpdatedAt: null,
        syncedAt: new Date(),
      },
      ORGANIZATION_ID,
    ),
  );

  return { members, organizations, useCase: new GetMyAccessUseCase(members, organizations) };
}

describe('GetMyAccessUseCase — primeiro acesso', () => {
  it('marca hasPassword ao autenticar membro ainda pendente de primeiro acesso', async () => {
    const { members, useCase } = await buildUseCase();

    await members.create({
      organizationId: ORGANIZATION_ID,
      keycloakSub: 'kc-pending',
      username: 'ana.silva',
      email: 'ana@clinica.com.br',
      firstName: 'Ana',
      lastName: 'Silva',
      hasPassword: false,
      clinics: [{ clinicId: CLINIC_ID, role: 'gerente', permissions: [] }],
    });
    await members.markProvisionalPassword(
      (await members.findByKeycloakSub('kc-pending'))!.id,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    const before = await members.findByKeycloakSub('kc-pending');
    expect(before?.hasPassword).toBe(false);

    const result = await useCase.execute('kc-pending');

    expect(result.organization?.clinicStrand).toBe('odontologia');
    expect(result.organization?.features.locationMaps).toEqual([
      'tooth',
      'face',
    ]);
    expect(result.organization?.copy.roleLabels.professional).toBe('Dentista');
    expect(result.member?.id).toBe(before?.id);
    const after = await members.findByKeycloakSub('kc-pending');
    expect(after?.hasPassword).toBe(true);
    expect(after?.provisionalExpiresAt).toBeNull();
  });

  it('não altera membro que já definiu senha', async () => {
    const { members, useCase } = await buildUseCase();

    await members.create({
      organizationId: ORGANIZATION_ID,
      keycloakSub: 'kc-active',
      username: 'joao',
      email: null,
      firstName: 'João',
      lastName: 'Souza',
      hasPassword: true,
      clinics: [{ clinicId: CLINIC_ID, role: 'dentista', permissions: [] }],
    });

    await useCase.execute('kc-active');

    const after = await members.findByKeycloakSub('kc-active');
    expect(after?.hasPassword).toBe(true);
  });

  it('devolve member null quando o sub não é da vertical', async () => {
    const { useCase } = await buildUseCase();

    await expect(useCase.execute('kc-desconhecido')).resolves.toEqual({
      member: null,
      organization: null,
      clinics: [],
    });
  });
});
