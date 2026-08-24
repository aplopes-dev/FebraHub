import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PermissionProfileRepository } from '../../../domain/repositories/permission-profile.repository.interface';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import { PermissionProfileNotRemovableError } from '../../../domain/errors/permission-profile-not-removable.error';
import { PermissionProfileInUseError } from '../../../domain/errors/permission-profile-in-use.error';
import type { DeletePermissionProfileDto } from '../../dtos/permission-profile.dto';

@Injectable()
export class DeletePermissionProfileUseCase implements IUseCase<
  DeletePermissionProfileDto,
  void
> {
  constructor(
    private readonly permissionProfileRepository: PermissionProfileRepository,
  ) {}

  async execute(input: DeletePermissionProfileDto): Promise<void> {
    const profile = await this.permissionProfileRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!profile || profile.deletedAt) {
      throw new PermissionProfileNotFoundError(input.id);
    }

    if (profile.isSystem) {
      throw new PermissionProfileNotRemovableError(input.id);
    }

    const membershipCount =
      await this.permissionProfileRepository.countMembershipsUsing(
        input.organizationId,
        input.id,
      );
    if (membershipCount > 0) {
      throw new PermissionProfileInUseError(profile.name, membershipCount);
    }

    const deleted = profile.softDelete();
    await this.permissionProfileRepository.softDelete(
      input.organizationId,
      input.id,
      deleted.deletedAt ?? new Date(),
    );
  }
}
