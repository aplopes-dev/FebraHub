import {
  VerticalMemberProvisioning,
  type CreateVerticalMemberInput,
  type CreateVerticalMemberResult,
  type ProvisionVerticalStoreInput,
  type ProvisionVerticalStoreResult,
  type ResetVerticalOwnerPasswordResult,
  type VerticalMember,
  type VerticalUnit,
} from '../domain/providers/vertical-member-provisioning.provider';
import {
  VerticalNotSupportedError,
  VerticalProvisioningError,
} from '../domain/errors/vertical-provisioning.error';

type FakeOptions = {
  /** Verticais que "expõem API de membros" neste teste. Vazio = nenhuma. */
  supportedVerticals?: string[];
  members?: VerticalMember[];
  units?: VerticalUnit[];
};

/**
 * Dublê do port da vertical para testes de use case e rota.
 *
 * Existe para não depender de HTTP nem de `CLINICA_API_URL` no ambiente de teste: o que
 * importa aqui é o contrato (quem suporta, o que devolve), não o transporte.
 */
export class FakeVerticalMemberProvisioning extends VerticalMemberProvisioning {
  readonly findOwnerCalls: Array<{ storeId: string; vertical: string }> = [];
  readonly provisionCalls: ProvisionVerticalStoreInput[] = [];
  failProvision = false;

  constructor(private readonly options: FakeOptions = {}) {
    super();
  }

  isSupported(vertical: string): boolean {
    return (this.options.supportedVerticals ?? []).includes(vertical);
  }

  private assertSupported(vertical: string): void {
    if (!this.isSupported(vertical)) {
      throw new VerticalNotSupportedError(
        FakeVerticalMemberProvisioning.name,
        vertical,
      );
    }
  }

  listUnits(_storeId: string, vertical: string): Promise<VerticalUnit[]> {
    this.assertSupported(vertical);
    return Promise.resolve(this.options.units ?? []);
  }

  /** Espelha o adapter real: quem resolve o OWNER é a vertical, pelo `organizationRole`. */
  findOwner(storeId: string, vertical: string): Promise<VerticalMember | null> {
    this.assertSupported(vertical);
    this.findOwnerCalls.push({ storeId, vertical });
    const owner = (this.options.members ?? []).find(
      (member) => member.organizationRole === 'OWNER',
    );
    return Promise.resolve(owner ?? null);
  }

  createMember(
    input: CreateVerticalMemberInput,
  ): Promise<CreateVerticalMemberResult> {
    this.assertSupported(input.vertical);
    return Promise.resolve({
      memberId: 'fake-member-id',
      username: input.username,
      provisionalPassword: 'fake-password',
    });
  }

  resetOwnerPassword(
    _storeId: string,
    vertical: string,
  ): Promise<ResetVerticalOwnerPasswordResult> {
    this.assertSupported(vertical);
    return Promise.resolve({
      memberId: 'fake-owner-id',
      username: 'fake.owner',
      provisionalPassword: 'fake-password',
    });
  }

  provisionStore(
    input: ProvisionVerticalStoreInput,
  ): Promise<ProvisionVerticalStoreResult> {
    this.assertSupported(input.vertical);
    this.provisionCalls.push(input);
    if (this.failProvision) {
      throw new VerticalProvisioningError(
        FakeVerticalMemberProvisioning.name,
        input.vertical,
        `A vertical ${input.vertical} recusou a operação.`,
        503,
      );
    }
    const event = input.event as {
      owner?: { billingEmail?: string | null };
    };
    return Promise.resolve({
      username: event.owner?.billingEmail ?? 'owner@example.com',
      provisionalPassword: 'fake-provision-password',
    });
  }
}

/** Membro da vertical com todos os campos do contrato; sobrescreva só o que o teste exige. */
export function buildVerticalMember(
  overrides: Partial<VerticalMember> = {},
): VerticalMember {
  return {
    id: 'member-1',
    username: 'nascimento',
    firstName: 'Ana',
    lastName: 'Nascimento',
    email: 'ana@clinica.test',
    status: 'active',
    organizationRole: 'COLLABORATOR',
    organizationRoleLabel: 'Colaborador',
    isOrganizationOwner: false,
    hasPassword: true,
    provisionalExpiresAt: null,
    disabledAt: null,
    clinics: [],
    ...overrides,
  };
}
