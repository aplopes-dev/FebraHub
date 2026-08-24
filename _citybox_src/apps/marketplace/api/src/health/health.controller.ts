import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  liveness() {
    return { ok: true, service: 'marketplace-api', version: '0.1.0' };
  }

  @Get('ready')
  readiness() {
    return { ok: true, ready: true, service: 'marketplace-api' };
  }
}