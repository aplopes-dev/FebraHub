import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindPublicAnamnesisByTokenUseCase } from '../../../../application/use-cases/find-public-anamnesis-by-token/find-public-anamnesis-by-token.use-case';
import { Public } from '../../../../../../../shared/infra/http/decorators/public.decorator';
import { toPublicAnamnesisResponse } from '../shared/patient-anamnesis-response.mapper';

@ApiTags('public-anamnesis')
@Controller('v1/public/anamnesis')
export class FindPublicAnamnesisByTokenRoute {
  constructor(
    private readonly findPublicAnamnesisByToken: FindPublicAnamnesisByTokenUseCase,
  ) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Carregar anamnese pública por token' })
  async handle(@Param('token') token: string) {
    const result = await this.findPublicAnamnesisByToken.execute({
      publicToken: token,
    });
    return {
      data: toPublicAnamnesisResponse(result),
    };
  }
}
