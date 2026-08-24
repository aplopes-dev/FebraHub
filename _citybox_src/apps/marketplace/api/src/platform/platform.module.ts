import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { createPlatformClient, type PlatformPrisma } from '../database/platform.js';

export const PLATFORM_PRISMA = 'PLATFORM_PRISMA';

@Global()
@Module({
  providers: [
    {
      provide: PLATFORM_PRISMA,
      useFactory: () => createPlatformClient(),
    },
  ],
  exports: [PLATFORM_PRISMA],
})
export class PlatformModule implements OnModuleDestroy {
  constructor() {}

  async onModuleDestroy() {
    // pools closed on process exit
  }
}

export type { PlatformPrisma };