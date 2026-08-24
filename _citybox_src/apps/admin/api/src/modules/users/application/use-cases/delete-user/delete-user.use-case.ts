import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { KeycloakUserProvider } from '../../../domain/keycloak/keycloak-user.provider.interface';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';

export interface DeleteUserDto {
  id: string;
}

@Injectable()
export class DeleteUserUseCase implements IUseCase<DeleteUserDto, void> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly keycloakProvider: KeycloakUserProvider,
  ) {}

  async execute({ id }: DeleteUserDto): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(DeleteUserUseCase.name, id);
    }

    await this.keycloakProvider.deleteUser(user.keycloakSub);
    await this.userRepository.delete(id);
  }
}
