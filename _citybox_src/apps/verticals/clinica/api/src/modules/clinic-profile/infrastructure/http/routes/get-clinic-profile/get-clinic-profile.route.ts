import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetClinicProfileUseCase } from '../../../../application/use-cases/get-clinic-profile/get-clinic-profile.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toClinicProfileResponse } from '../shared/clinic-profile-response.mapper';

@ApiTags('clinic-profile')
@Controller('v1/clinic-profile')
@RequirePermission('manage', 'Settings')
export class GetClinicProfileRoute {
  constructor(private readonly getProfile: GetClinicProfileUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Obter perfil da clínica' })
  async handle(@StoreId() storeId: string) {
    const profile = await this.getProfile.execute({ storeId });
    return { data: toClinicProfileResponse(profile) };
  }
}
