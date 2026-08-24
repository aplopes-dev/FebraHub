import { Injectable, Logger } from '@nestjs/common';
import type { StorePlatformEventData } from '@citybox/messaging';
import {
  isValidDocument,
  normalizeDocument,
  type PersonTypeValue,
} from '../../../../../shared/core/utils/document';
import {
  Branch,
  type BranchAddress,
} from '../../../domain/entities/branch.entity';
import { Organization } from '../../../domain/entities/organization.entity';
import { User } from '../../../domain/entities/user.entity';
import { IdentityProvider } from '../../../domain/providers/identity-provider.interface';
import { BranchRepository } from '../../../domain/repositories/branch.repository.interface';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { OrganizationDocumentTakenError } from '../../../domain/errors/organization-document-taken.error';
import { StorePayloadIncompleteError } from '../../../domain/errors/store-payload-incomplete.error';

/** Código da matriz. A primeira unidade de qualquer rede começa em "001". */
const HEADQUARTERS_CODE = '001';

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

/** O que a `Store` traz e o cadastro do ERP exige — já normalizado. */
type RequiredStoreFields = {
  personType: PersonTypeValue;
  document: string;
  legalName: string;
  tradeName: string | null;
  email: string;
  responsibleName: string;
};

/**
 * Materializa a `Organization` (e a unidade matriz) de uma loja da plataforma.
 *
 * Quem chama é o `StorePlatformConsumer`; nada aqui roda em requisição HTTP, e
 * por isso nenhum método assume contexto de tenant — o consumidor abre
 * `runWithoutTenantScope` antes de despachar.
 *
 * **Idempotência é requisito, não otimização:** o outbox do `platform-api`
 * entrega at-least-once, então todo método tem de tolerar reexecução com o
 * mesmo evento. A âncora é `Organization.platformStoreId`, único no banco.
 */
