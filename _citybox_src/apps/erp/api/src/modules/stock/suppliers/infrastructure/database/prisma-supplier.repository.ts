import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import type { PersonTypeValue } from '../../../../../shared/core/utils/document';
import {
  Supplier,
  type SupplierProps,
} from '../../domain/entities/supplier.entity';
import {
  SupplierRepository,
  type SupplierListCriteria,
} from '../../domain/repositories/supplier.repository.interface';

type SupplierRow = {
  id: string;
  organizationId: string;
  personType: string;
  name: string;
  legalName: string | null;
  document: string;
  stateRegistration: string | null;
  stateExempt: boolean;
  municipalRegistration: string | null;
  sufamaRegistration: string | null;
  foundationDate: Date | null;
  note: string;
  email: string | null;
  commercialPhone: string | null;
  mobilePhone: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  complement: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  branches?: Array<{ branchId: string }>;
};

const WITH_BRANCHES = { branches: { select: { branchId: true } } } as const;

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto em
 * toda query, mesmo nas que já o passam explicitamente aqui. As duas travas são
 * de propósito — uma pega o esquecimento, a outra o bug de chamada.
 */
@Injectable()
export class PrismaSupplierRepository extends SupplierRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(organizationId: string, id: string): Promise<Supplier | null> {
    const row = await this.prisma.scoped.supplier.findFirst({
      where: { id, organizationId },
      include: WITH_BRANCHES,
    });
    return row ? this.toEntity(row) : null;
  }

  async findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Supplier | null> {
    // Inclui os excluídos de propósito: o unique do banco
    // (`organizationId, document`) não conhece soft-delete. Filtrar aqui faria
    // a checagem passar e o INSERT estourar como 500.
    const row = await this.prisma.scoped.supplier.findFirst({
      where: { organizationId, document },
      include: WITH_BRANCHES,
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: SupplierListCriteria = {},
  ): Promise<Supplier[]> {
    const rows = await this.prisma.scoped.supplier.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: WITH_BRANCHES,
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: SupplierListCriteria = {},
  ): Promise<number> {
    return this.prisma.scoped.supplier.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async save(supplier: Supplier): Promise<Supplier> {
    const contact = supplier.contact;
    const address = supplier.address;
    const data = {
      organizationId: supplier.organizationId,
      personType: supplier.personType,
      name: supplier.name,
      legalName: supplier.legalName,
      document: supplier.document,
      stateRegistration: supplier.stateRegistration,
      stateExempt: supplier.stateExempt,
      municipalRegistration: supplier.municipalRegistration,
      sufamaRegistration: supplier.sufamaRegistration,
      foundationDate: supplier.foundationDate,
      note: supplier.note,
      ...contact,
      ...address,
      deletedAt: supplier.deletedAt,
      updatedAt: supplier.updatedAt,
    };

    // Fornecedor e vínculos na mesma transação: um fornecedor salvo com a lista
    // de unidades pela metade apareceria na filial errada até a próxima
    // gravação. `scoped.$transaction` mantém o recorte por organização dentro
    // da transação — o cliente cru o perderia.
    const row = await this.prisma.scoped.$transaction(async (tx) => {
      const saved = await tx.supplier.upsert({
        where: { id: supplier.id },
        create: { id: supplier.id, ...data, createdAt: supplier.createdAt },
        update: data,
      });

      await tx.supplierBranch.deleteMany({
        where: {
          supplierId: saved.id,
          organizationId: supplier.organizationId,
        },
      });
      if (supplier.branchIds.length > 0) {
        await tx.supplierBranch.createMany({
          data: supplier.branchIds.map((branchId) => ({
            organizationId: supplier.organizationId,
            supplierId: saved.id,
            branchId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.supplier.findFirstOrThrow({
        where: { id: saved.id },
        include: WITH_BRANCHES,
      });
    });

    return this.toEntity(row);
  }

  private buildWhere(
    organizationId: string,
    criteria: SupplierListCriteria,
  ): Prisma.SupplierWhereInput {
    const and: Prisma.SupplierWhereInput[] = [];
    const search = criteria.search?.trim();

    and.push(
      criteria.tab === 'deleted'
        ? { deletedAt: { not: null } }
        : { deletedAt: null },
    );

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { legalName: { contains: search, mode: 'insensitive' } },
          { document: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    return { organizationId, AND: and };
  }

  private toEntity(row: SupplierRow): Supplier {
    const props: SupplierProps = {
      organizationId: row.organizationId,
      personType: row.personType as PersonTypeValue,
      name: row.name,
      legalName: row.legalName,
      document: row.document,
      stateRegistration: row.stateRegistration,
      stateExempt: row.stateExempt,
      municipalRegistration: row.municipalRegistration,
      sufamaRegistration: row.sufamaRegistration,
      foundationDate: row.foundationDate,
      note: row.note,
      email: row.email,
      commercialPhone: row.commercialPhone,
      mobilePhone: row.mobilePhone,
      zipCode: row.zipCode,
      street: row.street,
      number: row.number,
      complement: row.complement,
      district: row.district,
      city: row.city,
      state: row.state,
      branchIds: (row.branches ?? []).map((link) => link.branchId),
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Supplier.with(props, row.id);
  }
}
