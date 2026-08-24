import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
import { CreateAppointmentUseCase } from '../../../../application/use-cases/create-appointment/create-appointment.use-case';
import { CreateAppointmentDto } from './create-appointment.dto';
import { CreateAppointmentPresenter } from './create-appointment.presenter';

/**
 * Corretor → sempre o próprio scope.
 * Admin/dono → honora agentId do body (compromisso de colega / edit); fallback scope.
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
export class CreateAppointmentRoute {
  constructor(private readonly createAppointment: CreateAppointmentUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Calendar')
  @ApiOperation({ summary: 'Criar compromisso' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Body() dto: CreateAppointmentDto,
  ) {
    const agentId = resolveAppointmentAgentId(user, scope, dto.agentId);
    if (!agentId) {
      throw new ValidatorDomainError({
        internalMessage: 'Missing agentId on create appointment',
        externalMessage:
          'Não foi possível identificar o corretor responsável pelo compromisso.',
        context: CreateAppointmentRoute.name,
      });
    }
    const appointment = await this.createAppointment.execute({
      storeId,
      ...dto,
      agentId,
    });
    return CreateAppointmentPresenter.toHttp(appointment);
  }
}
