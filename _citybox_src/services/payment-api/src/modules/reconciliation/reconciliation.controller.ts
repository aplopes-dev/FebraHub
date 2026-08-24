import { Body, Controller, Get, Inject, Param, Post, Query, Res } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentAuth } from '../../common/auth/payment-auth.decorator.js';
import type { PaymentAuthContext } from '../../common/auth/auth.types.js';
import {
  ImportReconciliationDto,
  MarkDivergentDto,
  MatchReconciliationDto,
} from './dto/reconciliation.dto.js';
import { ReconciliationService } from './reconciliation.service.js';

@ApiTags('reconciliation')
@ApiSecurity('api-key')
@Controller('reconciliation')
export class ReconciliationController {
  constructor(@Inject(ReconciliationService) private readonly reconciliation: ReconciliationService) {}

  @Get()
  async list(
    @PaymentAuth() auth: PaymentAuthContext,
    @Query('status') status?: string,
    @Query('batchId') batchId?: string,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const result = await this.reconciliation.list(auth.tenantId, { status, batchId, format });
    if (format === 'csv' && typeof result === 'string') {
      res?.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res?.setHeader('Content-Disposition', 'attachment; filename="reconciliation-divergences.csv"');
      return result;
    }
    return result;
  }

  @Post('import')
  import(@PaymentAuth() auth: PaymentAuthContext, @Body() dto: ImportReconciliationDto) {
    return this.reconciliation.import(auth.tenantId, auth.sourceSystem, dto);
  }

  @Post(':id/match')
  match(
    @PaymentAuth() auth: PaymentAuthContext,
    @Param('id') id: string,
    @Body() dto: MatchReconciliationDto,
  ) {
    return this.reconciliation.match(auth.tenantId, id, auth.sourceSystem, dto);
  }

  @Post(':id/mark-divergent')
  markDivergent(
    @PaymentAuth() auth: PaymentAuthContext,
    @Param('id') id: string,
    @Body() dto: MarkDivergentDto,
  ) {
    return this.reconciliation.markDivergent(auth.tenantId, id, auth.sourceSystem, dto);
  }
}
