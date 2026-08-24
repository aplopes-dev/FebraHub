import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PermissionProfile } from '../../../domain/entities/permission-profile.entity';
import { PermissionProfileRepository } from '../../../domain/repositories/permission-profile.repository.interface';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import { PermissionProfileNotRemovableError } from '../../../domain/errors/permission-profile-not-removable.error';
import { PermissionProfileNameTakenError } from '../../../domain/errors/permission-profile-name-taken.error';
import { MAX_PER_PAGE } from '../../pagination';
import type { UpdatePermissionProfileDto } from '../../dtos/permission-profile.dto';

@Injectable()
export class UpdatePermissionProfileUseCase implements IUseCase<
  UpdatePermissionProfileDto,
  PermissionProfile
> {
  constructor(
    private readonly permissionProfileRepository: PermissionProfileRepository,
  ) {}

  async execute(input: UpdatePermissionProfileDto): Promise<PermissionProfile> {
    const profile = await this.permissionProfileRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!profile || profile.deletedAt) {
      throw new PermissionProfileNotFoundError(input.id);
    }

    // Perfis de sistema são imutáveis — qualquer edição estrutural é recusada.
    if (profile.isSystem) {
      throw new PermissionProfileNotRemovableError(input.id);
    }

    const name = input.name.trim();
    await this.assertNameAvailable(input.organizationId, name, profile.id);

    return this.permissionProfileRepository.save(
      profile.update({
        name,
        description: input.description,
        permissionIds: input.permissionIds,
      }),
    );
  }

  private async assertNameAvailable(
    organizationId: string,
    name: string,
    excludeId: string,
  ): Promise<void> {
    const active = await this.permissionProfileRepository.findAll(
      organizationId,
      { activeOnly: true, page: 1, perPage: MAX_PER_PAGE },
    );
    const taken = active.some(
      (profile) =>
        profile.id !== excludeId &&
        profile.name.toLowerCase() === name.toLowerCase(),
    );
    if (taken) throw new PermissionProfileNameTakenError(name);
  }
}
