import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ElectronicSignatureStatus } from '../../../../domain/entities/electronic-signature.entity';
import { ListElectronicSignaturesUseCase } from '../../../../application/use-cases/list-electronic-signatures/list-electronic-signatures.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toElectronicSignatureResponse } from '../shared/electronic-signature-response.mapper';
import { ListElectronicSignaturesQueryDto } from './list-electronic-signatures.query.dto';

function normalizeStatuses(
  status: ListElectronicSignaturesQueryDto['status'],
): ElectronicSignatureStatus[] | undefined {
  if (!status || status.length === 0) return undefined;
  return status;
}

@ApiTags('signatures')
@Controller('v1/electronic-signatures')
@RequirePermission('manage', 'Settings')
export class ListElectronicSignaturesRoute {
  constructor(
    private readonly listElectronicSignatures: ListElectronicSignaturesUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Relatório de assinaturas da loja (listagem + KPIs por período)',
  })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListElectronicSignaturesQueryDto,
  ) {
    const result = await this.listElectronicSignatures.execute({
      storeId,
      startDate: query.startDate,
      endDate: query.endDate,
      kind: query.kind,
      statuses: normalizeStatuses(query.status),
      page: query.page,
      perPage: query.perPage,
    });

    return {
      data: result.items.map(({ signature, patientName }) => ({
        ...toElectronicSignatureResponse(signature),
        patientName,
      })),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
        stats: result.stats,
      },
    };
  }
}
