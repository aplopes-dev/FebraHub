import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  CurrentClinicScope,
} from '../../../../../../shared/infra/http/decorators/clinic-scope.decorator';
import type { ClinicScope } from '../../../../../../shared/infra/http/guards/clinic-scope.guard';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CreateAppointmentUseCase } from '../../../application/use-cases/create-appointment/create-appointment.use-case';
import { UpdateAppointmentUseCase } from '../../../application/use-cases/update-appointment/update-appointment.use-case';
import { UpdateAppointmentStatusUseCase } from '../../../application/use-cases/update-appointment-status/update-appointment-status.use-case';
import {
  DeleteAppointmentUseCase,
  GetAppointmentUseCase,
} from '../../../application/use-cases/get-appointment/get-appointment.use-case';
import {
  GetAppointmentCalendarUseCase,
  ListAppointmentsUseCase,
} from '../../../application/use-cases/list-appointments/list-appointments.use-case';
import {
  assertCanReadScheduleProfessional,
  assertCanWriteAppointmentProfessional,
  buildScheduleAbility,
  resolveScheduleProfessionalFilter,
} from '../../../../shared/infra/schedule-permission.helpers';
import {
  CalendarQueryDto,
  CreateAppointmentBodyDto,
  ListAppointmentsQueryDto,
  parseProfessionalIds,
  UpdateAppointmentBodyDto,
  UpdateAppointmentStatusBodyDto,
} from './shared/appointment.http-dto';

function abilityFor(
  scope: ClinicScope,
  user: PermissionUser,
) {
  return buildScheduleAbility({
    userId: scope.memberId,
    permissions: scope.permissions,
    isOrganizationOwner: user.isOrganizationOwner === true,
  });
}

@ApiTags('appointments')
@Controller('v1/appointments')
@RequirePermission('access', 'Schedule')
export class ListAppointmentsRoute {
  constructor(private readonly listAppointments: ListAppointmentsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos (paginado)' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListAppointmentsQueryDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const ability = abilityFor(scope, user);
    const professionalIds = resolveScheduleProfessionalFilter(
      ability,
      scope.memberId,
      parseProfessionalIds(query.professionalIds),
    );
    const result = await this.listAppointments.execute({
      storeId,
      ...query,
      professionalIds,
    });
    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}

@ApiTags('appointments')
@Controller('v1/appointments')
@RequirePermission('access', 'Schedule')
export class GetAppointmentCalendarRoute {
  constructor(private readonly getCalendar: GetAppointmentCalendarUseCase) {}

  @Get('calendar')
  @ApiOperation({ summary: 'Calendário de agendamentos e compromissos' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: CalendarQueryDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const ability = abilityFor(scope, user);
    const professionalIds = resolveScheduleProfessionalFilter(
      ability,
      scope.memberId,
      parseProfessionalIds(query.professionalIds),
    );
    return this.getCalendar.execute({
      storeId,
      startDate: query.startDate,
      endDate: query.endDate,
      professionalIds,
    });
  }
}

@ApiTags('appointments')
@Controller('v1/appointments')
@RequirePermission('access', 'Schedule')
export class GetAppointmentRoute {
  constructor(private readonly getAppointment: GetAppointmentUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do agendamento' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const data = await this.getAppointment.execute({ storeId, id });
    assertCanReadScheduleProfessional(
      abilityFor(scope, user),
      scope.memberId,
      data.professionalId,
    );
    return { data };
  }
}

@ApiTags('appointments')
@Controller('v1/appointments')
@RequirePermission('access', 'Schedule')
export class CreateAppointmentRoute {
  constructor(private readonly createAppointment: CreateAppointmentUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Criar agendamento' })
  async handle(
    @StoreId() storeId: string,
    @Body() body: CreateAppointmentBodyDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    assertCanWriteAppointmentProfessional(
      abilityFor(scope, user),
      scope.memberId,
      body.professionalId,
    );
    const data = await this.createAppointment.execute({
      storeId,
      input: body,
    });
    return { data };
  }
}

@ApiTags('appointments')
@Controller('v1/appointments')
@RequirePermission('access', 'Schedule')
export class UpdateAppointmentRoute {
  constructor(
    private readonly getAppointment: GetAppointmentUseCase,
    private readonly updateAppointment: UpdateAppointmentUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() body: UpdateAppointmentBodyDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const ability = abilityFor(scope, user);
    const existing = await this.getAppointment.execute({ storeId, id });
    assertCanWriteAppointmentProfessional(
      ability,
      scope.memberId,
      existing.professionalId,
    );
    if (body.professionalId) {
      assertCanWriteAppointmentProfessional(
        ability,
        scope.memberId,
        body.professionalId,
      );
    }
    const data = await this.updateAppointment.execute({
      storeId,
      id,
      input: body,
    });
    return { data };
  }
}

@ApiTags('appointments')
@Controller('v1/appointments')
@RequirePermission('access', 'Schedule')
export class UpdateAppointmentStatusRoute {
  constructor(
    private readonly getAppointment: GetAppointmentUseCase,
    private readonly updateStatus: UpdateAppointmentStatusUseCase,
  ) {}

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() body: UpdateAppointmentStatusBodyDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const existing = await this.getAppointment.execute({ storeId, id });
    assertCanWriteAppointmentProfessional(
      abilityFor(scope, user),
      scope.memberId,
      existing.professionalId,
    );
    const data = await this.updateStatus.execute({
      storeId,
      id,
      status: body.status,
      confirmationSource: body.confirmationSource,
    });
    return { data };
  }
}

@ApiTags('appointments')
@Controller('v1/appointments')
@RequirePermission('delete', 'Schedule')
export class DeleteAppointmentRoute {
  constructor(private readonly deleteAppointment: DeleteAppointmentUseCase) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir agendamento' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteAppointment.execute({ storeId, id });
  }
}
