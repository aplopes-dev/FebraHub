import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientReferralOriginUseCase } from '../../../../application/use-cases/create-patient-referral-origin/create-patient-referral-origin.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreatePatientReferralOriginBodyDto } from '../shared/patient-referral-origin.dto';
import { toPatientReferralOriginResponse } from '../shared/patient-referral-origin-response.mapper';

@ApiTags('patient-referral-origins')
@Controller('v1/patient-referral-origins')
@RequirePermission('manage', 'Patient')
export class CreatePatientReferralOriginRoute {
  constructor(
    private readonly createOrigin: CreatePatientReferralOriginUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar origem customizada de chegada' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreatePatientReferralOriginBodyDto,
  ) {
    const origin = await this.createOrigin.execute({
      storeId,
      name: dto.name,
    });
    return { data: toPatientReferralOriginResponse(origin) };
  }
}
