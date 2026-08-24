import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type { PersonTypeValue } from '../../../../shared/core/utils/document';
import {
  CUSTOMER_STAGES,
  Customer,
  type CustomerAddressProps,
  type CustomerAddressTypeValue,
  type CustomerProps,
  type CustomerStageValue,
} from '../../domain/entities/customer.entity';
import {
  CustomerRepository,
  type CustomerListCriteria,
} from '../../domain/repositories/customer.repository.interface';

type AddressRow = {
  id: string;
  addressType: string;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  complement: string | null;
};

type CustomerRow = {
  id: string;
  organizationId: string;
  personType: string;
  name: string;
  document: string | null;
  rg: string | null;
  birthDate: Date | null;
  email: string | null;
  mobilePhone: string | null;
  phone: string | null;
  additionalPhones: string[];
  stage: string;
  categoryId: string | null;
  notes: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  addresses?: AddressRow[];
  branches?: Array<{ branchId: string }>;
};

const WITH_RELATIONS = {
  addresses: true,
  branches: { select: { branchId: true } },
} as const;

@Injectable()
export class PrismaCustomerRepository extends CustomerRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(organizationId: string, id: string): Promise<Customer | null> {
    const row = await this.prisma.scoped.customer.findFirst({
      where: { id, organizationId },
      include: WITH_RELATIONS,
    });
    return row ? this.toEntity(row) : null;
  }

  async findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Customer | null> {
    const row = await this.prisma.scoped.customer.findFirst({
      where: { organizationId, document },
      include: WITH_RELATIONS,
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: CustomerListCriteria = {},
  ): Promise<Customer[]> {
    const rows = await this.prisma.scoped.customer.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: WITH_RELATIONS,
      orderBy: { createdAt: 'desc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: CustomerListCriteria = {},
  ): Promise<number> {
    return this.prisma.scoped.customer.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async countByStage(
    organizationId: string,
  ): Promise<Record<CustomerStageValue, number>> {
    const groups = await this.prisma.scoped.customer.groupBy({
      by: ['stage'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
    });

    const result = Object.fromEntries(
      CUSTOMER_STAGES.map((stage) => [stage, 0]),
    ) as Record<CustomerStageValue, number>;

    for (const group of groups) {
      const stage = group.stage;
      if (stage in result) result[stage] = group._count._all;
    }
    return result;
  }

  async save(customer: Customer): Promise<Customer> {
    const data = {
      organizationId: customer.organizationId,
      personType: customer.personType,
      name: customer.name,
      document: customer.document,
      rg: customer.rg,
      birthDate: customer.birthDate,
      email: customer.email,
      mobilePhone: customer.mobilePhone,
      phone: customer.phone,
      additionalPhones: customer.additionalPhones,
      stage: customer.stage,
      categoryId: customer.categoryId,
      notes: customer.notes,
      deletedAt: customer.deletedAt,
      updatedAt: customer.updatedAt,
    };

    const row = await this.prisma.scoped.$transaction(async (tx) => {
      const saved = await tx.customer.upsert({
        where: { id: customer.id },
        create: { id: customer.id, ...data, createdAt: customer.createdAt },
        update: data,
      });

      await tx.customerAddress.deleteMany({
        where: {
          customerId: saved.id,
          organizationId: customer.organizationId,
        },
      });
      if (customer.addresses.length > 0) {
        await tx.customerAddress.createMany({
          data: customer.addresses.map((address) => ({
            id: address.id,
            organizationId: customer.organizationId,
            customerId: saved.id,
            addressType: address.addressType,
            zipCode: address.zipCode,
            street: address.street,
            number: address.number,
            district: address.district,
            city: address.city,
            state: address.state,
            complement: address.complement,
          })),
        });
      }

      await tx.customerBranch.deleteMany({
        where: {
          customerId: saved.id,
          organizationId: customer.organizationId,
        },
      });
      if (customer.branchIds.length > 0) {
        await tx.customerBranch.createMany({
          data: customer.branchIds.map((branchId) => ({
            organizationId: customer.organizationId,
            customerId: saved.id,
            branchId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.customer.findFirstOrThrow({
        where: { id: saved.id },
        include: WITH_RELATIONS,
      });
    });

    return this.toEntity(row);
  }

  private buildWhere(
    organizationId: string,
    criteria: CustomerListCriteria,
  ): Prisma.CustomerWhereInput {
    const and: Prisma.CustomerWhereInput[] = [{ deletedAt: null }];
    const search = criteria.search?.trim();
    const tab = criteria.tab ?? 'all';

    if (tab !== 'all') {
      and.push({ stage: tab });
    }

    if (search) {
      const digits = search.replace(/\D/g, '');
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { mobilePhone: { contains: search, mode: 'insensitive' } },
          ...(digits.length > 0
            ? [
                { phone: { contains: digits } },
                { mobilePhone: { contains: digits } },
                { document: { contains: digits } },
              ]
            : []),
        ],
      });
    }

    return { organizationId, AND: and };
  }

  private toEntity(row: CustomerRow): Customer {
    const addresses: CustomerAddressProps[] = (row.addresses ?? []).map(
      (address) => ({
        id: address.id,
        addressType: address.addressType as CustomerAddressTypeValue,
        zipCode: address.zipCode,
        street: address.street,
        number: address.number,
        district: address.district,
        city: address.city,
        state: address.state,
        complement: address.complement,
      }),
    );

    const props: CustomerProps = {
      organizationId: row.organizationId,
      personType: row.personType as PersonTypeValue,
      name: row.name,
      document: row.document,
      rg: row.rg,
      birthDate: row.birthDate,
      email: row.email,
      mobilePhone: row.mobilePhone,
      phone: row.phone,
      additionalPhones: row.additionalPhones ?? [],
      stage: row.stage as CustomerStageValue,
      categoryId: row.categoryId,
      notes: row.notes,
      addresses,
      branchIds: (row.branches ?? []).map((link) => link.branchId),
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Customer.with(props, row.id);
  }
}
