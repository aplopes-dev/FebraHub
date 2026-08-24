import { Module } from '@nestjs/common';
import { KeycloakProvisioningService } from '../../shared/infra/keycloak/keycloak-provisioning.service';
import { IdentityProvider } from './domain/providers/identity-provider.interface';
import { KeycloakIdentityAdapter } from './infrastructure/keycloak/keycloak-identity.adapter';

/**
 * Identidade da vertical Imóveis (ADR C-16 / C-17).
 *
 * Único lugar do app que sabe que o provedor de identidade é o Keycloak. Os
 * módulos `settings` e `store-setup` recebem apenas a porta `IdentityProvider`.
 */
@Module({
  providers: [
    {
      provide: KeycloakProvisioningService,
      useFactory: () => {
        const isProd = process.env.NODE_ENV === 'production';
        // Dev: defaults batem com o import do realm `citybox-imoveis`
        // (`<clientId>-dev-secret`). Prod: exige envs — string vazia reprova
        // em `isConfigured()` e a falha vira 503, não acesso silencioso.
        return new KeycloakProvisioningService({
          issuer:
            process.env.KEYCLOAK_ISSUER ??
            'http://127.0.0.1:8080/realms/citybox-imoveis',
          clientId:
            process.env.KEYCLOAK_PROVISIONING_CLIENT_ID ??
            (isProd ? '' : 'imoveis-provisioning'),
          clientSecret:
            process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET ??
            (isProd ? '' : 'imoveis-provisioning-dev-secret'),
        });
      },
    },
    { provide: IdentityProvider, useClass: KeycloakIdentityAdapter },
  ],
  exports: [IdentityProvider],
})
export class TenancyModule {}
