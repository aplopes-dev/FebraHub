import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { SeedClinicDemoTeamUseCase } from '../../../../application/use-cases/seed-clinic-demo-team/seed-clinic-demo-team.use-case';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class SeedClinicDemoTeamRoute {
  constructor(private readonly seedClinicDemoTeam: SeedClinicDemoTeamUseCase) {}

  @Post(':id/seed-clinic-demo-team')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed equipe demo clínica (no-op — worker clinic.store-setup)',
  })
  async handle(@Param('id') storeId: string) {
    return this.seedClinicDemoTeam.execute({
      storeId,
      actor: 'system:clinic-store-setup',
    });
  }
}
