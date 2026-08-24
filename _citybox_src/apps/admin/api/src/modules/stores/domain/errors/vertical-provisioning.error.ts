import { InfrastructureError } from '../../../../shared/core/errors/infrastructure.error';

/**
 * Falha ao falar com a vertical. Propaga a mensagem dela para a tela do admin — quota
 * estourada e e-mail duplicado são erros de negócio que o operador precisa ler.
 */
export class VerticalProvisioningError extends InfrastructureError {
  constructor(
    context: string,
    readonly vertical: string,
    externalMessage: string,
    readonly status?: number,
  ) {
    super({
      internalMessage: `Provisionamento na vertical ${vertical} falhou (${status ?? 'sem status'}): ${externalMessage}`,
      externalMessage,
      context,
    });
  }
}

/**
 * A loja não tem responsável provisionado na vertical.
 *
 * Acontece quando o evento `store.created` chegou sem `owner.responsibleName` — a
 * vertical registra o aviso e segue sem responsável em vez de recusar a loja inteira.
 * A saída é cadastrar a pessoa pela tela de equipe.
 */
export class VerticalOwnerNotFoundError extends InfrastructureError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Loja ${storeId} não tem membro com organizationRole=OWNER na vertical`,
      externalMessage:
        'Esta loja ainda não tem um responsável cadastrado. Cadastre o responsável na equipe antes de gerar credenciais.',
      context,
    });
  }
}

export class VerticalNotSupportedError extends InfrastructureError {
  constructor(context: string, vertical: string) {
    super({
      internalMessage: `Vertical ${vertical} não expõe API de membros`,
      externalMessage: `A vertical ${vertical} ainda gerencia equipe pelo cadastro da plataforma.`,
      context,
    });
  }
}
