import type { StorePlatformEventData } from '@citybox/messaging';
import { SyncOrganizationFromStoreUseCase } from './sync-organization-from-store.use-case';
import { OrganizationDocumentTakenError } from '../../../domain/errors/organization-document-taken.error';
import { StorePayloadIncompleteError } from '../../../domain/errors/store-payload-incomplete.error';
import {
  makeCnpj,
  makeOrganization,
  makeRepositories,
} from '../../../tests/tenancy-test-factory';

const STORE_ID = '99999999-9999-4999-8999-999999999999';
const STORE_DOCUMENT = makeCnpj(7);

function makeStoreEvent(
  overrides: Partial<StorePlatformEventData> = {},
): StorePlatformEventData {
  return {
    storeId: STORE_ID,
    vertical: 'Comércio',
    tradeName: 'Mercadinho do Pontal',
    slug: 'mercadinho-do-pontal',
    legalName: 'Mercadinho do Pontal Ltda',
    document: STORE_DOCUMENT,
    stateRegistration: '123456789',
    phone: '7332310000',
    timezone: 'America/Bahia',
    address: {
      zipCode: '45650-000',
      street: 'Avenida Soares Lopes',
      number: '250',
      complement: null,
      neighborhood: 'Centro',
      city: 'Ilhéus',
      state: 'BA',
    },
    owner: {
      personType: 'PJ',
      responsibleName: 'Carlos Andrade',
      billingEmail: 'carlos@mercadinhopontal.com.br',
    },
    plan: {
      planId: 'plan-varejo-pro',
      vertical: 'Comércio',
      tier: 'pro',
      maxNegocios: 3,
      maxUsers: 10,
    },
    status: 'PRODUCTION',
    updatedAt: '2026-07-30T12:00:00.000Z',
    ...overrides,
  };
}

describe('SyncOrganizationFromStoreUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new SyncOrganizationFromStoreUseCase(
      repos.organizationRepository,
      repos.branchRepository,
      repos.userRepository,
      repos.identityProvider,
    );
    return { ...repos, useCase };
  }

  describe('provision', () => {
    it('cria organização, matriz e o responsável como OWNER', async () => {
      const {
        useCase,
        branchRepository,
        organizationRepository,
        userRepository,
        identityProvider,
      } = setup();

      const organization = await useCase.provision(makeStoreEvent());

      expect(organization.platformStoreId).toBe(STORE_ID);
      expect(organization.document).toBe(STORE_DOCUMENT);
      expect(organization.email).toBe('carlos@mercadinhopontal.com.br');
      expect(organization.planTier).toBe('pro');
      expect(organization.planMaxBranches).toBe(3);
      expect(organization.planMaxUsers).toBe(10);

      const branches = await branchRepository.findAll(organization.id, {});
      expect(branches).toHaveLength(1);
      expect(branches[0].code).toBe('001');
      expect(branches[0].isHeadquarters).toBe(true);

      // O requisito que dá sentido ao provisionamento: alguém consegue entrar.
      // Uma organização sem OWNER seria reportada como ACTIVE ao admin e
      // continuaria inacessível ao lojista.
      const owner = await userRepository.findByEmail(
        'carlos@mercadinhopontal.com.br',
      );
      expect(owner).not.toBeNull();
      const summaries = await organizationRepository.findAllByUser(owner!.id);
      expect(summaries).toHaveLength(1);
      expect(summaries[0].role).toBe('OWNER');
      expect(summaries[0].organization.id).toBe(organization.id);

      // Nenhuma senha provisória é definida: não há para quem devolvê-la, e
      // sobrescrever a de uma conta preexistente trancaria a pessoa para fora.
      expect(identityProvider.passwords.size).toBe(0);
    });

    it('é idempotente: reentrega do mesmo `store.created` não duplica nada', async () => {
      const {
        useCase,
        organizationRepository,
        branchRepository,
        userRepository,
      } = setup();
      const event = makeStoreEvent();

      const first = await useCase.provision(event);
      const second = await useCase.provision(event);

      expect(second.id).toBe(first.id);
      expect(organizationRepository.organizations.size).toBe(1);
      expect(await branchRepository.count(first.id, {})).toBe(1);
      expect(userRepository.users.size).toBe(1);
    });

    it('provisiona suspensa quando a loja já vem bloqueada', async () => {
      const { useCase } = setup();

      const organization = await useCase.provision(
        makeStoreEvent({ status: 'BLOCKED', reason: 'overdue_invoice' }),
      );

      expect(organization.status).toBe('SUSPENDED');
      expect(organization.suspendedReason).toBe('overdue_invoice');
    });

    it.each([
      ['sem documento', { document: null }, /CNPJ\/CPF/i],
      [
        'sem razão social e sem nome fantasia',
        { legalName: null, tradeName: '' },
        /razão social/i,
      ],
      [
        'sem e-mail de cobrança',
        {
          owner: {
            personType: 'PJ',
            responsibleName: 'Carlos Andrade',
            billingEmail: null,
          },
        },
        /e-mail de cobrança/i,
      ],
      [
        'sem responsável',
        {
          owner: {
            personType: 'PJ',
            responsibleName: null,
            billingEmail: 'carlos@mercadinhopontal.com.br',
          },
        },
        /responsável/i,
      ],
    ])(
      'falha com motivo acionável %s',
      async (_label, overrides, expectedMessage) => {
        // Placeholder inventado ("000000000000") produziria uma empresa que não
        // emite nota; a falha tem de chegar ao admin nomeando o campo.
        const { useCase, organizationRepository } = setup();

        const error = await useCase
          .provision(
            makeStoreEvent(overrides as Partial<StorePlatformEventData>),
          )
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(StorePayloadIncompleteError);
        expect((error as StorePayloadIncompleteError).externalMessage).toMatch(
          expectedMessage,
        );
        expect(organizationRepository.organizations.size).toBe(0);
      },
    );

    it('usa tradeName como legalName quando o evento omite razão social', async () => {
      const { useCase } = setup();

      const organization = await useCase.provision(
        makeStoreEvent({ legalName: null, tradeName: 'Mercadinho Fantasia' }),
      );

      expect(organization.legalName).toBe('Mercadinho Fantasia');
    });

    it('cria a identidade do OWNER no Keycloak sem conceder role nenhuma', async () => {
      const { useCase, identityProvider } = setup();

      await useCase.provision(makeStoreEvent());

      // Com um realm por sistema (ADR C-16), estar no realm já é o gate — não há
      // mais role de vertical nem de staff para atribuir.
      expect(identityProvider.users.size).toBe(1);
    });

    it('recusa a loja quando o CNPJ já é de outra organização do ERP', async () => {
      const { useCase, organizationRepository } = setup();
      await organizationRepository.save(
        makeOrganization({ document: STORE_DOCUMENT }),
      );

      await expect(useCase.provision(makeStoreEvent())).rejects.toBeInstanceOf(
        OrganizationDocumentTakenError,
      );
    });
  });

  describe('update', () => {
    it('descarta evento com carimbo anterior ao já aplicado', async () => {
      // A fila não garante ordem: um `updated` reentregue depois de um mais
      // novo reverteria o cadastro para um estado que a plataforma abandonou.
      const { useCase } = setup();
      await useCase.provision(makeStoreEvent());

      await useCase.update(
        makeStoreEvent({
          tradeName: 'Nome Novo',
          updatedAt: '2026-07-30T13:00:00.000Z',
        }),
      );
      const stale = await useCase.update(
        makeStoreEvent({
          tradeName: 'Nome Antigo',
          updatedAt: '2026-07-30T11:00:00.000Z',
        }),
      );

      expect(stale?.tradeName).toBe('Nome Novo');
      expect(stale?.platformUpdatedAt?.toISOString()).toBe(
        '2026-07-30T13:00:00.000Z',
      );
    });

    it('aplica o cadastro novo e devolve `null` para loja desconhecida', async () => {
      const { useCase } = setup();
      await useCase.provision(makeStoreEvent());

      const updated = await useCase.update(
        makeStoreEvent({
          legalName: 'Mercadinho do Pontal ME',
          updatedAt: '2026-07-30T14:00:00.000Z',
        }),
      );
      expect(updated?.legalName).toBe('Mercadinho do Pontal ME');

      const unknown = await useCase.update(
        makeStoreEvent({ storeId: '12121212-1212-4212-8212-121212121212' }),
      );
      expect(unknown).toBeNull();
    });
  });

  describe('applyPlanChange', () => {
    it('troca só o snapshot de plano, sem mexer no status', async () => {
      const { useCase } = setup();
      const created = await useCase.provision(
        makeStoreEvent({ status: 'BLOCKED', reason: 'overdue_invoice' }),
      );

      await useCase.applyPlanChange(
        makeStoreEvent({
          updatedAt: '2026-07-30T15:00:00.000Z',
          plan: {
            planId: 'plan-varejo-basico',
            vertical: 'Comércio',
            tier: 'basico',
            maxNegocios: 1,
            maxUsers: 3,
          },
        }),
      );

      const after = await useCase.update(
        makeStoreEvent({ updatedAt: '2026-07-30T15:00:00.000Z' }),
      );
      expect(after?.id).toBe(created.id);
      expect(after?.planTier).toBe('basico');
      expect(after?.planMaxBranches).toBe(1);
      // Downgrade não reabre nem fecha a empresa — cobrança e acesso são eixos
      // distintos, e a suspensão veio de `store.suspended`.
      expect(after?.status).toBe('SUSPENDED');
    });
  });

  describe('setSuspended', () => {
    it('suspende com motivo e reativa limpando o motivo', async () => {
      const { useCase, organizationRepository } = setup();
      const created = await useCase.provision(makeStoreEvent());

      await useCase.setSuspended(STORE_ID, true, 'overdue_invoice');
      const suspended = await organizationRepository.findById(created.id);
      expect(suspended?.status).toBe('SUSPENDED');
      expect(suspended?.suspendedReason).toBe('overdue_invoice');

      await useCase.setSuspended(STORE_ID, false);
      const reactivated = await organizationRepository.findById(created.id);
      expect(reactivated?.status).toBe('ACTIVE');
      expect(reactivated?.suspendedReason).toBeNull();
    });

    it('ignora loja que nunca foi provisionada aqui', async () => {
      const { useCase, organizationRepository } = setup();

      await expect(
        useCase.setSuspended(STORE_ID, true, 'overdue_invoice'),
      ).resolves.toBeUndefined();
      expect(organizationRepository.organizations.size).toBe(0);
    });
  });
});
