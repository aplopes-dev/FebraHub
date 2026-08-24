import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  PosPolicy,
  type PosPolicyProps,
} from '../../domain/entities/pos-policy.entity';
import { PosPolicyRepository } from '../../domain/repositories/pos-policy.repository.interface';

type PosPolicyRow = {
  id: string;
  organizationId: string;
  discountSupervisorAbovePercent: number;
  withdrawalSupervisorAboveCents: number;
  cancellationRequiresSupervisor: boolean;
  refundRequiresSupervisor: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPosPolicyRepository extends PosPolicyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByOrganization(organizationId: string): Promise<PosPolicy | null> {
    const row = await this.prisma.scoped.posPolicy.findFirst({
      where: { organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(policy: PosPolicy): Promise<PosPolicy> {
    const data = {
      organizationId: policy.organizationId,
      discountSupervisorAbovePercent: policy.discountSupervisorAbovePercent,
      withdrawalSupervisorAboveCents: policy.withdrawalSupervisorAboveCents,
      cancellationRequiresSupervisor: policy.cancellationRequiresSupervisor,
      refundRequiresSupervisor: policy.refundRequiresSupervisor,
      updatedAt: policy.updatedAt,
    };

    const row = await this.prisma.scoped.posPolicy.upsert({
      where: { id: policy.id },
      create: { id: policy.id, ...data, createdAt: policy.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  private toEntity(row: PosPolicyRow): PosPolicy {
    const props: PosPolicyProps = {
      organizationId: row.organizationId,
      discountSupervisorAbovePercent: row.discountSupervisorAbovePercent,
      withdrawalSupervisorAboveCents: row.withdrawalSupervisorAboveCents,
      cancellationRequiresSupervisor: row.cancellationRequiresSupervisor,
      refundRequiresSupervisor: row.refundRequiresSupervisor,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PosPolicy.with(props, row.id);
  }
}
