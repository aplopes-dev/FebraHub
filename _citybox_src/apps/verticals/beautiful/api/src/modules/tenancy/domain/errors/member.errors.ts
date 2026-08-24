import { DomainError } from '../../../../shared/core/errors/domain.error';

export class MemberUsernameTakenError extends DomainError {
  constructor(context: string, username: string) {
    super({
      internalMessage: `Username ${username} já existe`,
      externalMessage: 'Já existe um membro com esse usuário.',
      context,
    });
  }
}

export class InvalidStoreRoleError extends DomainError {
  constructor(context: string, role: string) {
    super({
      internalMessage: `Papel ${role} inválido para a loja Beautiful`,
      externalMessage: 'Cargo inválido para a loja.',
      context,
    });
  }
}

export class OrganizationNotFoundError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Organização não encontrada para store ${storeId}`,
      externalMessage: 'Loja não encontrada.',
      context,
    });
  }
}

export class OrganizationSuspendedError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Organização suspensa (store ${storeId})`,
      externalMessage:
        'Organização suspensa. Regularize o pagamento para continuar.',
      context,
    });
  }
}

export class StoreNotFoundError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Store ${storeId} não encontrada`,
      externalMessage: 'Loja não encontrada.',
      context,
    });
  }
}

/** Ausência do membro na loja — nome inclui NotFound p/ HTTP 404 no filter. */
export class MemberNotInStoreNotFoundError extends DomainError {
  constructor(context: string, storeId: string, memberId: string) {
    super({
      internalMessage: `Member ${memberId} não pertence à store ${storeId}`,
      externalMessage: 'Membro não encontrado nesta loja.',
      context,
    });
  }
}

/** Alias pedido pelo contrato operacional. */
export { MemberNotInStoreNotFoundError as MemberNotInStoreError };

export class LinkedServiceNotFoundError extends DomainError {
  constructor(context: string, serviceId: string) {
    super({
      internalMessage: `Service ${serviceId} não encontrado ao vincular ao membro`,
      externalMessage: 'Serviço não encontrado.',
      context,
    });
  }
}

/** O responsável da organização não pode ser desativado nem ter permissões alteradas. */
export class OrganizationOwnerProtectedError extends DomainError {
  constructor(context: string, memberId: string, operation: string) {
    super({
      internalMessage: `Operação ${operation} recusada: member ${memberId} é responsável (organizationRole=OWNER)`,
      externalMessage:
        'Não é possível desativar o responsável nem alterar as permissões dele.',
      context,
    });
  }
}
