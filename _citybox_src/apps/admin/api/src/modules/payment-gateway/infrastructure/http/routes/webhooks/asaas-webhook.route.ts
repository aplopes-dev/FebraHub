import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Headers,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { ReceiveAsaasWebhookUseCase } from '../../../../application/use-cases/receive-asaas-webhook/receive-asaas-webhook.use-case';

@ApiTags('webhooks')
@Controller('v1/webhooks/payment/asaas')
export class AsaasWebhookRoute {
  constructor(
    private readonly receiveAsaasWebhook: ReceiveAsaasWebhookUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receber webhooks do Asaas' })
  async handle(
    @Body() body: any,
    @Headers('asaas-access-token') signatureHeader?: string,
  ) {
    console.log(`\n\n\n\n\n WEBHOOK: ${JSON.stringify(body)} \n\n\n\n\n`);
    const result = await this.receiveAsaasWebhook.execute({
      body,
      signatureHeader,
    });
    return { success: result.success };
  }
}