@Injectable()
export class SyncOrganizationFromStoreUseCase {
  private readonly logger = new Logger(SyncOrganizationFromStoreUseCase.name);

  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly branchRepository: BranchRepository,
    private readonly userRepository: UserRepository,
    private readonly identityProvider: IdentityProvider,
  ) {}

  /**
   * `store.created` — cria organização, matriz e o vínculo de OWNER.
   *
   * Reentrega encontra a organização pelo `platformStoreId` e cai no caminho de
   * atualização: nunca uma segunda empresa para o mesmo lojista.
   */
  async provision(data: StorePlatformEventData): Promise<Organization> {
    const existing = await this.organizationRepository.findByPlatformStoreId(
      data.storeId,
    );
    if (existing) {
      this.logger.log(
        `Loja ${data.storeId} já provisionada na organização ${existing.id} — aplicando como atualização`,
      );
      return (await this.update(data)) ?? existing;
    }

    const fields = this.requireFields(data);

    // Um CNPJ só pode ser tenant uma vez (`Organization.document` é único
    // global). Checar antes transforma um P2002 opaco num motivo que o operador
    // consegue agir: a empresa já opera no ERP, cadastrada fora do admin.
    const sameDocument = await this.organizationRepository.findByDocument(
      fields.document,
    );
    if (sameDocument) throw new OrganizationDocumentTakenError(fields.document);

    const owner = await this.resolveOwnerUser(fields);

    // `status` acompanha todo evento desde a Fase 2 do PLAT-001: uma loja pode
    // nascer (ou ser reprocessada) já bloqueada, e provisioná-la como ativa
    // daria acesso a quem a plataforma acabou de barrar.
    const blocked = data.status === 'BLOCKED';

    const organization = Organization.create({
      personType: fields.personType,
      document: fields.document,
      legalName: fields.legalName,
      tradeName: fields.tradeName,
      email: fields.email,
      phone: sanitizePhone(data.phone),
      responsibleName: fields.responsibleName,
      responsibleEmail: fields.email,
      status: blocked ? 'SUSPENDED' : 'ACTIVE',
      suspendedReason: blocked ? (data.reason ?? null) : null,
      platformStoreId: data.storeId,
      ...this.toPlanSnapshot(data),
      platformUpdatedAt: new Date(data.updatedAt),
      syncedAt: new Date(),
    });

    const created = await this.organizationRepository.createWithOwner(
      organization,
      owner.id,
    );

    await this.branchRepository.save(
      Branch.create({
        organizationId: created.organization.id,
        code: HEADQUARTERS_CODE,
        personType: fields.personType,
        document: fields.document,
        legalName: fields.legalName,
        tradeName: fields.tradeName,
        stateRegistration: data.stateRegistration ?? null,
        // Matriz de verdade: sem ela o lojista abre o ERP numa empresa sem
        // nenhuma unidade, e nada que dependa de filial funciona.
        isHeadquarters: true,
        ...toBranchAddress(data),
        phone: sanitizePhone(data.phone),
        email: fields.email,
        timezone: data.timezone,
      }),
    );

    this.logger.log(
      `Organização ${created.organization.id} + matriz provisionadas para a loja ${data.storeId}`,
    );
    return created.organization;
  }

  /**
   * `store.updated` — cadastro. Devolve `null` quando a loja nunca foi
   * provisionada aqui: não é erro, é uma loja de vertical que este ERP passou a
   * atender depois, e o `created` correspondente nunca chegou.
   */
  async update(data: StorePlatformEventData): Promise<Organization | null> {
    const organization =
      await this.organizationRepository.findByPlatformStoreId(data.storeId);
    if (!organization) return null;

    const eventAt = new Date(data.updatedAt);
    if (organization.isStalePlatformEvent(eventAt)) {
      this.logger.warn(
        `Evento atrasado da loja ${data.storeId} descartado (origem ${eventAt.toISOString()} < aplicado ${organization.platformUpdatedAt?.toISOString() ?? '?'})`,
      );
      return organization;
    }

    const owner = data.owner;
    return this.organizationRepository.save(
      organization.syncFromPlatform({
        // Campo ausente no evento mantém o que já está gravado: `store.updated`
        // não é um PUT, e um `legalName` que a plataforma não conhece não pode
        // apagar o que o lojista cadastrou aqui.
        legalName: data.legalName?.trim() || organization.legalName,
        tradeName: data.tradeName?.trim() || organization.tradeName,
        email: owner?.billingEmail?.trim() || organization.email,
        phone: sanitizePhone(data.phone) ?? organization.phone,
        responsibleName:
          owner?.responsibleName?.trim() || organization.responsibleName,
        platformUpdatedAt: eventAt,
      }),
    );
  }

  /** `store.plan_changed` — só o snapshot comercial, sem tocar em status. */
  async applyPlanChange(data: StorePlatformEventData): Promise<void> {
    const organization =
      await this.organizationRepository.findByPlatformStoreId(data.storeId);
    if (!organization || !data.plan) return;

    const eventAt = new Date(data.updatedAt);
    if (organization.isStalePlatformEvent(eventAt)) return;

    const saved = await this.organizationRepository.save(
      organization.applyPlanSnapshot(this.toPlanSnapshot(data), eventAt),
    );

    // Downgrade não apaga unidade: o que existe continua operando, e o bloqueio
    // é só para criar a próxima. Apagar filial por troca de plano seria perda
    // de dado disparada por evento de cobrança.
    const limit = saved.planMaxBranches;
    if (limit === null) return;
    const branchCount = await this.branchRepository.count(saved.id, {});
    if (branchCount > limit) {
      this.logger.warn(
        `Organização ${saved.id} acima da quota após troca de plano (${branchCount} unidades > ${limit}). Nada foi removido.`,
      );
    }
  }

  /**
   * `store.suspended` / `store.reactivated`.
   *
   * Sem guarda de ordem de propósito: status é last-write-wins, e uma
   * reativação descartada por chegar com carimbo antigo deixaria o lojista
   * pagando e sem acesso — pior desfecho que aplicar duas vezes.
   */
  async setSuspended(
    storeId: string,
    suspended: boolean,
    reason?: string | null,
  ): Promise<void> {
    const organization =
      await this.organizationRepository.findByPlatformStoreId(storeId);
    if (!organization) return;

    await this.organizationRepository.save(
      suspended
        ? organization.suspend(reason ?? null)
        : organization.reactivate(),
    );
  }

  /** Lookup usado pelo consumidor em `store.updated` para decidir provision vs update. */
  findByPlatformStoreId(storeId: string): Promise<Organization | null> {
    return this.organizationRepository.findByPlatformStoreId(storeId);
  }

  /**
   * A identidade do responsável, criada se ainda não existir.
   *
   * **Não define senha provisória.** O consumidor não tem para quem devolvê-la
   * (o fluxo HTTP devolve em `meta.provisionalPassword`, aqui não há resposta),
   * e sobrescrever a credencial de uma conta preexistente trancaria para fora
   * alguém que já é membro de outra organização. O primeiro acesso sai pelo
   * card do admin (`POST …/owner/reset-password`) ou por
   * `POST /v1/members/:id/reset-password`.
   *
   * Não concede role nenhuma: com um realm por sistema (ADR C-16) estar no
   * realm `citybox-erp` já é o gate de acesso, e o que a pessoa pode fazer vem
   * do `Membership` no banco do ERP.
   */
  private async resolveOwnerUser(fields: RequiredStoreFields): Promise<User> {
    const { firstName, lastName } = splitName(fields.responsibleName);
    const identity = await this.identityProvider.createUser({
      email: fields.email,
      firstName,
      lastName,
    });

    // O `User` é global (a mesma pessoa pode ser OWNER em várias empresas), então
    // o `sub` do Keycloak — e não o e-mail — é a chave de deduplicação.
    const existing = await this.userRepository.findByKeycloakSub(identity.sub);
    if (existing) return existing;

    return this.userRepository.save(
      User.create({
        keycloakSub: identity.sub,
        email: fields.email,
        name: fields.responsibleName,
      }),
    );
  }

  /**
   * Na `Store` quase tudo é opcional; aqui não. Reunir todas as faltas numa
   * mensagem só evita o vaivém de corrigir um campo por reprocessamento.
   */
  private requireFields(data: StorePlatformEventData): RequiredStoreFields {
    const document = normalizeDocument(data.document ?? '');
    const personType = resolvePersonType(data.owner?.personType, document);
    const tradeName = data.tradeName?.trim() || null;
    // Rede de segurança: cadastros PF (e legados) podem omitir legalName no evento.
    const legalName = data.legalName?.trim() || tradeName || '';
    const email = data.owner?.billingEmail?.trim().toLowerCase() ?? '';
    const responsibleName = data.owner?.responsibleName?.trim() ?? '';

    const missing: string[] = [];
    if (!personType || !isValidDocument(personType, document)) {
      missing.push('CNPJ/CPF da loja');
    }
    if (!legalName) missing.push('razão social');
    if (!email) missing.push('e-mail de cobrança');
    if (!responsibleName) missing.push('nome do responsável');

    if (missing.length > 0 || !personType) {
      throw new StorePayloadIncompleteError(data.storeId, missing);
    }

    return {
      personType,
      document,
      legalName,
      tradeName,
      email,
      responsibleName,
    };
  }

  private toPlanSnapshot(data: StorePlatformEventData) {
    return {
      planId: data.plan?.planId ?? null,
      planTier: data.plan?.tier ?? null,
      // `maxNegocios` é o limite de unidades operacionais do plano — na clínica
      // são clínicas, aqui são filiais.
      planMaxBranches: data.plan?.maxNegocios ?? null,
      planMaxUsers: data.plan?.maxUsers ?? null,
    };
  }
}

