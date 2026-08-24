import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PermissionProfile } from '../../../domain/entities/permission-profile.entity';
import { PermissionProfileRepository } from '../../../domain/repositories/permission-profile.repository.interface';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import { PermissionProfileNameTakenError } from '../../../domain/errors/permission-profile-name-taken.error';
import { MAX_PER_PAGE } from '../../pagination';
import type { RestorePermissionProfileDto } from '../../dtos/permission-profile.dto';

@Injectable()
export class RestorePermissionProfileUseCase implements IUseCase<
  RestorePermissionProfileDto,
  PermissionProfile
> {
  constructor(
    private readonly permissionProfileRepository: PermissionProfileRepository,
  ) {}

  async execute(
    input: RestorePermissionProfileDto,
  ): Promise<PermissionProfile> {
    const profile = await this.permissionProfileRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!profile) throw new PermissionProfileNotFoundError(input.id);

    // Idempotente: já ativo devolve como está.
    if (!profile.deletedAt) return profile;

    await this.assertNameAvailable(
      input.organizationId,
      profile.name,
      profile.id,
    );

    return this.permissionProfileRepository.save(profile.restore());
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
