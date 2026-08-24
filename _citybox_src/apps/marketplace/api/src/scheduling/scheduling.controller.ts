import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import { RequirePermission } from '../common/permissions.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { TenantPrisma } from '../database/tenant.js';
import type { AuthUser } from '../auth/auth.types.js';
import { TenantResolverService } from '../tenancy/tenant-resolver.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { StoreAccessService } from '../users/store-access.service.js';

type SchedulingVertical = 'beauty' | 'clinic' | 'services';

function parseSlotDates(startAt: string, endAt: string): { startAt: Date; endAt: Date } {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new BadRequestException('Datas inválidas');
  }
  if (end <= start) {
    throw new BadRequestException('endAt deve ser posterior a startAt');
  }
  return { startAt: start, endAt: end };
}

@ApiTags('scheduling')
@ApiBearerAuth()
@Controller('v1/scheduling')
export class SchedulingController {
  constructor(
    @InjectService(TenantResolverService) private readonly tenants: TenantResolverService,
    @InjectService(OutboxService) private readonly outbox: OutboxService,
    @InjectService(StoreAccessService) private readonly storeAccess: StoreAccessService,
  ) {}

  @Post('professionals')
  @RequirePermission('store.scheduling.manage')
  async createProfessional(
    @Body() body: { storeId: string; name: string; vertical?: SchedulingVertical },
    @Req() req: Request & { user?: AuthUser },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException('Usuário não autenticado');
    await this.storeAccess.assertUserCanAccessStore(user, body.storeId);

    const { client } = await this.tenants.resolve();
    const vertical = body.vertical ?? 'services';
    if (vertical === 'beauty') {
      return client.beautyProfessional.create({ data: { storeId: body.storeId, name: body.name } });
    }
    if (vertical === 'clinic') {
      return client.clinicProfessional.create({ data: { storeId: body.storeId, name: body.name } });
    }
    return client.servicesProfessional.create({ data: { storeId: body.storeId, name: body.name } });
  }

  @Post('slots/:slotId/book')
  @RequirePermission('store.scheduling.manage')
  async bookSlot(
    @Param('slotId') slotId: string,
    @Body() body: { vertical?: SchedulingVertical; storeId: string },
    @Req() req: Request & { user?: AuthUser },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException('Usuário não autenticado');
    await this.storeAccess.assertUserCanAccessStore(user, body.storeId);

    const { client } = await this.tenants.resolve();
    const vertical = body.vertical ?? 'services';
    const updated = await this.bookSlotAtomic(client, vertical, slotId);
    await this.outbox.enqueue(client, {
      type: 'citybox.availability.changed.v1',
      data: { slotId, booked: true },
    });
    return updated;
  }

  @Post('slots')
  @RequirePermission('store.scheduling.manage')
  async createSlot(
    @Body() body: {
      storeId: string;
      professionalId: string;
      startAt: string;
      endAt: string;
      vertical?: SchedulingVertical;
    },
    @Req() req: Request & { user?: AuthUser },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException('Usuário não autenticado');
    await this.storeAccess.assertUserCanAccessStore(user, body.storeId);

    const { client } = await this.tenants.resolve();
    const vertical = body.vertical ?? 'services';
    const dates = parseSlotDates(body.startAt, body.endAt);
    const data = {
      professionalId: body.professionalId,
      startAt: dates.startAt,
      endAt: dates.endAt,
    };
    if (vertical === 'beauty') {
      return client.beautyScheduleSlot.create({ data });
    }
    if (vertical === 'clinic') {
      return client.clinicScheduleSlot.create({ data });
    }
    return client.servicesScheduleSlot.create({ data });
  }

  private async bookSlotAtomic(client: TenantPrisma, vertical: SchedulingVertical, slotId: string) {
    const count = await this.updateSlotBookedIfFree(client, vertical, slotId);
    if (count === 0) {
      const exists = await this.findSlot(client, vertical, slotId);
      if (!exists) throw new BadRequestException('Slot não encontrado');
      throw new BadRequestException('Conflito de agenda — slot já reservado');
    }
    const updated = await this.findSlot(client, vertical, slotId);
    if (!updated) throw new BadRequestException('Slot não encontrado');
    return updated;
  }

  private updateSlotBookedIfFree(client: TenantPrisma, vertical: SchedulingVertical, slotId: string) {
    if (vertical === 'beauty') {
      return client.beautyScheduleSlot.updateMany({
        where: { id: slotId, booked: false },
        data: { booked: true },
      }).then((r) => r.count);
    }
    if (vertical === 'clinic') {
      return client.clinicScheduleSlot.updateMany({
        where: { id: slotId, booked: false },
        data: { booked: true },
      }).then((r) => r.count);
    }
    return client.servicesScheduleSlot.updateMany({
      where: { id: slotId, booked: false },
      data: { booked: true },
    }).then((r) => r.count);
  }

  private findSlot(client: TenantPrisma, vertical: SchedulingVertical, slotId: string) {
    if (vertical === 'beauty') {
      return client.beautyScheduleSlot.findUnique({ where: { id: slotId } });
    }
    if (vertical === 'clinic') {
      return client.clinicScheduleSlot.findUnique({ where: { id: slotId } });
    }
    return client.servicesScheduleSlot.findUnique({ where: { id: slotId } });
  }
}
