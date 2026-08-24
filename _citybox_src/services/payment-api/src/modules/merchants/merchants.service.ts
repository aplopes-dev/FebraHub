import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { toJson } from '../../common/utils/prisma-json.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateMerchantDto, UpdateMerchantDto } from './dto/merchant.dto.js';

@Injectable()
export class MerchantsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateMerchantDto) {
    return this.prisma.db.merchant.create({
      data: {
        tenantId,
        legalName: dto.legalName,
        tradeName: dto.tradeName,
        cpfCnpj: dto.cpfCnpj,
        email: dto.email,
        phone: dto.phone,
        addressJson: toJson(dto.address),
      },
    });
  }

  async list(tenantId: string) {
    return this.prisma.db.merchant.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(tenantId: string, id: string) {
    const merchant = await this.prisma.db.merchant.findFirst({ where: { id, tenantId } });
    if (!merchant) throw new NotFoundException('Merchant não encontrado');
    return merchant;
  }

  async update(tenantId: string, id: string, dto: UpdateMerchantDto) {
    await this.get(tenantId, id);
    return this.prisma.db.merchant.update({
      where: { id },
      data: {
        legalName: dto.legalName,
        tradeName: dto.tradeName,
        email: dto.email,
        phone: dto.phone,
        addressJson: toJson(dto.address),
        status: dto.status,
      },
    });
  }
}
