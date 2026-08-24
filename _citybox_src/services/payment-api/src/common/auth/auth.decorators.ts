import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY, REQUIRES_ADMIN_KEY } from './auth.types.js';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const RequiresAdmin = () => SetMetadata(REQUIRES_ADMIN_KEY, true);
