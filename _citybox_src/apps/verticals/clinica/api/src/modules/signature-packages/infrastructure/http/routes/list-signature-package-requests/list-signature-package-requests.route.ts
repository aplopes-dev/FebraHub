import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListSignaturePackageRequestsUseCase } from '../../../../application/use-cases/list-signature-package-requests/list-signature-package-requests.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toSignaturePackageRequestResponse } from '../shared/signature-packages-response.mapper';
import { ListSignaturePackageRequestsQueryDto } from './list-signature-package-requests.query.dto';

@ApiTags('signature-packages')
@Controller('v1/signature-package-requests')
@RequirePermission('manage', 'Settings')
export class ListSignaturePackageRequestsRoute {
  constructor(
    private readonly listSignaturePackageRequests: ListSignaturePackageRequestsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar solicitações de pacotes de assinatura' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListSignaturePackageRequestsQueryDto,
  ) {
    const result = await this.listSignaturePackageRequests.execute({
      storeId,
      page: query.page,
      perPage: query.perPage,
      status: query.status,
    });
    return {
      data: result.items.map(toSignaturePackageRequestResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
