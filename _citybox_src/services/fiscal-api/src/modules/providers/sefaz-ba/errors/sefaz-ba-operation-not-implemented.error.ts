import { InfrastructureError } from '../../../../shared/core/errors/infrastructure.error';

/// Cancelamento/Carta de Correção/Inutilização (US4) ainda não foram
/// planejados/implementados — nenhum caso de uso hoje chama
/// `SefazBaNfeProvider.cancel()`, então este erro nunca deveria surgir em
/// runtime real; existe só para satisfazer o contrato `FiscalProvider`
/// (Strategy) sem deixar o método com um corpo vazio silencioso.
export class SefazBaOperationNotImplementedError extends InfrastructureError {
  constructor(context: string, operation: string) {
    super({
      internalMessage: `Operação "${operation}" da SEFAZ-BA ainda não foi implementada (planejada para US4)`,
      externalMessage: 'Esta operação ainda não está disponível',
      context,
    });
  }
}
