import { DomainError } from '../../../../shared/core/errors/domain.error';

export class MemberNotFoundError extends DomainError {
  constructor(context: string, id: string) {
    super({
      internalMessage: `Member ${id} não encontrado`,
      externalMessage: 'Membro não encontrado',
      context,
    });
  }
}

export class MemberQuotaExceededError extends DomainError {
  constructor(context: string, current: number, max: number) {
    super({
      internalMessage: `Quota de usuários excedida: ${current}/${max}`,
      externalMessage: `Seu plano permite ${max} usuário(s). Faça upgrade para adicionar outro.`,
      context,
    });
  }
}

/**
 * `Member.email` não é `@unique` no banco — membro pode nascer sem e-mail, e um unique
 * parcial só para isso não se justificava. A duplicidade é barrada aqui, no caminho de
 * edição, que é o único lugar onde o operador informa e-mail de alguém que já existe.
 */
export class MemberEmailTakenError extends DomainError {
  constructor(context: string, email: string) {
    super({
      internalMessage: `E-mail ${email} já pertence a outro membro`,
      externalMessage: 'Já existe um membro com esse e-mail.',
      context,
    });
  }
}

export class MemberUsernameTakenError extends DomainError {
  constructor(context: string, username: string) {
    super({
      internalMessage: `Username ${username} já existe`,
      externalMessage: 'Já existe um membro com esse usuário.',
      context,
    });
  }
}

/**
 * Identidade Keycloak (`keycloak_sub`) já ligada a um `Member` — vivo, soft-deleted
 * em outra org, ou colisão que o create puro não consegue traduzir.
 *
 * Sem este erro o Prisma devolve P2002 e o FE mostra 500 genérico. Mensagem externa
 * orienta o operador a reusar a equipe / outro e-mail em vez de "tente de novo".
 */
export class MemberIdentityTakenError extends DomainError {
  constructor(context: string, reason: string, externalMessage: string) {
    super({
      internalMessage: reason,
      externalMessage,
      context,
    });
  }
}

/**
 * Barreira contra deixar a organização sem ninguém com acesso total.
 *
 * O responsável é a pessoa que o operador da plataforma cadastrou; sem ela, ninguém
 * consegue readmitir membros nem recuperar a conta pela própria tela de equipe. Um
 * gerente qualquer poderia remover o dono hoje — daí a recusa explícita.
 */
export class OrganizationOwnerProtectedError extends DomainError {
  constructor(context: string, memberId: string, operation: string) {
    super({
      internalMessage: `Operação ${operation} recusada: member ${memberId} é o OWNER da organização`,
      externalMessage:
        'O responsável pela organização não pode ser removido nem desativado. Transfira a responsabilidade antes.',
      context,
    });
  }
}

/**
 * Invariante "no máximo um responsável por organização" quebrada.
 *
 * Também é o erro em que o índice único parcial `members_one_owner_per_organization` é
 * traduzido — o banco é a última linha de defesa quando duas entregas do mesmo evento
 * passam juntas pela checagem em memória.
 */
export class OrganizationAlreadyHasOwnerError extends DomainError {
  constructor(context: string, organizationId: string) {
    super({
      internalMessage: `Organização ${organizationId} já possui um OWNER`,
      externalMessage:
        'Esta organização já tem um responsável. Transfira a responsabilidade em vez de criar outro.',
      context,
    });
  }
}

export class InvalidClinicRoleError extends DomainError {
  constructor(context: string, role: string) {
    super({
      internalMessage: `Papel ${role} não pertence ao catálogo da clínica`,
      externalMessage: 'Cargo inválido para a clínica.',
      context,
    });
  }
}
