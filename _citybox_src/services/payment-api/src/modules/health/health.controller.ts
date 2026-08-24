import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/auth.decorators.js';
import { PaymentMetricsService } from '../../common/observability/payment-metrics.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PaymentMetricsService) private readonly metrics: PaymentMetricsService,
  ) {}

  @Get()
  @Public()
  liveness() {
    return { ok: true, service: 'payment-api', version: '0.1.0' };
  }

  @Get('ready')
  @Public()
  async readiness() {
    try {
      await this.prisma.db.tenant.count();
      return { ok: true, ready: true, service: 'payment-api', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException({
        ok: false,
        ready: false,
        service: 'payment-api',
        database: 'disconnected',
      });
    }
  }

  @Get('metrics')
  metricsSnapshot() {
    return {
      service: 'payment-api',
      counters: this.metrics.snapshot(),
      series: this.metrics.snapshotDetailed(),
    };
  }
}
