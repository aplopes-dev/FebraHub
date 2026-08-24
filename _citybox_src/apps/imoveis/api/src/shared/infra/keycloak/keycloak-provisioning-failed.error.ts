import { InfrastructureError } from '../../core/errors/infrastructure.error';

/**
 * Falha ao falar com o Keycloak (config ausente, timeout, resposta de erro).
 *
 * É `InfrastructureError` — o `AppExceptionFilter` responde 503, porque é falha
 * de dependência externa, não erro do cliente. Equivale ao
 * `KeycloakUnavailableError` do ERP.
 *
 * Vive em `shared/infra/keycloak/` (e não mais em `settings/domain/errors/`)
 * porque quem o lança é o adapter de identidade: erro de infra do Keycloak
 * dentro de um `domain/` invertia a camada.
 */
export class KeycloakProvisioningFailedError extends InfrastructureError {
  constructor(context: string, cause: string) {
    super({
      internalMessage: cause,
      externalMessage:
        'Não foi possível criar o acesso de login. Verifique KEYCLOAK_PROVISIONING_CLIENT_ID/SECRET e se o Keycloak está no ar.',
      context,
    });
  }
}