function resolvePersonType(
  declared: string | null | undefined,
  document: string,
): PersonTypeValue | null {
  if (declared === 'PF' || declared === 'PJ') return declared;
  // Loja antiga pode não ter `personType`; o tamanho do documento é suficiente
  // para escolher, e o dígito verificador reprova depois se estiver errado.
  if (document.length === CPF_LENGTH) return 'PF';
  if (document.length === CNPJ_LENGTH) return 'PJ';
  return null;
}

function splitName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? fullName;
  return { firstName, lastName: parts.slice(1).join(' ') || firstName };
}

/**
 * Endereço é cosmético; o validador da unidade, não. Um CEP com 7 dígitos ou uma
 * UF escrita por extenso reprovariam a matriz inteira e derrubariam o
 * provisionamento por causa de um campo que ninguém precisa no dia 1 — então o
 * que não passa entra como nulo, e o lojista corrige na tela de unidades.
 */
function toBranchAddress(data: StorePlatformEventData): BranchAddress {
  const address = data.address ?? {};
  const zipCode = normalizeDocument(address.zipCode ?? '');
  const state = address.state?.trim().toUpperCase() ?? '';

  return {
    zipCode: zipCode.length === 8 ? zipCode : null,
    street: address.street?.trim() || null,
    number: address.number?.trim() || null,
    complement: address.complement?.trim() || null,
    neighborhood: address.neighborhood?.trim() || null,
    city: address.city?.trim() || null,
    state: /^[A-Z]{2}$/.test(state) ? state : null,
  };
}

/** O validador exige de 8 a 20 caracteres; telefone curto vira nulo. */
function sanitizePhone(phone: string | null | undefined): string | null {
  const value = phone?.trim() ?? '';
  return value.length >= 8 && value.length <= 20 ? value : null;
}
