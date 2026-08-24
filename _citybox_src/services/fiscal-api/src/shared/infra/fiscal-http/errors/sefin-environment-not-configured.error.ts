import { InfrastructureError } from '../../../core/errors/infrastructure.error';

/// Mapeia para 424 via `AppExceptionFilter` (nome contém "NotConfigured").
///
/// Emitir em produção é decisão de negócio, não de configuração: o documento
/// gerado tem valor legal e cria obrigação tributária. Sem
/// `SEFIN_NACIONAL_PRODUCTION_ENDPOINT` definido explicitamente, a tentativa
/// é recusada aqui — antes de assinar, antes de numerar, antes de qualquer
/// contato com o órgão fiscal.
export class SefinEnvironmentNotConfiguredError extends InfrastructureError {
  constructor(context: string, environment: string) {
    super({
      internalMessage: `Ambiente "${environment}" do Sistema Nacional NFS-e não configurado — defina o endpoint correspondente antes de transmitir`,
      externalMessage:
        'Ambiente de emissão não habilitado para este serviço fiscal.',
      context,
    });
  }
}
