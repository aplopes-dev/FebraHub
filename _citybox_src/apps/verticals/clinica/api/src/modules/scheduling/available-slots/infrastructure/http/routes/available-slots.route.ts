import { Controller, Get, Query } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CurrentClinicScope } from '../../../../../../shared/infra/http/decorators/clinic-scope.decorator';
import type { ClinicScope } from '../../../../../../shared/infra/http/guards/clinic-scope.guard';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { GetAvailableSlotsUseCase } from '../../../application/use-cases/get-available-slots/get-available-slots.use-case';
import { buildScheduleAbility } from '../../../../shared/infra/schedule-permission.helpers';
import { GetAvailableSlotsQueryDto } from './shared/available-slots.http-dto';

@ApiTags('available-slots')
@Controller('v1/available-slots')
@RequirePermission('access', 'Schedule')
export class GetAvailableSlotsRoute {
  constructor(private readonly getAvailableSlots: GetAvailableSlotsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Horários disponíveis do profissional' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: GetAvailableSlotsQueryDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const ability = buildScheduleAbility({
      userId: scope.memberId,
      permissions: scope.permissions,
      isOrganizationOwner: user.isOrganizationOwner === true,
    });
    if (
      query.professionalId !== scope.memberId &&
      !ability.can('read', 'Schedule') &&
      !ability.can('update', 'Schedule') &&
      !ability.can('create', 'Schedule')
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para ver horários de outros profissionais',
      );
    }
    const data = await this.getAvailableSlots.execute({
      storeId,
      professionalId: query.professionalId,
      date: query.date,
      durationMin: query.durationMin,
    });
    return { data };
  }
}
