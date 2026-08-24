import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSignaturePackageRequestUseCase } from '../../../../application/use-cases/create-signature-package-request/create-signature-package-request.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateSignaturePackageRequestDto } from './create-signature-package-request.dto';
import { toSignaturePackageRequestResponse } from '../shared/signature-packages-response.mapper';

@ApiTags('signature-packages')
@Controller('v1/signature-package-requests')
@RequirePermission('manage', 'Settings')
export class CreateSignaturePackageRequestRoute {
  constructor(
    private readonly createSignaturePackageRequest: CreateSignaturePackageRequestUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar pacote de créditos de assinatura' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateSignaturePackageRequestDto,
  ) {
    const request = await this.createSignaturePackageRequest.execute({
      storeId,
      packageId: dto.packageId,
    });
    return { data: toSignaturePackageRequestResponse(request) };
  }
}
