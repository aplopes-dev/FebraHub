import { Injectable } from '@nestjs/common';
import { KeycloakProvisioningService } from '../../../../shared/infra/keycloak/keycloak-provisioning.service';
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
  constructor(private readonly keycloak: KeycloakProvisioningService) {
    super();
  }

  async findByEmail(email: string): Promise<IdentityUser | null> {
    const user = await this.keycloak.findByEmail(email);
    if (!user) return null;
    return { sub: user.id, email: user.email, username: user.username };
  }

  async createUser(
    input: CreateIdentityInput,
  ): Promise<{ sub: string; created: boolean }> {
    const provisioned = await this.keycloak.provisionMember({
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
    });
    return { sub: provisioned.keycloakSub, created: !provisioned.reused };
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
