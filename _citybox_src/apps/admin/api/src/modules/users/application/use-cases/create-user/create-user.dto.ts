import type { PlatformRole } from '../../../domain/entities/user.entity';

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role?: PlatformRole;
  sendInvite?: boolean;
}
