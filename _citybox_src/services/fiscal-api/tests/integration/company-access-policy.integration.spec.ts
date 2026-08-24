import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';
import { StoreMembershipCompanyAccessPolicy } from '../../src/shared/infra/tenant/store-membership-company-access.policy';
import type { AuthenticatedUser } from '../../src/shared/infra/http/auth/authenticated-user';

/// Autorização por participação na loja, contra Postgres real.
///
/// ⚠️ **Esta suíte é o alarme de acoplamento.** A política atravessa a fronteira
/// de schema com consulta crua a `platform.store_members` e `platform.members` —
/// tabelas de que o `admin-api` é dono. Se ele renomear uma coluna, nada quebra
/// em compilação: quebra aqui. Um teste de unidade com dublê não perceberia,
/// porque não existiria consulta para falhar.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

/// O schema `platform` é criado pelas migrations do `admin-api`, e o CityBox o
/// cria **lazily** — num banco de desenvolvimento que nunca rodou o `admin-api`
/// ele simplesmente não existe. Os testes que dependem de participação real são
/// gated; os que verificam recusa **não são**, e é de propósito: são eles que
/// provam o comportamento em ambiente incompleto.
const describeIfPlatformSchema =
  process.env.FISCAL_TEST_PLATFORM_SCHEMA === 'true' ? describe : describe.skip;

/// Mesmo raciocínio, para o schema `erp` (migrations do `erp-api`) — braço novo
/// da policy (spec erp/022, BUG-01 do re-teste 2026-08-14).
const describeIfErpSchema =
  process.env.FISCAL_TEST_ERP_SCHEMA === 'true' ? describe : describe.skip;

