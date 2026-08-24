import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { RequiresAdmin } from '../../common/auth/auth.decorators.js';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto.js';
import { TenantsService } from './tenants.service.js';

@ApiTags('tenants')
@ApiSecurity('api-key')
@Controller('tenants')
@RequiresAdmin()
export class TenantsController {
  constructor(@Inject(TenantsService) private readonly tenants: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenants.create(dto);
  }

  @Get()
  list() {
    return this.tenants.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tenants.get(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenants.update(id, dto);
  }
}
