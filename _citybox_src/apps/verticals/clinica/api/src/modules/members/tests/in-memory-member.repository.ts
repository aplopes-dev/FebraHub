import {
  MemberRepository,
  type CreateMemberData,
  type MemberPersistenceRecord,
  type MemberRecord,
  type RestoreMemberData,
  type UpdateMemberData,
} from '../domain/repositories/member.repository';
import {
  toProfessionalCouncilSnapshot,
  type ProfessionalCouncilSnapshot,
} from '../domain/professional-council';

/**
 * Dublê da persistência de equipe para testes de use case.
 *
 * Reproduz de propósito as duas regras que o banco garante, para que um teste verde aqui
 * signifique alguma coisa: `username` é único global e existe **no máximo um OWNER vivo**
 * por organização (índice único parcial `members_one_owner_per_organization`).
 * Também modela `keycloak_sub` único global (inclui soft-deleted).
 */
export class InMemoryMemberRepository extends MemberRepository {
  readonly items: MemberPersistenceRecord[] = [];
  private sequence = 0;

  private alive(): MemberPersistenceRecord[] {
    return this.items.filter((m) => m.deletedAt === null);
  }

  async findById(id: string): Promise<MemberRecord | null> {
    return this.alive().find((m) => m.id === id) ?? null;
  }

  async findByUsername(username: string): Promise<MemberRecord | null> {
    return this.alive().find((m) => m.username === username) ?? null;
  }

  async findOwnerByOrganization(
    organizationId: string,
  ): Promise<MemberRecord | null> {
    return (
      this.alive().find(
        (m) =>
          m.organizationId === organizationId && m.organizationRole === 'OWNER',
      ) ?? null
    );
  }

  async findByEmail(email: string): Promise<MemberRecord | null> {
    return this.alive().find((m) => m.email === email) ?? null;
  }

  async findByKeycloakSub(sub: string): Promise<MemberRecord | null> {
    return this.alive().find((m) => m.keycloakSub === sub) ?? null;
  }

  async findAnyByKeycloakSub(
    sub: string,
  ): Promise<MemberPersistenceRecord | null> {
    return this.items.find((m) => m.keycloakSub === sub) ?? null;
  }

  async findAnyByUsername(
    username: string,
  ): Promise<MemberPersistenceRecord | null> {
    return this.items.find((m) => m.username === username) ?? null;
  }

  async listByOrganization(organizationId: string): Promise<MemberRecord[]> {
    return this.alive().filter((m) => m.organizationId === organizationId);
  }

  async countActiveByOrganization(organizationId: string): Promise<number> {
    return this.alive().filter(
      (m) => m.organizationId === organizationId && m.status === 'active',
    ).length;
  }

  async create(data: CreateMemberData): Promise<MemberRecord> {
    if (await this.findAnyByUsername(data.username)) {
      throw new Error(`username ${data.username} já existe`);
    }
    if (await this.findAnyByKeycloakSub(data.keycloakSub)) {
      throw Object.assign(new Error('Unique constraint failed on keycloak_sub'), {
        code: 'P2002',
      });
    }
    const organizationRole = data.organizationRole ?? 'COLLABORATOR';
    if (
      organizationRole === 'OWNER' &&
      (await this.findOwnerByOrganization(data.organizationId))
    ) {
      throw new Error('organização já possui OWNER');
    }

    this.sequence += 1;
    const record: MemberPersistenceRecord = {
      id: data.id ?? `member-${this.sequence}`,
      organizationId: data.organizationId,
      keycloakSub: data.keycloakSub,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      status: 'active',
      organizationRole,
      hasPassword: data.hasPassword,
      provisionalExpiresAt: null,
      disabledAt: null,
      deletedAt: null,
      councilType: null,
      councilNumber: null,
      councilUf: null,
      memberships: data.clinics.map((c) => ({
        clinicId: c.clinicId,
        clinicName: `Clínica ${c.clinicId}`,
        role: c.role,
        permissions: c.permissions,
      })),
    };
    this.items.push(record);
    return record;
  }

  async restore(id: string, data: RestoreMemberData): Promise<MemberRecord> {
    const index = this.items.findIndex((m) => m.id === id);
    if (index < 0) throw new Error(`member ${id} não encontrado`);
    const current = this.items[index];
    const updated: MemberPersistenceRecord = {
      ...current,
      deletedAt: null,
      status: 'active',
      disabledAt: null,
      keycloakSub: data.keycloakSub,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      hasPassword: false,
      memberships: data.clinics.map((c) => ({
        clinicId: c.clinicId,
        clinicName: `Clínica ${c.clinicId}`,
        role: c.role,
        permissions: c.permissions,
      })),
    };
    this.items[index] = updated;
    return updated;
  }

  async update(id: string, data: UpdateMemberData): Promise<MemberRecord> {
    const index = this.items.findIndex((m) => m.id === id);
    if (index < 0) throw new Error(`member ${id} não encontrado`);
    const current = this.items[index];
    const updated: MemberPersistenceRecord = {
      ...current,
      firstName: data.firstName ?? current.firstName,
      lastName: data.lastName ?? current.lastName,
      email: data.email !== undefined ? data.email : current.email,
      memberships:
        data.clinics?.map((c) => ({
          clinicId: c.clinicId,
          clinicName: `Clínica ${c.clinicId}`,
          role: c.role,
          permissions: c.permissions,
        })) ?? current.memberships,
    };
    this.items[index] = updated;
    return updated;
  }

  async setProfessionalCouncilIfEmpty(
    id: string,
    council: ProfessionalCouncilSnapshot,
  ): Promise<MemberRecord> {
    const index = this.items.findIndex((m) => m.id === id);
    if (index < 0) throw new Error(`member ${id} não encontrado`);
    const current = this.items[index];
    if (
      toProfessionalCouncilSnapshot({
        councilType: current.councilType,
        councilNumber: current.councilNumber,
        councilUf: current.councilUf,
      })
    ) {
      return current;
    }
    const updated: MemberPersistenceRecord = {
      ...current,
      councilType: council.councilType,
      councilNumber: council.councilNumber,
      councilUf: council.councilUf,
    };
    this.items[index] = updated;
    return updated;
  }

  async setStatus(id: string, status: 'active' | 'disabled'): Promise<void> {
    const index = this.items.findIndex((m) => m.id === id);
    if (index < 0) return;
    this.items[index] = {
      ...this.items[index],
      status,
      disabledAt: status === 'disabled' ? new Date() : null,
    };
  }

  async softDelete(id: string): Promise<void> {
    const index = this.items.findIndex((m) => m.id === id);
    if (index < 0) return;
    this.items[index] = {
      ...this.items[index],
      deletedAt: new Date(),
      status: 'disabled',
      disabledAt: new Date(),
    };
  }

  async markProvisionalPassword(id: string, expiresAt: Date): Promise<void> {
    const index = this.items.findIndex((m) => m.id === id);
    if (index < 0) return;
    this.items[index] = {
      ...this.items[index],
      hasPassword: false,
      provisionalExpiresAt: expiresAt,
    };
  }

  async markPasswordSet(id: string): Promise<void> {
    const index = this.items.findIndex((m) => m.id === id);
    if (index < 0) return;
    this.items[index] = {
      ...this.items[index],
      hasPassword: true,
      provisionalExpiresAt: null,
    };
  }
}
