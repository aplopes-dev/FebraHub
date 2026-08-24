import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { CreateFiscalSequenceUseCase } from '../../../../application/use-cases/create-fiscal-sequence/create-fiscal-sequence.use-case';
import { FiscalSequencePresenter } from '../shared/fiscal-sequence.presenter';
import { CreateFiscalSequenceDto } from './create-fiscal-sequence.dto';

@ApiTags('fiscal-sequences')
@Controller('v1/companies/:companyId/sequences')
export class CreateFiscalSequenceRoute {
  constructor(private readonly createSequence: CreateFiscalSequenceUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('fiscal.sequences.manage')
  @ApiOperation({ summary: 'Criar série de nota fiscal (spec erp/011, US1)' })
  async handle(
    @Param('companyId') companyId: string,
    @Body() dto: CreateFiscalSequenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const sequence = await this.createSequence.execute({
      companyId,
      documentType: dto.documentType,
      series: dto.series,
      initialNumber: dto.initialNumber,
      environment: dto.environment,
      user,
    });
    return FiscalSequencePresenter.toHttp(sequence);
  }
}
