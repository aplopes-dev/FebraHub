import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { toJson } from '../../common/utils/prisma-json.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    await this.assertMerchant(tenantId, dto.merchantId);
    return this.prisma.db.paymentCustomer.create({
      data: {
        tenantId,
        merchantId: dto.merchantId,
        name: dto.name,
        cpfCnpj: dto.cpfCnpj,
        email: dto.email,
        phone: dto.phone,
        addressJson: toJson(dto.address),
      },
    });
  }

  list(tenantId: string, merchantId?: string) {
    return this.prisma.db.paymentCustomer.findMany({
      where: { tenantId, ...(merchantId ? { merchantId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(tenantId: string, id: string) {
    const customer = await this.prisma.db.paymentCustomer.findFirst({ where: { id, tenantId } });
    if (!customer) throw new NotFoundException('Customer não encontrado');
    return customer;
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    await this.get(tenantId, id);
    return this.prisma.db.paymentCustomer.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        addressJson: toJson(dto.address),
      },
    });
  }

  private async assertMerchant(tenantId: string, merchantId: string) {
    const merchant = await this.prisma.db.merchant.findFirst({ where: { id: merchantId, tenantId } });
    if (!merchant) throw new NotFoundException('Merchant não encontrado');
  }
}
