import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PermissionProfile } from '../../../domain/entities/permission-profile.entity';
import { PermissionProfileRepository } from '../../../domain/repositories/permission-profile.repository.interface';
import { PermissionProfileNameTakenError } from '../../../domain/errors/permission-profile-name-taken.error';
import { MAX_PER_PAGE } from '../../pagination';
import type { CreatePermissionProfileDto } from '../../dtos/permission-profile.dto';

@Injectable()
export class CreatePermissionProfileUseCase implements IUseCase<
  CreatePermissionProfileDto,
  PermissionProfile
> {
  constructor(
    private readonly permissionProfileRepository: PermissionProfileRepository,
  ) {}

  async execute(input: CreatePermissionProfileDto): Promise<PermissionProfile> {
    const name = input.name.trim();
    await this.assertNameAvailable(input.organizationId, name);

    // `PermissionProfile.create` valida os ids contra o catálogo canônico.
    const profile = PermissionProfile.create({
      organizationId: input.organizationId,
      name,
      description: input.description ?? '',
      isSystem: false,
      systemKey: null,
      permissionIds: input.permissionIds,
    });

    return this.permissionProfileRepository.save(profile);
  }

  private async assertNameAvailable(
    organizationId: string,
    name: string,
  ): Promise<void> {
    const active = await this.permissionProfileRepository.findAll(
      organizationId,
      { activeOnly: true, page: 1, perPage: MAX_PER_PAGE },
    );
    const taken = active.some(
      (profile) => profile.name.toLowerCase() === name.toLowerCase(),
    );
    if (taken) throw new PermissionProfileNameTakenError(name);
  }
}
