import { Controller, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelSignaturePackageRequestUseCase } from '../../../../application/use-cases/cancel-signature-package-request/cancel-signature-package-request.use-case';
import { RequirePlatformAdmin } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toSignaturePackageRequestResponse } from '../shared/signature-packages-response.mapper';

@ApiTags('signature-packages')
@Controller('v1/signature-package-requests')
@RequirePlatformAdmin()
export class CancelSignaturePackageRequestRoute {
  constructor(
    private readonly cancelSignaturePackageRequest: CancelSignaturePackageRequestUseCase,
  ) {}

  @Patch(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar solicitação de pacote pendente (admin da plataforma)',
  })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const request = await this.cancelSignaturePackageRequest.execute({
      storeId,
      id,
    });
    return { data: toSignaturePackageRequestResponse(request) };
  }
}
