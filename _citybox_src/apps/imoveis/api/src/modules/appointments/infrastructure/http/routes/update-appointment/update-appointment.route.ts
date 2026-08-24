import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { isStoreWideViewer } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { UpdateAppointmentUseCase } from '../../../../application/use-cases/update-appointment/update-appointment.use-case';
import { UpdateAppointmentDto } from './update-appointment.dto';
import { UpdateAppointmentPresenter } from './update-appointment.presenter';

/**
 * Corretor → sempre o próprio scope.
 * Admin/dono → honora agentId do body (não reatribui compromisso de colega).
 */
function resolveAppointmentAgentId(
  user: PermissionUser,
  scope: ImoveisScope | undefined,
  requestedAgentId?: string | null,
): string | undefined {
  const scopeAgent = scope?.agentId?.trim() || undefined;
  if (!isStoreWideViewer(user, scope)) {
    return scopeAgent;
  }
  return requestedAgentId?.trim() || scopeAgent;
}

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('v1/appointments')
export class UpdateAppointmentRoute {
  constructor(private readonly updateAppointment: UpdateAppointmentUseCase) {}

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Calendar')
  @ApiOperation({ summary: 'Atualizar compromisso' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    const agentId = resolveAppointmentAgentId(user, scope, dto.agentId);
    if (!agentId) {
      throw new ValidatorDomainError({
        internalMessage: 'Missing agentId on update appointment',
        externalMessage:
          'Não foi possível identificar o corretor responsável pelo compromisso.',
        context: UpdateAppointmentRoute.name,
      });
    }
    const appointment = await this.updateAppointment.execute({
      storeId,
      id,
      ...dto,
      agentId,
    });
    return UpdateAppointmentPresenter.toHttp(appointment);
  }
}
