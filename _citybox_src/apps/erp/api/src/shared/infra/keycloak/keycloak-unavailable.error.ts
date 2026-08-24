import { InfrastructureError } from '../../core/errors/infrastructure.error';

/**
 * Falha ao falar com o Keycloak (config ausente, timeout, resposta de erro).
 *
 * O sufixo `Unavailable` faz o `AppExceptionFilter` responder 503 — é falha de
 * dependência externa, não erro do cliente.
 */
export class KeycloakUnavailableError extends InfrastructureError {
  constructor(internalMessage: string, externalMessage: string) {
    super({
      internalMessage,
      externalMessage,
      context: KeycloakUnavailableError.name,
    });
  }
}
