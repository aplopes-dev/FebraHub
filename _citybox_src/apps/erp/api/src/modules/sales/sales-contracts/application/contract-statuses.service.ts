import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type { ContractStatusWritableHttpDto } from '../http/dto';

@Injectable()
export class ContractStatusesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    const rows = await this.prisma.scoped.contractStatus.findMany({
      where: { organizationId },
      orderBy: { sortOrder: 'asc' },
    });
    return { data: rows.map((row) => this.toHttp(row)) };
  }

  async create(organizationId: string, dto: ContractStatusWritableHttpDto) {
    const row = await this.prisma.scoped.contractStatus.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return this.toHttp(row);
  }

  async update(
    organizationId: string,
    id: string,
    dto: ContractStatusWritableHttpDto,
  ) {
    await this.assertExists(organizationId, id);
    const row = await this.prisma.scoped.contractStatus.update({
      where: { id, organizationId },
      data: { name: dto.name.trim(), sortOrder: dto.sortOrder ?? 0 },
    });
    return this.toHttp(row);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const current = await this.assertExists(organizationId, id);
    if (current.isSystem) {
      throw new ConflictException(
        'Status de sistema não pode ser excluído. Renomeie-o se precisar de outro rótulo.',
      );
    }

    const inUse = await this.prisma.scoped.salesContract.findFirst({
      where: { organizationId, statusId: id },
      select: { id: true },
    });
    if (inUse) {
      throw new BadRequestException(
        'Este status está em uso por contratos e não pode ser excluído.',
      );
    }
    await this.prisma.scoped.contractStatus.delete({
      where: { id, organizationId },
    });
  }

  private async assertExists(organizationId: string, id: string) {
    const found = await this.prisma.scoped.contractStatus.findFirst({
      where: { id, organizationId },
      select: { id: true, isSystem: true },
    });
    if (!found)
      throw new NotFoundException('Status de contrato não encontrado');
    return found;
  }

  private toHttp(row: {
    id: string;
    name: string;
    sortOrder: number;
    active: boolean;
    isSystem: boolean;
  }) {
    return {
      id: row.id,
      name: row.name,
      sortOrder: row.sortOrder,
      active: row.active,
      isSystem: row.isSystem,
    };
  }
}
