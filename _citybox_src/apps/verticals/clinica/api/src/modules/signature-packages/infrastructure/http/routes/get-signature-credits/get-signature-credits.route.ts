import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetSignatureCreditsUseCase } from '../../../../application/use-cases/get-signature-credits/get-signature-credits.use-case';
import { RequireAnyPermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toSignatureCreditBalanceResponse } from '../shared/signature-packages-response.mapper';

@ApiTags('signature-packages')
@Controller('v1/signature-credits')
@RequireAnyPermission(
  { action: 'manage', subject: 'Settings' },
  { action: 'manage', subject: 'Patient' },
)
export class GetSignatureCreditsRoute {
  constructor(
    private readonly getSignatureCredits: GetSignatureCreditsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obter saldo de créditos de assinatura eletrônica' })
  async handle(@StoreId() storeId: string) {
    const balance = await this.getSignatureCredits.execute({ storeId });
    return { data: toSignatureCreditBalanceResponse(balance) };
  }
}
