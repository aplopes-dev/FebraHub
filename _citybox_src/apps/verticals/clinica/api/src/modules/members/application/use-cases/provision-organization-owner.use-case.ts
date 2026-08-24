import { Injectable, Logger } from '@nestjs/common';
import { KeycloakProvisioningService } from '../../../../shared/infra/keycloak/keycloak-provisioning.service';
import { permissionsForRole } from '../../domain/clinic-role.catalog';
import { OrganizationAlreadyHasOwnerError } from '../../domain/errors/member.errors';
import {
  buildDedicatedOwnerKeycloakEmail,
  buildOwnerUsernameBase,
  resolveAvailableUsername,
  splitResponsibleName,
} from '../../domain/owner-identity';
import {
  MemberRepository,
  type MemberRecord,
} from '../../domain/repositories/member.repository';

export type ProvisionOrganizationOwnerInput = {
  storeId: string;
  organizationId: string;
  /** Clínica raiz da organização — o vínculo inicial do responsável. */
  rootClinicId: string;
  /** `owner.responsibleName` do evento do platform. Opcional no contrato. */
  responsibleName: string | null;
  /** `owner.billingEmail` do evento. `Member.email` é nullable e o Keycloak aceita. */
  billingEmail: string | null;
};

export type ProvisionOrganizationOwnerResult =
  | { status: 'created'; member: MemberRecord }
  | { status: 'already_provisioned'; member: MemberRecord }
  | { status: 'skipped_without_responsible' };

/**
 * Papel clínico do responsável na clínica raiz.
 *
 * `dentista_admin` = todos os checkboxes (`STORE_PERMISSION_IDS` via
 * `permissionsForRole`). Continua sendo um papel **clínico**: se depois o responsável
 * virar só dentista numa clínica, isso muda aqui sem afetar o papel de organização.
 * OWNER da organização ainda tem bypass `manage all` na API, ortogonal a este cargo.
 */
const OWNER_CLINIC_ROLE = 'dentista_admin';

/**
 * Provisiona o **responsável pela organização** a partir dos dados do evento
 * `citybox.store.created.v1`.
 *
 * Substitui o antigo "membro de demonstração" (`gerente.{storeId}`, "Gerente
 * Demonstração", sem e-mail): aquele era um placeholder que nunca correspondia a
 * ninguém, então o cliente saía do cadastro sem nenhum acesso real.
 *
 * ## Idempotência
 *
 * A entrega dos eventos é **at-least-once**, e o retry de setup (`POST
 * /v1/store-setup/:id/retry`) reexecuta o mesmo caminho. Reprocessar não pode criar um
 * segundo responsável nem estourar o `@unique` de username, por isso:
 *   1. existe responsável vivo → retorna sem tocar em nada;
 *   2. o username é derivado deterministicamente (mesmo evento ⇒ mesmo nome);
 *   3. se a corrida escapar das duas, o índice único parcial do banco recusa a gravação
 *      e a falha vira `OrganizationAlreadyHasOwnerError`.
 */
@Injectable()
export class ProvisionOrganizationOwnerUseCase {
  private readonly logger = new Logger(ProvisionOrganizationOwnerUseCase.name);

  constructor(
    private readonly members: MemberRepository,
    private readonly keycloak: KeycloakProvisioningService,
  ) {}

