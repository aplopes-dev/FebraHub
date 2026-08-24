import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListStoreSignaturePackageRequestsUseCase } from '../../../../application/use-cases/list-store-signature-package-requests/list-store-signature-package-requests.use-case';
import { LiberateStoreSignaturePackageRequestUseCase } from '../../../../application/use-cases/liberate-store-signature-package-request/liberate-store-signature-package-request.use-case';
import { CancelStoreSignaturePackageRequestUseCase } from '../../../../application/use-cases/cancel-store-signature-package-request/cancel-store-signature-package-request.use-case';

/**
 * Proxy M2M de solicitações de pacote de assinatura (clinica-api).
 *
 * Só lojas `vertical === 'Clínica'` — validação nos use cases. O platform não
 * guarda cópia; lista, libera e cancela de forma síncrona.
 */
@ApiTags('stores')
@Controller('v1/stores/:storeId/signature-package-requests')
@RequirePermission('platform.admin')
export class SignaturePackageRequestsRoute {
  constructor(
    private readonly listRequests: ListStoreSignaturePackageRequestsUseCase,
    private readonly liberateRequest: LiberateStoreSignaturePackageRequestUseCase,
    private readonly cancelRequest: CancelStoreSignaturePackageRequestUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Lista solicitações de pacote de assinatura da loja (via clinica-api)',
  })
  async list(@Param('storeId') storeId: string) {
    const data = await this.listRequests.execute({ storeId });
    return { data };
  }

  @Patch(':requestId/liberar')
  @ApiOperation({
    summary: 'Libera solicitação de pacote (credita saldo na clinica-api)',
  })
  async liberate(
    @Param('storeId') storeId: string,
    @Param('requestId') requestId: string,
  ) {
    const data = await this.liberateRequest.execute({ storeId, requestId });
    return { data };
  }

  @Patch(':requestId/cancelar')
  @ApiOperation({
    summary: 'Cancela solicitação de pacote pendente (via clinica-api)',
  })
  async cancel(
    @Param('storeId') storeId: string,
    @Param('requestId') requestId: string,
  ) {
    const data = await this.cancelRequest.execute({ storeId, requestId });
    return { data };
  }
}
