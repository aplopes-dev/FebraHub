import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { HandleZapSignWebhookUseCase } from '../../../../application/use-cases/handle-zapsign-webhook/handle-zapsign-webhook.use-case';

type ZapSignWebhookBody = {
  event_type?: string;
  event?: string;
  token?: string;
  status?: string;
  signed_file?: string | null;
  signers?: Array<{
    token?: string;
    status?: string;
    sign_url?: string;
    signed_at?: string | null;
  }>;
  document?: {
    token?: string;
    status?: string;
    signed_file?: string | null;
    signers?: Array<{
      token?: string;
      status?: string;
      sign_url?: string;
      signed_at?: string | null;
    }>;
  };
};

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function extractWebhookSecret(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const custom = headers['x-zapsign-secret'] ?? headers['x-webhook-secret'];
  if (typeof custom === 'string' && custom.trim()) {
    return custom.trim();
  }
  if (Array.isArray(custom) && custom[0]?.trim()) {
    return custom[0].trim();
  }

  const auth = headers.authorization;
  const authValue = Array.isArray(auth) ? auth[0] : auth;
  if (typeof authValue === 'string' && authValue.toLowerCase().startsWith('bearer ')) {
    return authValue.slice(7).trim();
  }
  return null;
}

@ApiTags('webhooks')
@Controller('v1/webhooks')
export class ZapSignWebhookRoute {
  private readonly logger = new Logger(ZapSignWebhookRoute.name);

  constructor(
    private readonly handleZapSignWebhook: HandleZapSignWebhookUseCase,
  ) {}

  @Public()
  @Post('zapsign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook ZapSign (doc_signed / refused / expired)' })
  async handle(
    @Body() body: ZapSignWebhookBody,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const expected = process.env.ZAPSIGN_WEBHOOK_SECRET?.trim() ?? '';
    const isProduction = process.env.NODE_ENV === 'production';

    if (!expected) {
      if (isProduction) {
        this.logger.error('ZAPSIGN_WEBHOOK_SECRET ausente em produção');
        throw new UnauthorizedException('Webhook não configurado');
      }
      this.logger.warn(
        'ZAPSIGN_WEBHOOK_SECRET ausente — webhook aceito só em não-produção',
      );
    } else {
      const provided = extractWebhookSecret(headers);
      if (!provided || !secretsMatch(provided, expected)) {
        throw new UnauthorizedException('Webhook não autorizado');
      }
    }

    const document = body.document ?? body;
    const rawSigners = document.signers ?? body.signers ?? [];
    await this.handleZapSignWebhook.execute({
      eventType: body.event_type ?? body.event ?? '',
      documentToken: document.token ?? body.token,
      documentStatus: document.status ?? body.status,
      signedFileUrl: document.signed_file ?? body.signed_file ?? null,
      signers: rawSigners.map((signer) => ({
        token: signer.token,
        status: signer.status,
        signUrl: signer.sign_url,
        signedAt: signer.signed_at ?? null,
      })),
    });
    return { ok: true };
  }
}
