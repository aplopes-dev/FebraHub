import { Body, Controller, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertClinicProfileUseCase } from '../../../../application/use-cases/upsert-clinic-profile/upsert-clinic-profile.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertClinicProfileDto } from '../shared/clinic-profile.http-dto';
import { toClinicProfileResponse } from '../shared/clinic-profile-response.mapper';

@ApiTags('clinic-profile')
@Controller('v1/clinic-profile')
@RequirePermission('manage', 'Settings')
export class UpsertClinicProfileRoute {
  constructor(private readonly upsertProfile: UpsertClinicProfileUseCase) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Salvar perfil da clínica' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: UpsertClinicProfileDto,
  ) {
    const profile = await this.upsertProfile.execute({ storeId, ...dto });
    return { data: toClinicProfileResponse(profile) };
  }
}
