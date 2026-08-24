import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/jwt.guard.js';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  @Get()
  liveness() {
    return { status: 'ok', service: 'marketplace-bff', version: '1.0.0' };
  }

  @Get('ready')
  readiness() {
    return { status: 'ok', ready: true, service: 'marketplace-bff' };
  }
}
