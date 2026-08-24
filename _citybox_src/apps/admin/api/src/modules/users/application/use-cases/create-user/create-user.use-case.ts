import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { KeycloakUserProvider } from '../../../domain/keycloak/keycloak-user.provider.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserEmailTakenError } from '../../../domain/errors/user-email-taken.error';
import type { CreateUserDto } from './create-user.dto';

@Injectable()
export class CreateUserUseCase implements IUseCase<CreateUserDto, User> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly keycloakProvider: KeycloakUserProvider,
  ) {}

  async execute(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new UserEmailTakenError(CreateUserUseCase.name, dto.email);
    }

    const role = dto.role ?? 'platform_operator';
    const displayName = [dto.firstName, dto.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const { keycloakSub } = await this.keycloakProvider.createUser({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      sendInvite: dto.sendInvite ?? false,
    });

    await this.keycloakProvider.assignRole(keycloakSub, role);

    const user = User.create({
      keycloakSub,
      email: dto.email,
      displayName,
      role,
      photoKey: null,
      photoMimeType: null,
    });

    return this.userRepository.save(user);
  }
}
