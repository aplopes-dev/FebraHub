import { Injectable } from '@nestjs/common';
import type { StorePlatformEventData } from '@citybox/messaging';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  PROVISIONAL_PASSWORD_TTL_MS,
  generateProvisionalPassword,
} from '../../../../../shared/infra/keycloak/provisional-password';
import { IdentityProvider } from '../../../domain/providers/identity-provider.interface';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { EnsurePlatformStoreOwnerUseCase } from '../ensure-platform-store-owner/ensure-platform-store-owner.use-case';

export type ProvisionPlatformStoreInput = {
  event: StorePlatformEventData;
};

export type ProvisionPlatformStoreResult = {
  username: string;
  provisionalPassword: string;
};

/**
 * Provisionamento síncrono da loja (M2M do admin): Organization + Store +
 * OWNER + senha provisória na mesma resposta.
 *
 * Diferente do consumer RabbitMQ (que **não** define senha): aqui o operador
 * espera username + senha no modal de confirmação. No caminho assíncrono a
 * senha vem depois, via `POST …/platform/stores/:id/owner/reset-password`.
 */
@Injectable()
export class ProvisionPlatformStoreUseCase implements IUseCase<
  ProvisionPlatformStoreInput,
  ProvisionPlatformStoreResult
> {
  constructor(
    private readonly ensureOwner: EnsurePlatformStoreOwnerUseCase,
    private readonly members: MemberRepository,
    private readonly identityProvider: IdentityProvider,
  ) {}

  async execute(
    input: ProvisionPlatformStoreInput,
  ): Promise<ProvisionPlatformStoreResult> {
    const { event } = input;
    const owner = await this.ensureOwner.execute({
      storeId: event.storeId,
      tradeName: event.tradeName,
      responsibleName: event.owner?.responsibleName,
      billingEmail: event.owner?.billingEmail,
    });

    const provisionalPassword = generateProvisionalPassword();
    await this.identityProvider.setProvisionalPassword(
      owner.keycloakSub,
      provisionalPassword,
    );
    await this.members.markProvisionalPassword(
      owner.id,
      new Date(Date.now() + PROVISIONAL_PASSWORD_TTL_MS),
    );

    return { username: owner.username, provisionalPassword };
  }
}
