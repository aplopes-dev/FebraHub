import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CurrentClinicScope } from '../../../../../../shared/infra/http/decorators/clinic-scope.decorator';
import type { ClinicScope } from '../../../../../../shared/infra/http/guards/clinic-scope.guard';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CreateReturnAlertUseCase } from '../../../application/use-cases/create-return-alert/create-return-alert.use-case';
import { ListReturnAlertsUseCase } from '../../../application/use-cases/list-return-alerts/list-return-alerts.use-case';
import { DeleteReturnAlertUseCase } from '../../../application/use-cases/delete-return-alert/delete-return-alert.use-case';
import {
  assertCanWriteAppointmentProfessional,
  buildScheduleAbility,
} from '../../../../shared/infra/schedule-permission.helpers';
import {
  CreateReturnAlertBodyDto,
  ListReturnAlertsQueryDto,
} from './shared/return-alert.http-dto';

function abilityFor(scope: ClinicScope, user: PermissionUser) {
  return buildScheduleAbility({
    userId: scope.memberId,
    permissions: scope.permissions,
    isOrganizationOwner: user.isOrganizationOwner === true,
  });
}

@ApiTags('return-alerts')
@Controller('v1/return-alerts')
@RequirePermission('access', 'Schedule')
export class ListReturnAlertsRoute {
  constructor(private readonly listAlerts: ListReturnAlertsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar alertas de retorno' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListReturnAlertsQueryDto,
  ) {
    const result = await this.listAlerts.execute({ storeId, ...query });
    return {
      alerts: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}

@ApiTags('return-alerts')
@Controller('v1/return-alerts')
@RequirePermission('access', 'Schedule')
export class CreateReturnAlertRoute {
  constructor(private readonly createAlert: CreateReturnAlertUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Criar alerta de retorno manual' })
  async handle(
    @StoreId() storeId: string,
    @Body() body: CreateReturnAlertBodyDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    assertCanWriteAppointmentProfessional(
      abilityFor(scope, user),
      scope.memberId,
      body.professionalId,
    );
    const data = await this.createAlert.execute({ storeId, input: body });
    return { id: data.id };
  }
}

@ApiTags('return-alerts')
@Controller('v1/return-alerts')
@RequirePermission('delete', 'Schedule')
export class DeleteReturnAlertRoute {
  constructor(private readonly deleteAlert: DeleteReturnAlertUseCase) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir alerta de retorno' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteAlert.execute({ storeId, id });
  }
}
