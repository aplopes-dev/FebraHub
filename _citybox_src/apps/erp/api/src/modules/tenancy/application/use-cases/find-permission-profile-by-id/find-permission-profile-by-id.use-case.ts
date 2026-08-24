import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PermissionProfile } from '../../../domain/entities/permission-profile.entity';
import { PermissionProfileRepository } from '../../../domain/repositories/permission-profile.repository.interface';
import { PermissionProfileNotFoundError } from '../../../domain/errors/permission-profile-not-found.error';
import type { FindPermissionProfileByIdDto } from '../../dtos/permission-profile.dto';

@Injectable()
export class FindPermissionProfileByIdUseCase implements IUseCase<
  FindPermissionProfileByIdDto,
  PermissionProfile
> {
  constructor(
    private readonly permissionProfileRepository: PermissionProfileRepository,
  ) {}

  async execute(
    input: FindPermissionProfileByIdDto,
  ): Promise<PermissionProfile> {
    const profile = await this.permissionProfileRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!profile) throw new PermissionProfileNotFoundError(input.id);
    return profile;
  }
}
