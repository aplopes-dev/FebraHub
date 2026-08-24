import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPosPolicyUseCase } from '../../../../application/use-cases/get-pos-policy/get-pos-policy.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosPolicyPresenter } from '../shared/pos-policy.presenter';

@ApiTags('pos-policies')
@Controller('v1/pos-policy')
export class GetPosPolicyRoute {
  constructor(private readonly getPosPolicy: GetPosPolicyUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Alçadas do PDV da organização',
    description:
      'Nunca responde 404: organização que nunca configurou recebe a política padrão, criada na primeira leitura.',
  })
  async handle(@OrganizationId() organizationId: string) {
    const policy = await this.getPosPolicy.execute({ organizationId });
    return PosPolicyPresenter.toHttpSingle(policy);
  }
}
