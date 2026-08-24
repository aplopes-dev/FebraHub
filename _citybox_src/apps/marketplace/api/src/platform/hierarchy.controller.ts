import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { PlatformPrisma } from '../database/platform.js';
import { InjectService } from '../common/inject.js';
import { RequirePermission } from '../common/permissions.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PLATFORM_PRISMA } from './platform.module.js';

class CreateNetworkDto {
  organizationName!: string;
  storeNames!: string[];
}

@ApiTags('hierarchy')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1/hierarchy')
export class HierarchyController {
  constructor(@InjectService(PLATFORM_PRISMA) private readonly platform: PlatformPrisma) {}

  @Post('network')
  @RequirePermission('platform.admin')
  async createNetwork(@Body() body: CreateNetworkDto) {
    const org = await this.platform.organization.create({
      data: {
        name: body.organizationName,
        stores: {
          create: body.storeNames.map((name, i) => ({
            name,
            slug: `${name.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}-${i + 1}-${Date.now().toString(36)}`,
          })),
        },
      },
      include: { stores: true },
    });
    return org;
  }

  @Get('stores')
  async listStores() {
    const stores = await this.platform.store.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, vertical: true },
    });
    return { stores };
  }
}
