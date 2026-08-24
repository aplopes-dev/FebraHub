import { Body, Controller, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpsertPosPolicyUseCase } from '../../../../application/use-cases/upsert-pos-policy/upsert-pos-policy.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  UpsertPosPolicyHttpDto,
  toUpsertPosPolicyInput,
} from '../shared/pos-policy.dto';
import { PosPolicyPresenter } from '../shared/pos-policy.presenter';

@ApiTags('pos-policies')
@Controller('v1/pos-policy')
export class UpsertPosPolicyRoute {
  constructor(private readonly upsertPosPolicy: UpsertPosPolicyUseCase) {}

  @Put()
  @RequirePermission('org.pos_policies.manage')
  @ApiOperation({
    summary: 'Definir as alçadas do PDV',
    description:
      'Sem `:id`: há **uma** política por organização. Campo ausente não muda.',
  })
  @ApiResponse({ status: 422, description: 'Percentual fora de 0–100' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: UpsertPosPolicyHttpDto,
  ) {
    const policy = await this.upsertPosPolicy.execute({
      organizationId,
      ...toUpsertPosPolicyInput(dto),
    });
    return PosPolicyPresenter.toHttpSingle(policy);
  }
}
