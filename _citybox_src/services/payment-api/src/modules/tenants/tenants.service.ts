import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto.js';

@Injectable()
export class TenantsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  create(dto: CreateTenantDto) {
    return this.prisma.db.tenant.create({
      data: { name: dto.name, status: dto.status ?? 'ACTIVE' },
    });
  }

  list() {
    return this.prisma.db.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async get(id: string) {
    const tenant = await this.prisma.db.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.get(id);
    return this.prisma.db.tenant.update({
      where: { id },
      data: { name: dto.name, status: dto.status },
    });
  }
}
