import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { SkipImoveisScope } from '../../../../../../shared/infra/http/decorators/skip-imoveis-scope.decorator';
import { HandleGoogleCalendarCallbackUseCase } from '../../../../application/use-cases/handle-google-calendar-callback/handle-google-calendar-callback.use-case';

@ApiTags('integrations')
@Controller('v1/users/me/integrations/google-calendar')
export class HandleGoogleCalendarCallbackRoute {
  constructor(
    private readonly handleCallback: HandleGoogleCalendarCallbackUseCase,
  ) {}

  @Get('callback')
  @Public()
  @SkipImoveisScope()
  @ApiOperation({
    summary:
      'Callback OAuth2 Google (público) — grava refresh token e redireciona ao web',
  })
  async handle(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.handleCallback.execute({ code, state, error });
    res.redirect(302, result.redirectUrl);
  }
}
