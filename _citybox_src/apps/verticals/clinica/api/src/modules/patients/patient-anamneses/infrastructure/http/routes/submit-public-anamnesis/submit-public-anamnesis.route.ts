import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubmitPublicAnamnesisUseCase } from '../../../../application/use-cases/submit-public-anamnesis/submit-public-anamnesis.use-case';
import { Public } from '../../../../../../../shared/infra/http/decorators/public.decorator';
import { SubmitPublicAnamnesisBodyDto } from '../shared/patient-anamnesis-body.dto';
import { toPatientAnamnesisDetailResponse } from '../shared/patient-anamnesis-response.mapper';

@ApiTags('public-anamnesis')
@Controller('v1/public/anamnesis')
export class SubmitPublicAnamnesisRoute {
  constructor(
    private readonly submitPublicAnamnesis: SubmitPublicAnamnesisUseCase,
  ) {}

  @Patch(':token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar respostas da anamnese pública' })
  async handle(
    @Param('token') token: string,
    @Body() body: SubmitPublicAnamnesisBodyDto,
  ) {
    const anamnesis = await this.submitPublicAnamnesis.execute({
      publicToken: token,
      answers: body.answers,
    });
    return { data: toPatientAnamnesisDetailResponse(anamnesis) };
  }
}
