import { Organization } from '../../../tenancy/domain/entities/organization.entity';
import { InMemoryOrganizationRepository } from '../../../tenancy/tests/in-memory-tenancy.repositories';
import { ProfessionalCouncilRequiredError } from '../../domain/errors/professional-council-required.error';
import { InMemoryMemberRepository } from '../../tests/in-memory-member.repository';
import { ResolveProfessionalCouncilService } from './resolve-professional-council.service';

function createService(params?: {
  clinicStrand?: 'odontologia' | 'fisioterapia' | 'nutricao';
  storeId?: string;
}) {
  const members = new InMemoryMemberRepository();
  const organizations = new InMemoryOrganizationRepository();
  const storeId = params?.storeId ?? 'store-1';

  organizations.items.push(
    Organization.create(
      {
        storeId,
        name: 'Clínica Teste',
        status: 'active',
        clinicStrand: params?.clinicStrand ?? 'odontologia',
        plan: {
          planId: null,
          tier: null,
          maxClinics: null,
          maxUsers: null,
        },
        overQuota: false,
        suspendedReason: null,
        platformUpdatedAt: null,
        syncedAt: new Date(),
      },
      'org-1',
    ),
  );

  return {
    members,
    organizations,
    service: new ResolveProfessionalCouncilService(members, organizations),
    storeId,
  };
}

describe('ResolveProfessionalCouncilService', () => {
  it('persists council on member when empty and body is valid', async () => {
    const { members, service, storeId } = createService();
    const member = await members.create({
      organizationId: 'org-1',
      keycloakSub: 'sub-1',
      username: 'dr.joao',
      email: null,
      firstName: 'João',
      lastName: 'Silva',
      hasPassword: true,
      clinics: [{ clinicId: 'clinic-1', role: 'dentista', permissions: [] }],
    });

    const snapshot = await service.execute({
      context: 'test',
      professionalId: member.id,
      storeId,
      input: { councilType: 'CRO', councilNumber: '12345', councilUf: 'ba' },
    });

    expect(snapshot).toEqual({
      councilType: 'CRO',
      councilNumber: '12345',
      councilUf: 'BA',
    });
    const stored = await members.findById(member.id);
    expect(stored?.councilType).toBe('CRO');
    expect(stored?.councilNumber).toBe('12345');
    expect(stored?.councilUf).toBe('BA');
  });

  it('persists CREFITO regional for fisioterapia store', async () => {
    const { members, service, storeId } = createService({ clinicStrand: 'fisioterapia' });
    const member = await members.create({
      organizationId: 'org-1',
      keycloakSub: 'sub-1',
      username: 'fisio.joao',
      email: null,
      firstName: 'João',
      lastName: 'Silva',
      hasPassword: true,
      clinics: [{ clinicId: 'clinic-1', role: 'dentista', permissions: [] }],
    });

    const snapshot = await service.execute({
      context: 'test',
      professionalId: member.id,
      storeId,
      input: { councilType: 'CREFITO', councilNumber: '12345', councilUf: '7' },
    });

    expect(snapshot).toEqual({
      councilType: 'CREFITO',
      councilNumber: '12345',
      councilUf: '07',
    });
  });

  it('rejects CRO body on fisioterapia store', async () => {
    const { members, service, storeId } = createService({ clinicStrand: 'fisioterapia' });
    const member = await members.create({
      organizationId: 'org-1',
      keycloakSub: 'sub-1',
      username: 'fisio.joao',
      email: null,
      firstName: 'João',
      lastName: 'Silva',
      hasPassword: true,
      clinics: [{ clinicId: 'clinic-1', role: 'dentista', permissions: [] }],
    });

    await expect(
      service.execute({
        context: 'test',
        professionalId: member.id,
        storeId,
        input: { councilType: 'CRO', councilNumber: '12345', councilUf: 'BA' },
      }),
    ).rejects.toBeInstanceOf(ProfessionalCouncilRequiredError);
  });

  it('ignores body when member already has council', async () => {
    const { members, service, storeId } = createService();
    const member = await members.create({
      organizationId: 'org-1',
      keycloakSub: 'sub-1',
      username: 'dr.joao',
      email: null,
      firstName: 'João',
      lastName: 'Silva',
      hasPassword: true,
      clinics: [{ clinicId: 'clinic-1', role: 'dentista', permissions: [] }],
    });
    await members.setProfessionalCouncilIfEmpty(member.id, {
      councilType: 'CRM',
      councilNumber: '999',
      councilUf: 'SP',
    });

    const snapshot = await service.execute({
      context: 'test',
      professionalId: member.id,
      storeId,
      input: { councilType: 'CRO', councilNumber: '111', councilUf: 'BA' },
    });

    expect(snapshot).toEqual({
      councilType: 'CRM',
      councilNumber: '999',
      councilUf: 'SP',
    });
    const stored = await members.findById(member.id);
    expect(stored?.councilNumber).toBe('999');
  });

  it('throws when member has no council and body is missing', async () => {
    const { members, service, storeId } = createService();
    const member = await members.create({
      organizationId: 'org-1',
      keycloakSub: 'sub-1',
      username: 'dr.joao',
      email: null,
      firstName: 'João',
      lastName: 'Silva',
      hasPassword: true,
      clinics: [{ clinicId: 'clinic-1', role: 'dentista', permissions: [] }],
    });

    await expect(
      service.execute({
        context: 'test',
        professionalId: member.id,
        storeId,
        input: null,
      }),
    ).rejects.toBeInstanceOf(ProfessionalCouncilRequiredError);
  });
});
