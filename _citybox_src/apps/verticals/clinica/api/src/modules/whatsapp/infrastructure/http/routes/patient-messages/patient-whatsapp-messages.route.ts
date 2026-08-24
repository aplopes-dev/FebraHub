import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListPatientWhatsappMessagesUseCase } from '../../../../application/use-cases/list-patient-messages/list-patient-whatsapp-messages.use-case';

class ListPatientWhatsappMessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}

@ApiTags('whatsapp')
@Controller('v1/patients/:patientId/whatsapp-messages')
@RequirePermission('manage', 'Patient')
export class PatientWhatsappMessagesRoute {
  constructor(
    private readonly listMessages: ListPatientWhatsappMessagesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Histórico de mensagens WhatsApp do paciente' })
  async list(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientWhatsappMessagesQueryDto,
  ) {
    const result = await this.listMessages.execute({
      storeId,
      patientId,
      page: query.page,
      perPage: query.perPage,
    });
    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
