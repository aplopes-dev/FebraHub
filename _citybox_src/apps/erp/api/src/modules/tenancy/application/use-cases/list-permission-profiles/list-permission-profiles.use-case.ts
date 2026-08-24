import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PermissionProfileRepository } from '../../../domain/repositories/permission-profile.repository.interface';
import { resolvePagination } from '../../pagination';
import type {
  ListPermissionProfilesDto,
  ListPermissionProfilesResult,
} from '../../dtos/permission-profile.dto';

@Injectable()
export class ListPermissionProfilesUseCase implements IUseCase<
  ListPermissionProfilesDto,
  ListPermissionProfilesResult
> {
  constructor(
    private readonly permissionProfileRepository: PermissionProfileRepository,
  ) {}

  async execute(
    input: ListPermissionProfilesDto,
  ): Promise<ListPermissionProfilesResult> {
    const filters = {
      search: input.search,
      activeOnly: input.activeOnly ?? true,
    };

    const total = await this.permissionProfileRepository.count(
      input.organizationId,
      filters,
    );
    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.permissionProfileRepository.findAll(
      input.organizationId,
      {
        ...filters,
        page: pagination.page,
        perPage: pagination.perPage,
      },
    );

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
    };
  }
}
