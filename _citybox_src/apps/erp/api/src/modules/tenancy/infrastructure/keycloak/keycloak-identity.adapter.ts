import { Injectable } from '@nestjs/common';
import { KeycloakAdminService } from '../../../../shared/infra/keycloak/keycloak-admin.service';
import {
  IdentityProvider,
  type CreateIdentityInput,
  type IdentityUser,
} from '../../domain/providers/identity-provider.interface';

/**
 * Liga a porta `IdentityProvider` ao Keycloak.
 *
 * O adapter existe para que os use cases não conheçam realm, token nem Admin
 * API — trocar o provedor de identidade não deveria tocar em regra de negócio.
 */
@Injectable()
export class KeycloakIdentityAdapter extends IdentityProvider {
  constructor(private readonly keycloak: KeycloakAdminService) {
    super();
  }

  async findByEmail(email: string): Promise<IdentityUser | null> {
    const user = await this.keycloak.findUserByEmail(email);
    if (!user) return null;
    return { sub: user.sub, email: user.email, username: user.username };
  }

  createUser(
    input: CreateIdentityInput,
  ): Promise<{ sub: string; created: boolean }> {
    return this.keycloak.createUser({
      // O e-mail é o username: o login do ERP é por e-mail, e dois campos
      // divergentes só criariam ambiguidade no primeiro acesso.
      username: input.email,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
    });
  }

  setProvisionalPassword(sub: string, password: string): Promise<void> {
    return this.keycloak.setProvisionalPassword(sub, password);
  }

  setEnabled(sub: string, enabled: boolean): Promise<void> {
    return this.keycloak.setUserEnabled(sub, enabled);
  }

  deleteUser(sub: string): Promise<void> {
    return this.keycloak.deleteUser(sub);
  }
}
