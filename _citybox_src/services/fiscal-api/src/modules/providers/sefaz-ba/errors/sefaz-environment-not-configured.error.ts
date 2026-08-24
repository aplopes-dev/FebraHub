import { InfrastructureError } from '../../../../shared/core/errors/infrastructure.error';

/// Mapeia para 424 via AppExceptionFilter (nome contém "NotConfigured") — v1
/// só habilita o endpoint de homologação por padrão (Assumptions do
/// spec.md); produção exige configurar `SEFAZ_BA_NFE_PRODUCTION_ENDPOINT`
/// explicitamente.
export class SefazEnvironmentNotConfiguredError extends InfrastructureError {
  constructor(context: string, environment: string) {
    super({
      internalMessage: `Endpoint da SEFAZ-BA não configurado para o ambiente "${environment}"`,
      externalMessage: `Ambiente "${environment}" não está configurado para emissão fiscal`,
      context,
    });
  }
}
