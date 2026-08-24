import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * Grupo fiscal referenciado (spec erp/022, D3) — bloqueia a exclusão em vez de
 * deixar produto/padrão apontando para um grupo que sumiu da tela.
 */
export class FiscalGroupInUseError extends DomainError {
  constructor(name: string, reason: 'products' | 'default', count?: number) {
    const externalMessage =
      reason === 'products'
        ? `O grupo "${name}" está vinculado a ${count} produto(s) e não pode ser excluído. Desvincule os produtos primeiro.`
        : `O grupo "${name}" é o padrão fiscal da organização e não pode ser excluído. Escolha outro padrão em Padrões fiscais primeiro.`;
    super({
      internalMessage: `FiscalGroup "${name}" is in use (${reason}${count !== undefined ? `, count=${count}` : ''})`,
      externalMessage,
      context: FiscalGroupInUseError.name,
    });
  }
}
