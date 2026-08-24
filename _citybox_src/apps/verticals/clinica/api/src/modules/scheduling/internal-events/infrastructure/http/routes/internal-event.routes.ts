import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CurrentClinicScope } from '../../../../../../shared/infra/http/decorators/clinic-scope.decorator';
import type { ClinicScope } from '../../../../../../shared/infra/http/guards/clinic-scope.guard';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CreateInternalEventUseCase } from '../../../application/use-cases/create-internal-event/create-internal-event.use-case';
import { UpdateInternalEventUseCase } from '../../../application/use-cases/update-internal-event/update-internal-event.use-case';
import {
  DeleteInternalEventUseCase,
  GetInternalEventUseCase,
} from '../../../application/use-cases/get-internal-event/get-internal-event.use-case';
import { ListInternalEventsUseCase } from '../../../application/use-cases/list-internal-events/list-internal-events.use-case';
import {
  assertCanReadScheduleProfessional,
  assertCanWriteCommitmentProfessional,
  buildScheduleAbility,
  resolveScheduleProfessionalFilter,
} from '../../../../shared/infra/schedule-permission.helpers';
import {
  InternalEventBodyDto,
  ListInternalEventsQueryDto,
  parseProfessionalIds,
} from './shared/internal-event.http-dto';

function abilityFor(scope: ClinicScope, user: PermissionUser) {
  return buildScheduleAbility({
    userId: scope.memberId,
    permissions: scope.permissions,
    isOrganizationOwner: user.isOrganizationOwner === true,
  });
}

@ApiTags('internal-events')
@Controller('v1/internal-events')
@RequirePermission('access', 'Schedule')
export class ListInternalEventsRoute {
  constructor(private readonly listEvents: ListInternalEventsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar compromissos internos' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListInternalEventsQueryDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const professionalIds = resolveScheduleProfessionalFilter(
      abilityFor(scope, user),
      scope.memberId,
      parseProfessionalIds(query.professionalIds),
    );
    const data = await this.listEvents.execute({
      storeId,
      ...query,
      professionalIds,
    });
    return { data };
  }
}

@ApiTags('internal-events')
@Controller('v1/internal-events')
@RequirePermission('access', 'Schedule')
export class GetInternalEventRoute {
  constructor(private readonly getEvent: GetInternalEventUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do compromisso interno' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const data = await this.getEvent.execute({ storeId, id });
    assertCanReadScheduleProfessional(
      abilityFor(scope, user),
      scope.memberId,
      data.professionalId,
    );
    return { data };
  }
}

@ApiTags('internal-events')
@Controller('v1/internal-events')
@RequirePermission('access', 'Schedule')
export class CreateInternalEventRoute {
  constructor(private readonly createEvent: CreateInternalEventUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Criar compromisso interno' })
  async handle(
    @StoreId() storeId: string,
    @Body() body: InternalEventBodyDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    assertCanWriteCommitmentProfessional(
      abilityFor(scope, user),
      scope.memberId,
      body.professionalId,
    );
    const data = await this.createEvent.execute({ storeId, input: body });
    return { data };
  }
}

@ApiTags('internal-events')
@Controller('v1/internal-events')
@RequirePermission('access', 'Schedule')
export class UpdateInternalEventRoute {
  constructor(
    private readonly getEvent: GetInternalEventUseCase,
    private readonly updateEvent: UpdateInternalEventUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar compromisso interno' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() body: InternalEventBodyDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const ability = abilityFor(scope, user);
    const existing = await this.getEvent.execute({ storeId, id });
    assertCanWriteCommitmentProfessional(
      ability,
      scope.memberId,
      existing.professionalId,
    );
    assertCanWriteCommitmentProfessional(
      ability,
      scope.memberId,
      body.professionalId,
    );
    const data = await this.updateEvent.execute({ storeId, id, input: body });
    return { data };
  }
}

@ApiTags('internal-events')
@Controller('v1/internal-events')
@RequirePermission('delete', 'Schedule')
export class DeleteInternalEventRoute {
  constructor(private readonly deleteEvent: DeleteInternalEventUseCase) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir compromisso interno' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteEvent.execute({ storeId, id });
  }
}
