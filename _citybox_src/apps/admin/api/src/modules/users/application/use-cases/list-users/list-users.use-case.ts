import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { UserRepository } from '../../../domain/repositories/user.repository.interface';
import type { PlatformRole, User } from '../../../domain/entities/user.entity';

const VALID_ROLES: PlatformRole[] = ['platform_admin', 'platform_operator'];

export interface ListUsersDto {
  page?: number;
  perPage?: number;
  search?: string;
  roles?: string[];
}

export interface ListUsersResult {
  users: User[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

@Injectable()
export class ListUsersUseCase implements IUseCase<
  ListUsersDto,
  ListUsersResult
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    page = 1,
    perPage = 20,
    search,
    roles,
  }: ListUsersDto): Promise<ListUsersResult> {
    const skip = (page - 1) * perPage;
    const normalizedRoles = this.normalizeRoles(roles);
    const criteria = {
      skip,
      take: perPage,
      search: search?.trim() || undefined,
      roles: normalizedRoles,
    };

    const [users, total] = await Promise.all([
      this.userRepository.findAll(criteria),
      this.userRepository.count(criteria),
    ]);

    return {
      users,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  private normalizeRoles(roles?: string[]): PlatformRole[] | undefined {
    if (!roles?.length) return undefined;
    const valid = roles.filter((role): role is PlatformRole =>
      VALID_ROLES.includes(role as PlatformRole),
    );
    return valid.length ? valid : undefined;
  }
}
