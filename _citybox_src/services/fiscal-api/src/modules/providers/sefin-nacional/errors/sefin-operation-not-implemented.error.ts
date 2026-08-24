import { InfrastructureError } from '../../../../shared/core/errors/infrastructure.error';

/// Mapeia para 501 via `AppExceptionFilter` (nome contém "NotImplemented").
///
/// Operação prevista no padrão nacional mas ainda não construída — distinto de
/// "não se aplica" (carta de correção e inutilização, que não existem para
/// NFS-e). A separação importa: 501 aqui significa "vai existir", e o operador
/// não deve tratar como erro de preenchimento.
export class SefinOperationNotImplementedError extends InfrastructureError {
  constructor(context: string, operation: string) {
    super({
      internalMessage: `Operação "${operation}" do Sistema Nacional NFS-e ainda não implementada`,
      externalMessage:
        'Esta operação fiscal ainda não está disponível para NFS-e.',
      context,
    });
  }
}