describeIfDb('StoreMembershipCompanyAccessPolicy (Postgres real)', () => {
  const prisma = new PrismaService();
  const policy = new StoreMembershipCompanyAccessPolicy(prisma);

  beforeAll(() => prisma.$connect());
  afterAll(() => prisma.$disconnect());

  /// Estes rodam em qualquer ambiente — inclusive num sem o schema `platform`.
  /// São a garantia de que o padrão é **negar**.
  describe('recusa por padrao', () => {
    it('nega quando o sub nao foi resolvido', async () => {
      // `CurrentUser` devolve `sub: 'unknown'` quando não há usuário na request.
      // Liberar aqui reabriria o buraco por outro caminho.
      await expect(
        policy.canActFor(randomUUID(), { sub: 'unknown', roles: [] }),
      ).resolves.toBe(false);
    });

    it('nega quando o sub esta vazio', async () => {
      await expect(
        policy.canActFor(randomUUID(), { sub: '', roles: [] }),
      ).resolves.toBe(false);
    });

    it('nega — em vez de liberar — quando a consulta FALHA', async () => {
      // ⚠️ O teste mais importante do arquivo.
      //
      // Num ambiente sem o schema `platform` (o caso deste banco de
      // desenvolvimento hoje) a consulta lança `42P01: relation does not
      // exist`. Um `catch` que liberasse transformaria "banco incompleto" ou
      // "banco fora do ar" em **bypass de autorização** — a falha mais comum em
      // código de segurança escrito às pressas.
      //
      // Se este teste algum dia falhar porque a consulta passou a funcionar,
      // não é regressão: significa que o `platform` foi migrado. Rode a suíte
      // completa com `FISCAL_TEST_PLATFORM_SCHEMA=true`.
      await expect(
        policy.canActFor(randomUUID(), {
          sub: `sub-${randomUUID()}`,
          roles: [],
        }),
      ).resolves.toBe(false);
    });

    it('libera platform.admin SEM consultar o banco', async () => {
      // Mesmo bypass do `StoreMembershipGuard` do `admin-api`, e o que faz o
      // `AUTH_DEV_BYPASS` continuar funcionando em desenvolvimento — ele injeta
      // exatamente este role. Precede a consulta, então independe do schema
      // `platform` existir.
      //
      // ⚠️ Role **pontuada** (`platform.admin`), o nome canônico pós-ADR C-16.
      // A constante da policy usava o antigo `platform_admin` (underscore) e
      // negava todo admin — regressão corrigida junto deste teste.
      await expect(
        policy.canActFor(randomUUID(), {
          sub: 'dev-admin',
          roles: ['platform.admin'],
        }),
      ).resolves.toBe(true);
    });
  });

  /// Exige `platform` migrado. Rode com:
  /// `FISCAL_TEST_PLATFORM_SCHEMA=true pnpm --filter @citybox/fiscal-api test:integration`
  describeIfPlatformSchema('participacao real na loja', () => {
    const storeId = randomUUID();
    const companyId = randomUUID();
    const memberId = randomUUID();
    const MEMBER_SUB = `sub-${randomUUID()}`;

    const member: AuthenticatedUser = { sub: MEMBER_SUB, roles: [] };
    const outsider: AuthenticatedUser = {
      sub: `sub-${randomUUID()}`,
      roles: [],
    };

    beforeAll(async () => {
      // SQL cru, e não Prisma: o schema `platform` não é da `fiscal-api`, e
      // modelar essas tabelas aqui duplicaria posse (Princípio V).
      await prisma.$executeRawUnsafe(
        `INSERT INTO platform.stores (id, name, slug, vertical, deployment_status, created_at, updated_at)
         VALUES ($1, 'LOJA DE TESTE DE ACESSO', $2, 'Comércio', 'ACTIVE', now(), now())
         ON CONFLICT (id) DO NOTHING`,
        storeId,
        `loja-acesso-${storeId.slice(0, 8)}`,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO platform.members (id, keycloak_sub, name, email, created_at, updated_at)
         VALUES ($1, $2, 'MEMBRO DE TESTE', $3, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        memberId,
        MEMBER_SUB,
        `${MEMBER_SUB}@teste.local`,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO platform.store_members (id, store_id, member_id, role, permissions, created_at, updated_at)
         VALUES ($1, $2, $3, 'owner', '[]'::jsonb, now(), now())
         ON CONFLICT DO NOTHING`,
        randomUUID(),
        storeId,
        memberId,
      );
      await prisma.company.create({
        data: {
          id: companyId,
          storeId,
          cnpj: String(Date.now()).slice(0, 14),
          legalName: 'EMITENTE DE TESTE DE ACESSO',
          taxRegime: 'SIMPLES_NACIONAL',
          cityCodeIbge: '2913606',
          uf: 'BA',
          address: {
            street: 'Rua Teste',
            number: '1',
            complement: null,
            district: 'Centro',
            city: 'Ilheus',
            zipCode: '45650000',
          },
        },
      });
    });

    afterAll(async () => {
      await prisma.company.deleteMany({ where: { id: companyId } });
      await prisma.$executeRawUnsafe(
        `DELETE FROM platform.store_members WHERE store_id = $1`,
        storeId,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM platform.members WHERE id = $1`,
        memberId,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM platform.stores WHERE id = $1`,
        storeId,
      );
    });

    it('libera quem participa da loja do Emitente', async () => {
      await expect(policy.canActFor(companyId, member)).resolves.toBe(true);
    });

    it('NEGA quem tem token valido mas nao participa da loja', async () => {
      // O cenário exato do achado de segurança: um chamador legítimo do CityBox
      // informando no header o UUID de outra empresa. Antes desta política,
      // passava e levava o documento embora.
      await expect(policy.canActFor(companyId, outsider)).resolves.toBe(false);
    });

    it('nega Emitente inexistente', async () => {
      await expect(policy.canActFor(randomUUID(), member)).resolves.toBe(false);
    });
  });

  /// Braço novo da policy (spec erp/022): lojista provisionado pelo **ERP**
  /// (`erp.users`/`erp.memberships`), não pelo admin. Exige `erp` migrado.
  /// Rode com:
  /// `FISCAL_TEST_ERP_SCHEMA=true pnpm --filter @citybox/fiscal-api test:integration`
  describeIfErpSchema('participacao real via erp.memberships', () => {
    const storeId = randomUUID();
    const companyId = randomUUID();
    const organizationId = randomUUID();
    const activeUserId = randomUUID();
    const inactiveUserId = randomUUID();
    const ACTIVE_SUB = `erp-sub-${randomUUID()}`;
    const INACTIVE_MEMBERSHIP_SUB = `erp-sub-inactive-${randomUUID()}`;

    const erpMember: AuthenticatedUser = { sub: ACTIVE_SUB, roles: [] };
    const inactiveMember: AuthenticatedUser = {
      sub: INACTIVE_MEMBERSHIP_SUB,
      roles: [],
    };
    const outsider: AuthenticatedUser = {
      sub: `erp-sub-outsider-${randomUUID()}`,
      roles: [],
    };

    beforeAll(async () => {
      // SQL cru: `organizations`/`memberships`/`users` são do erp-api, não da
      // fiscal-api (Princípio V) — mesmo racional do bloco `platform` acima.
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.organizations
           (id, person_type, document, legal_name, email, responsible_name, status, platform_store_id, created_at, updated_at)
         VALUES ($1, 'PJ', $2, 'EMPRESA DE TESTE DE ACESSO ERP', $3, 'RESPONSAVEL DE TESTE', 'ACTIVE', $4, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        organizationId,
        String(Date.now()).slice(0, 14),
        `org-${organizationId.slice(0, 8)}@teste.local`,
        storeId,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.users (id, keycloak_sub, email, created_at, updated_at)
         VALUES ($1, $2, $3, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        activeUserId,
        ACTIVE_SUB,
        `${ACTIVE_SUB}@teste.local`,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.users (id, keycloak_sub, email, created_at, updated_at)
         VALUES ($1, $2, $3, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        inactiveUserId,
        INACTIVE_MEMBERSHIP_SUB,
        `${INACTIVE_MEMBERSHIP_SUB}@teste.local`,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.memberships (id, organization_id, user_id, role, active, created_at, updated_at)
         VALUES ($1, $2, $3, 'OWNER', TRUE, now(), now())
         ON CONFLICT DO NOTHING`,
        randomUUID(),
        organizationId,
        activeUserId,
      );
      // Vínculo EXISTE mas está INATIVO — prova que a policy respeita `active`.
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.memberships (id, organization_id, user_id, role, active, created_at, updated_at)
         VALUES ($1, $2, $3, 'MEMBER', FALSE, now(), now())
         ON CONFLICT DO NOTHING`,
        randomUUID(),
        organizationId,
        inactiveUserId,
      );
      await prisma.company.create({
        data: {
          id: companyId,
          storeId,
          cnpj: String(Date.now() + 1).slice(0, 14),
          legalName: 'EMITENTE DE TESTE DE ACESSO ERP',
          taxRegime: 'SIMPLES_NACIONAL',
          cityCodeIbge: '2913606',
          uf: 'BA',
          address: {
            street: 'Rua Teste',
            number: '1',
            complement: null,
            district: 'Centro',
            city: 'Ilheus',
            zipCode: '45650000',
          },
        },
      });
    });

    afterAll(async () => {
      await prisma.company.deleteMany({ where: { id: companyId } });
      await prisma.$executeRawUnsafe(
        `DELETE FROM erp.memberships WHERE organization_id = $1`,
        organizationId,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM erp.users WHERE id IN ($1, $2)`,
        activeUserId,
        inactiveUserId,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM erp.organizations WHERE id = $1`,
        organizationId,
      );
    });

    it('libera lojista com vinculo ATIVO em erp.memberships (cenario do BUG-01)', async () => {
      await expect(policy.canActFor(companyId, erpMember)).resolves.toBe(true);
    });

    it('NEGA quem tem vinculo mas esta INATIVO (ms.active = false)', async () => {
      await expect(policy.canActFor(companyId, inactiveMember)).resolves.toBe(
        false,
      );
    });

    it('NEGA quem nao tem vinculo nenhum com a organizacao', async () => {
      await expect(policy.canActFor(companyId, outsider)).resolves.toBe(false);
    });

    it('nega Emitente sem organizacao ERP correspondente (platform_store_id nulo em todas)', async () => {
      // FR-P1-002: fail-closed quando não há ponte `platform_store_id` — não
      // cai de volta no caminho admin nem libera por omissão.
      const orphanCompanyId = randomUUID();
      await prisma.company.create({
        data: {
          id: orphanCompanyId,
          storeId: randomUUID(),
          cnpj: String(Date.now() + 2).slice(0, 14),
          legalName: 'EMITENTE SEM ORGANIZACAO ERP',
          taxRegime: 'SIMPLES_NACIONAL',
          cityCodeIbge: '2913606',
          uf: 'BA',
          address: {
            street: 'Rua Teste',
            number: '1',
            complement: null,
            district: 'Centro',
            city: 'Ilheus',
            zipCode: '45650000',
          },
        },
      });
      try {
        await expect(
          policy.canActFor(orphanCompanyId, erpMember),
        ).resolves.toBe(false);
      } finally {
        await prisma.company.deleteMany({ where: { id: orphanCompanyId } });
      }
    });
  });

  /// Achado do security-reviewer (spec erp/022): `ms.active = TRUE` sozinho
  /// não bastava — organização suspensa/soft-deletada continuava liberando
  /// acesso via `erp.memberships`. Organização própria por teste, pra não
  /// interferir no bloco "participacao real via erp.memberships" acima.
  describeIfErpSchema('organizacao ERP suspensa ou deletada nega acesso', () => {
    const suspendedOrgId = randomUUID();
    const deletedOrgId = randomUUID();
    const suspendedStoreId = randomUUID();
    const deletedStoreId = randomUUID();
    const suspendedCompanyId = randomUUID();
    const deletedCompanyId = randomUUID();
    const suspendedUserId = randomUUID();
    const deletedOrgUserId = randomUUID();
    const SUSPENDED_SUB = `erp-sub-suspended-${randomUUID()}`;
    const DELETED_ORG_SUB = `erp-sub-deleted-org-${randomUUID()}`;

    const suspendedMember: AuthenticatedUser = { sub: SUSPENDED_SUB, roles: [] };
    const deletedOrgMember: AuthenticatedUser = {
      sub: DELETED_ORG_SUB,
      roles: [],
    };

    beforeAll(async () => {
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.organizations
           (id, person_type, document, legal_name, email, responsible_name, status, platform_store_id, created_at, updated_at)
         VALUES ($1, 'PJ', $2, 'EMPRESA SUSPENSA DE TESTE', $3, 'RESPONSAVEL DE TESTE', 'SUSPENDED', $4, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        suspendedOrgId,
        String(Date.now() + 3).slice(0, 14),
        `org-suspensa-${suspendedOrgId.slice(0, 8)}@teste.local`,
        suspendedStoreId,
      );
      // ACTIVE na criação, depois soft-deletada via UPDATE — evita depender de
      // um valor aceito por `deleted_at` no INSERT tipado do enum de status.
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.organizations
           (id, person_type, document, legal_name, email, responsible_name, status, platform_store_id, created_at, updated_at)
         VALUES ($1, 'PJ', $2, 'EMPRESA DELETADA DE TESTE', $3, 'RESPONSAVEL DE TESTE', 'ACTIVE', $4, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        deletedOrgId,
        String(Date.now() + 4).slice(0, 14),
        `org-deletada-${deletedOrgId.slice(0, 8)}@teste.local`,
        deletedStoreId,
      );
      await prisma.$executeRawUnsafe(
        `UPDATE erp.organizations SET deleted_at = now() WHERE id = $1`,
        deletedOrgId,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.users (id, keycloak_sub, email, created_at, updated_at)
         VALUES ($1, $2, $3, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        suspendedUserId,
        SUSPENDED_SUB,
        `${SUSPENDED_SUB}@teste.local`,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.users (id, keycloak_sub, email, created_at, updated_at)
         VALUES ($1, $2, $3, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        deletedOrgUserId,
        DELETED_ORG_SUB,
        `${DELETED_ORG_SUB}@teste.local`,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.memberships (id, organization_id, user_id, role, active, created_at, updated_at)
         VALUES ($1, $2, $3, 'OWNER', TRUE, now(), now())
         ON CONFLICT DO NOTHING`,
        randomUUID(),
        suspendedOrgId,
        suspendedUserId,
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO erp.memberships (id, organization_id, user_id, role, active, created_at, updated_at)
         VALUES ($1, $2, $3, 'OWNER', TRUE, now(), now())
         ON CONFLICT DO NOTHING`,
        randomUUID(),
        deletedOrgId,
        deletedOrgUserId,
      );
      await prisma.company.create({
        data: {
          id: suspendedCompanyId,
          storeId: suspendedStoreId,
          cnpj: String(Date.now() + 5).slice(0, 14),
          legalName: 'EMITENTE DE ORGANIZACAO SUSPENSA',
          taxRegime: 'SIMPLES_NACIONAL',
          cityCodeIbge: '2913606',
          uf: 'BA',
          address: {
            street: 'Rua Teste',
            number: '1',
            complement: null,
            district: 'Centro',
            city: 'Ilheus',
            zipCode: '45650000',
          },
        },
      });
      await prisma.company.create({
        data: {
          id: deletedCompanyId,
          storeId: deletedStoreId,
          cnpj: String(Date.now() + 6).slice(0, 14),
          legalName: 'EMITENTE DE ORGANIZACAO DELETADA',
          taxRegime: 'SIMPLES_NACIONAL',
          cityCodeIbge: '2913606',
          uf: 'BA',
          address: {
            street: 'Rua Teste',
            number: '1',
            complement: null,
            district: 'Centro',
            city: 'Ilheus',
            zipCode: '45650000',
          },
        },
      });
    });

    afterAll(async () => {
      await prisma.company.deleteMany({
        where: { id: { in: [suspendedCompanyId, deletedCompanyId] } },
      });
      await prisma.$executeRawUnsafe(
        `DELETE FROM erp.memberships WHERE organization_id IN ($1, $2)`,
        suspendedOrgId,
        deletedOrgId,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM erp.users WHERE id IN ($1, $2)`,
        suspendedUserId,
        deletedOrgUserId,
      );
      await prisma.$executeRawUnsafe(
        `DELETE FROM erp.organizations WHERE id IN ($1, $2)`,
        suspendedOrgId,
        deletedOrgId,
      );
    });

    it('NEGA vinculo ativo quando a organizacao esta SUSPENDED', async () => {
      await expect(
        policy.canActFor(suspendedCompanyId, suspendedMember),
      ).resolves.toBe(false);
    });

    it('NEGA vinculo ativo quando a organizacao esta soft-deletada (deleted_at)', async () => {
      await expect(
        policy.canActFor(deletedCompanyId, deletedOrgMember),
      ).resolves.toBe(false);
    });
  });
});
