import { Controller, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LiberateSignaturePackageRequestUseCase } from '../../../../application/use-cases/liberate-signature-package-request/liberate-signature-package-request.use-case';
import { RequirePlatformAdmin } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toSignaturePackageRequestResponse } from '../shared/signature-packages-response.mapper';

@ApiTags('signature-packages')
@Controller('v1/signature-package-requests')
@RequirePlatformAdmin()
export class LiberateSignaturePackageRequestRoute {
  constructor(
    private readonly liberateSignaturePackageRequest: LiberateSignaturePackageRequestUseCase,
  ) {}

  @Patch(':id/liberar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liberar solicitação de pacote (admin da plataforma)',
  })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const request = await this.liberateSignaturePackageRequest.execute({
      storeId,
      id,
    });
    return { data: toSignaturePackageRequestResponse(request) };
  }
}
