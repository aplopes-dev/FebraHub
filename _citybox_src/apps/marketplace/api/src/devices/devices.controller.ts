import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createHash, randomBytes } from 'node:crypto';
import type { PlatformPrisma } from '../database/platform.js';
import { PLATFORM_PRISMA } from '../platform/platform.module.js';

@ApiTags('devices')
@ApiBearerAuth()
@Controller('v1/devices')
export class DevicesController {
  constructor(@InjectService(PLATFORM_PRISMA) private readonly platform: PlatformPrisma) {}

  @Post('stores/:storeId/register')
  async register(@Param('storeId') storeId: string, @Body() body: { label: string }) {
    const raw = randomBytes(24).toString('hex');
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const cred = await this.platform.deviceCredential.create({
      data: { storeId, label: body.label ?? 'device', tokenHash },
    });
    return { id: cred.id, token: `device:${raw}`, storeId };
  }

  @Post('push/register')
  async registerPush(@Body() body: { token: string; platform: string; storeId?: string; userId?: string }) {
    return this.platform.pushDeviceToken.upsert({
      where: { token: body.token },
      create: {
        token: body.token,
        platform: body.platform,
        storeId: body.storeId,
        userId: body.userId,
      },
      update: { platform: body.platform, storeId: body.storeId, userId: body.userId },
    });
  }
}