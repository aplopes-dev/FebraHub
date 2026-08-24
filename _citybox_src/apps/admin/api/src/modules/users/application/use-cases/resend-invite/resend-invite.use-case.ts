import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { KeycloakUserProvider } from '../../../domain/keycloak/keycloak-user.provider.interface';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';

export interface ResendInviteDto {
  id: string;
}

@Injectable()
export class ResendInviteUseCase implements IUseCase<ResendInviteDto, void> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly keycloakProvider: KeycloakUserProvider,
  ) {}

  async execute(dto: ResendInviteDto): Promise<void> {
    const user = await this.userRepository.findById(dto.id);
    if (!user) throw new UserNotFoundError(ResendInviteUseCase.name, dto.id);
    await this.keycloakProvider.resendInvite(user.keycloakSub);
  }
}
