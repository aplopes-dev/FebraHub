import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UserRepository } from '../../../domain/repositories/user.repository.interface';
import { KeycloakUserProvider } from '../../../domain/keycloak/keycloak-user.provider.interface';
import type {
  PlatformRole,
  User,
  UserProps,
} from '../../../domain/entities/user.entity';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';

export interface UpdateUserDto {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: PlatformRole;
}

@Injectable()
export class UpdateUserUseCase implements IUseCase<UpdateUserDto, User> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly keycloakProvider: KeycloakUserProvider,
  ) {}

  async execute(dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findById(dto.id);
    if (!user) {
      throw new UserNotFoundError(UpdateUserUseCase.name, dto.id);
    }

    await this.keycloakProvider.updateUser(user.keycloakSub, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
    });

    if (dto.role !== undefined && dto.role !== user.role) {
      await this.keycloakProvider.assignRole(user.keycloakSub, dto.role);
      user.props.role = dto.role;
    }
    const displayName = [dto.firstName, dto.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (displayName) {
      user.props.displayName = displayName;
    }
    if (dto.email !== undefined) {
      user.props.email = dto.email;
    }
    user.touch();

    return this.userRepository.save(user);
  }
}
