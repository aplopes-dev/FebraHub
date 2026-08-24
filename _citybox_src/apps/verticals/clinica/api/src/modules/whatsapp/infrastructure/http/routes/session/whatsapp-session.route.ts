import { Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { DisconnectWhatsappSessionUseCase } from '../../../../application/use-cases/disconnect-session/disconnect-whatsapp-session.use-case';
import { GetWhatsappSessionUseCase } from '../../../../application/use-cases/get-session/get-whatsapp-session.use-case';
import { RequestWhatsappQrUseCase } from '../../../../application/use-cases/request-qr/request-whatsapp-qr.use-case';

@ApiTags('whatsapp')
@Controller('v1/whatsapp/session')
@RequirePermission('manage', 'Settings')
export class WhatsappSessionRoute {
  constructor(
    private readonly getSession: GetWhatsappSessionUseCase,
    private readonly requestQr: RequestWhatsappQrUseCase,
    private readonly disconnect: DisconnectWhatsappSessionUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Status da sessão WhatsApp (QR se pendente)' })
  async get(@StoreId() storeId: string) {
    const data = await this.getSession.execute({ storeId });
    return { data };
  }

  @Post('qr')
  @ApiOperation({ summary: 'Solicitar / atualizar QR Code WhatsApp' })
  async qr(@StoreId() storeId: string) {
    const data = await this.requestQr.execute({ storeId });
    return { data };
  }

  @Delete()
  @ApiOperation({ summary: 'Desconectar WhatsApp da clínica' })
  async remove(@StoreId() storeId: string) {
    await this.disconnect.execute({ storeId });
    return { data: { ok: true } };
  }
}
