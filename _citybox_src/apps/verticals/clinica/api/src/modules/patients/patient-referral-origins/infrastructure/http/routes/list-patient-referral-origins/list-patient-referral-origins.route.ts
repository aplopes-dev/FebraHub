import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientReferralOriginsUseCase } from '../../../../application/use-cases/list-patient-referral-origins/list-patient-referral-origins.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientReferralOriginResponse } from '../shared/patient-referral-origin-response.mapper';

@ApiTags('patient-referral-origins')
@Controller('v1/patient-referral-origins')
@RequirePermission('manage', 'Patient')
export class ListPatientReferralOriginsRoute {
  constructor(
    private readonly listOrigins: ListPatientReferralOriginsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar origens de chegada do paciente' })
  async handle(@StoreId() storeId: string) {
    const origins = await this.listOrigins.execute({ storeId });
    return { data: origins.map(toPatientReferralOriginResponse) };
  }
}
