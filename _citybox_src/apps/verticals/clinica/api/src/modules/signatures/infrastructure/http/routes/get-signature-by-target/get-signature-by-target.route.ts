import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetSignatureByTargetUseCase } from '../../../../application/use-cases/get-signature-by-target/get-signature-by-target.use-case';
import type { ElectronicSignatureKind } from '../../../../domain/entities/electronic-signature.entity';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toElectronicSignatureResponse } from '../shared/electronic-signature-response.mapper';

function parseSyncQuery(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

@ApiTags('signatures')
@Controller('v1/patients/:patientId/signatures')
@RequirePermission('manage', 'Patient')
export class GetSignatureByTargetRoute {
  constructor(
    private readonly getSignatureByTarget: GetSignatureByTargetUseCase,
  ) {}

  @Get('by-target/:kind/:targetId')
  @ApiOperation({
    summary: 'Buscar última solicitação de assinatura por documento-alvo',
  })
  @ApiQuery({
    name: 'sync',
    required: false,
    description:
      'Se true, consulta a ZapSign antes de responder (pode demorar). Default: só banco.',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('kind') kind: string,
    @Param('targetId') targetId: string,
    @Query('sync') sync?: string,
  ) {
    if (
      kind !== 'anamnesis' &&
      kind !== 'contract' &&
      kind !== 'evolution_batch'
    ) {
      throw new BadRequestException('Tipo de assinatura inválido');
    }

    const signature = await this.getSignatureByTarget.execute({
      storeId,
      patientId,
      kind: kind as ElectronicSignatureKind,
      targetId,
      sync: parseSyncQuery(sync),
    });
    return { data: toElectronicSignatureResponse(signature) };
  }
}
