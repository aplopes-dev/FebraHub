import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type { ServiceOrderStatusWritableHttpDto } from '../http/dto';

@Injectable()
export class ServiceOrderStatusesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    let rows = await this.prisma.scoped.serviceOrderStatus.findMany({
      where: { organizationId },
      orderBy: { sortOrder: 'asc' },
    });

    if (rows.length === 0) {
      const defaults = [
        { name: 'Aberta', baseType: 'open', sortOrder: 0 },
        { name: 'Em andamento', baseType: 'in_progress', sortOrder: 1 },
        { name: 'Pronta', baseType: 'ready', sortOrder: 2 },
        { name: 'Fechada', baseType: 'closed', sortOrder: 3 },
        { name: 'Cancelada', baseType: 'canceled', sortOrder: 4 },
      ] as const;
      await this.prisma.scoped.serviceOrderStatus.createMany({
        data: defaults.map((item) => ({
          organizationId,
          name: item.name,
          baseType: item.baseType,
          sortOrder: item.sortOrder,
        })),
      });
      rows = await this.prisma.scoped.serviceOrderStatus.findMany({
        where: { organizationId },
        orderBy: { sortOrder: 'asc' },
      });
    }

    return { data: rows.map((row) => this.toHttp(row)) };
  }

  async create(organizationId: string, dto: ServiceOrderStatusWritableHttpDto) {
    const row = await this.prisma.scoped.serviceOrderStatus.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        baseType: dto.baseType,
        sortOrder: dto.sortOrder ?? 0,
        variant: dto.variant ?? 'secondary',
        active: dto.active ?? true,
      },
    });
    return this.toHttp(row);
  }

  async update(
    organizationId: string,
    id: string,
    dto: ServiceOrderStatusWritableHttpDto,
  ) {
    const current = await this.assertExists(organizationId, id);

    // Renomear e reordenar é livre; o `baseType` é o que o fluxo de OS lê para
    // saber o que "fechada" significa, então num status de sistema ele trava.
    if (current.isSystem && dto.baseType !== current.baseType) {
      throw new BadRequestException(
        'Não é possível alterar o tipo de um status de sistema.',
      );
    }

    const row = await this.prisma.scoped.serviceOrderStatus.update({
      where: { id, organizationId },
      data: {
        name: dto.name.trim(),
        baseType: dto.baseType,
        sortOrder: dto.sortOrder ?? 0,
        variant: dto.variant ?? 'secondary',
        active: dto.active ?? true,
      },
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

    const inUse = await this.prisma.scoped.serviceOrder.findFirst({
      where: { organizationId, statusId: id },
      select: { id: true },
    });
    if (inUse) {
      throw new BadRequestException(
        'Este status está em uso por ordens de serviço e não pode ser excluído.',
      );
    }
    await this.prisma.scoped.serviceOrderStatus.delete({
      where: { id, organizationId },
    });
  }

  private async assertExists(organizationId: string, id: string) {
    const found = await this.prisma.scoped.serviceOrderStatus.findFirst({
      where: { id, organizationId },
      select: { id: true, isSystem: true, baseType: true },
    });
    if (!found) throw new NotFoundException('Status de OS não encontrado');
    return found;
  }

  private toHttp(row: {
    id: string;
    name: string;
    baseType: string;
    sortOrder: number;
    active: boolean;
    variant: string;
    isSystem: boolean;
  }) {
    return {
      id: row.id,
      name: row.name,
      baseType: row.baseType,
      sortOrder: row.sortOrder,
      active: row.active,
      variant: row.variant,
      isSystem: row.isSystem,
    };
  }
}
