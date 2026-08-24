import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  liveness() {
    return { ok: true, service: 'erp-comercio-api', version: '0.1.0' };
  }

  @Public()
  @Get('ready')
  readiness() {
    return { ok: true, ready: true, service: 'erp-comercio-api' };
  }
}
