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
import { CreateFitInUseCase } from '../../../application/use-cases/create-fit-in/create-fit-in.use-case';
import { UpdateFitInUseCase } from '../../../application/use-cases/update-fit-in/update-fit-in.use-case';
import {
  DeleteFitInUseCase,
  GetFitInUseCase,
} from '../../../application/use-cases/get-fit-in/get-fit-in.use-case';
import { ListFitInsUseCase } from '../../../application/use-cases/list-fit-ins/list-fit-ins.use-case';
import { CheckPatientFitInsUseCase } from '../../../application/use-cases/check-patient-fit-ins/check-patient-fit-ins.use-case';
import {
  assertCanWriteAnyScheduleProfessional,
  assertCanWriteAppointmentProfessional,
  buildScheduleAbility,
} from '../../../../shared/infra/schedule-permission.helpers';
import {
  FitInBodyDto,
  ListFitInsQueryDto,
  UpdateFitInBodyDto,
} from './shared/fit-in.http-dto';

function abilityFor(scope: ClinicScope, user: PermissionUser) {
  return buildScheduleAbility({
    userId: scope.memberId,
    permissions: scope.permissions,
    isOrganizationOwner: user.isOrganizationOwner === true,
  });
}

@ApiTags('fit-ins')
@Controller('v1/fit-ins')
@RequirePermission('access', 'Schedule')
export class ListFitInsRoute {
  constructor(private readonly listFitIns: ListFitInsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar encaixes' })
  async handle(@StoreId() storeId: string, @Query() query: ListFitInsQueryDto) {
    const fitIns = await this.listFitIns.execute({ storeId, ...query });
    return { fitIns };
  }
}

@ApiTags('fit-ins')
@Controller('v1/fit-ins')
@RequirePermission('access', 'Schedule')
export class CheckPatientFitInsRoute {
  constructor(private readonly checkPatient: CheckPatientFitInsUseCase) {}

  @Get('check-patient/:patientId')
  @ApiOperation({ summary: 'Verificar encaixes pendentes do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
  ) {
    return this.checkPatient.execute({ storeId, patientId });
  }
}

@ApiTags('fit-ins')
@Controller('v1/fit-ins')
@RequirePermission('access', 'Schedule')
export class GetFitInRoute {
  constructor(private readonly getFitIn: GetFitInUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do encaixe' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const data = await this.getFitIn.execute({ storeId, id });
    return { data };
  }
}

@ApiTags('fit-ins')
@Controller('v1/fit-ins')
@RequirePermission('access', 'Schedule')
export class CreateFitInRoute {
  constructor(private readonly createFitIn: CreateFitInUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Criar encaixe' })
  async handle(
    @StoreId() storeId: string,
    @Body() body: FitInBodyDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const ability = abilityFor(scope, user);
    if (body.professionalId) {
      assertCanWriteAppointmentProfessional(
        ability,
        scope.memberId,
        body.professionalId,
      );
    } else {
      assertCanWriteAnyScheduleProfessional(ability, scope.memberId, []);
    }
    const data = await this.createFitIn.execute({ storeId, input: body });
    return { id: data.id };
  }
}

@ApiTags('fit-ins')
@Controller('v1/fit-ins')
@RequirePermission('access', 'Schedule')
export class UpdateFitInRoute {
  constructor(private readonly updateFitIn: UpdateFitInUseCase) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar encaixe' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() body: UpdateFitInBodyDto,
    @CurrentClinicScope() scope: ClinicScope,
    @CurrentUser() user: PermissionUser,
  ) {
    const ability = abilityFor(scope, user);
    if (body.professionalId) {
      assertCanWriteAppointmentProfessional(
        ability,
        scope.memberId,
        body.professionalId,
      );
    } else {
      assertCanWriteAnyScheduleProfessional(ability, scope.memberId, []);
    }
    const data = await this.updateFitIn.execute({ storeId, id, input: body });
    return { id: data.id };
  }
}

@ApiTags('fit-ins')
@Controller('v1/fit-ins')
@RequirePermission('delete', 'Schedule')
export class DeleteFitInRoute {
  constructor(private readonly deleteFitIn: DeleteFitInUseCase) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir encaixe' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteFitIn.execute({ storeId, id });
  }
}