  async execute(
    input: ProvisionOrganizationOwnerInput,
  ): Promise<ProvisionOrganizationOwnerResult> {
    // A checagem de idempotência vem ANTES da do nome de propósito: o retry manual
    // reconstrói o evento a partir do espelho cadastral, que não guarda `owner`. Checar o
    // nome primeiro faria todo retry de loja já provisionada registrar um warn de "sem
    // responsável" que não corresponde à realidade.
    const existingOwner = await this.members.findOwnerByOrganization(
      input.organizationId,
    );
    if (existingOwner) {
      return { status: 'already_provisioned', member: existingOwner };
    }

    const name = splitResponsibleName(input.responsibleName);
    if (!name) {
      // Não derruba o provisionamento: `owner.responsibleName` é opcional no contrato e
      // bloquear a loja inteira por um campo opcional seria pior do que ficar sem o
      // responsável — a equipe ainda pode ser criada pela tela do admin.
      this.logger.warn(
        `Loja ${input.storeId} provisionada SEM responsável: o evento não trouxe owner.responsibleName. ` +
          'Cadastre o responsável pela tela de equipe ou reenvie o evento com o nome preenchido.',
      );
      return { status: 'skipped_without_responsible' };
    }

    const username = await this.resolveUsername(input, name);

    // Keycloak primeiro, pelo mesmo motivo do `CreateMemberUseCase`: a identidade no
    // realm e o `Member` local precisam nascer juntos. Se a gravação abaixo falhar, sobra um
    // usuário sem Member — estado detectável e corrigido no próximo retry, que reaproveita
    // o mesmo `sub` porque o username é determinístico.
    //
    // `Member.keycloak_sub` é único **global** no schema clinica: o mesmo usuário Keycloak
    // não pode ser OWNER de duas organizações. Se o e-mail de cobrança já vincula um
    // Member noutra loja, o provisionMember reaproveitaria o sub e o INSERT estouraria —
    // nesse caso criamos identidade Keycloak dedicada (e-mail +clinic{store}).
    const provisioned = await this.provisionKeycloakSub(input, name, username);

    if (provisioned.existingMember) {
      return {
        status: 'already_provisioned',
        member: provisioned.existingMember,
      };
    }

    try {
      const member = await this.members.create({
        organizationId: input.organizationId,
        keycloakSub: provisioned.keycloakSub,
        username: provisioned.username,
        email: input.billingEmail,
        firstName: name.firstName,
        lastName: name.lastName,
        organizationRole: 'OWNER',
        // Sem senha: o Keycloak de dev não tem SMTP, então não há convite por e-mail.
        // O admin gera a senha sob demanda e a exibe uma única vez.
        hasPassword: false,
        clinics: [
          {
            clinicId: input.rootClinicId,
            role: OWNER_CLINIC_ROLE,
            permissions: permissionsForRole(OWNER_CLINIC_ROLE),
          },
        ],
      });

      this.logger.log(
        `Responsável ${provisioned.username} provisionado para a organização ${input.organizationId}`,
      );
      return { status: 'created', member };
    } catch (err: unknown) {
      // Traduz a recusa do índice único parcial sem acoplar o use case ao código de erro
      // do ORM: se agora existe um responsável, a corrida foi essa.
      const raced = await this.members.findOwnerByOrganization(
        input.organizationId,
      );
      if (raced) {
        throw new OrganizationAlreadyHasOwnerError(
          ProvisionOrganizationOwnerUseCase.name,
          input.organizationId,
        );
      }
      throw err;
    }
  }

  /**
   * Obtém um `keycloakSub` ainda livre em `clinica.members` para esta organização.
   */
  private async provisionKeycloakSub(
    input: ProvisionOrganizationOwnerInput,
    name: { firstName: string; lastName: string },
    username: string,
  ): Promise<
    | { keycloakSub: string; username: string; existingMember?: undefined }
    | { existingMember: MemberRecord; keycloakSub?: undefined; username?: undefined }
  > {
    const emailOwnedElsewhere = input.billingEmail
      ? await this.members.findByEmail(input.billingEmail)
      : null;
    const needsDedicatedIdentity =
      emailOwnedElsewhere != null &&
      emailOwnedElsewhere.organizationId !== input.organizationId;

    if (needsDedicatedIdentity) {
      this.logger.warn(
        `E-mail ${input.billingEmail} já é Member noutra organização — Keycloak dedicado para store ${input.storeId}`,
      );
    }

    let activeUsername = username;
    let keycloakEmail = needsDedicatedIdentity
      ? buildDedicatedOwnerKeycloakEmail(input.billingEmail, input.storeId)
      : input.billingEmail;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const provisioned = await this.keycloak.provisionMember({
        username: activeUsername,
        firstName: name.firstName,
        lastName: name.lastName,
        email: keycloakEmail,
      });

      const bySub = await this.members.findByKeycloakSub(
        provisioned.keycloakSub,
      );
      if (!bySub) {
        return { keycloakSub: provisioned.keycloakSub, username: activeUsername };
      }
      if (bySub.organizationId === input.organizationId) {
        return { existingMember: bySub };
      }

      // Sub reaproveitado de outra org (ex.: 409 por e-mail sem o findByEmail local).
      this.logger.warn(
        `keycloak_sub ${provisioned.keycloakSub} já vinculado a outra org — nova identidade Keycloak`,
      );
      keycloakEmail = buildDedicatedOwnerKeycloakEmail(
        input.billingEmail,
        input.storeId,
      );
      activeUsername = await this.resolveUsername(input, name);
    }

    throw new Error(
      `Não foi possível obter keycloak_sub livre para o responsável da store ${input.storeId}`,
    );
  }

  /**
   * Username livre a partir do e-mail (ou do nome), com sufixo numérico determinístico.
   *
   * O probe olha os **dois** lados da unicidade: `Member.username` é `@unique` global no
   * schema `clinica` e o username do Keycloak é único no realm `citybox-clinica`. Um
   * usuário que já existe no realm por outra organização da clínica não é reaproveitado
   * de propósito — reusar identidade entre tenants é pior do que um sufixo numérico.
   */
  private async resolveUsername(
    input: ProvisionOrganizationOwnerInput,
    name: { firstName: string; lastName: string },
  ): Promise<string> {
    const base = buildOwnerUsernameBase({
      email: input.billingEmail,
      name,
      storeId: input.storeId,
    });

    return resolveAvailableUsername(base, async (candidate) => {
      if (await this.members.findByUsername(candidate)) return true;
      return Boolean(await this.keycloak.findUserByUsernameOrEmail(candidate));
    });
  }
}
