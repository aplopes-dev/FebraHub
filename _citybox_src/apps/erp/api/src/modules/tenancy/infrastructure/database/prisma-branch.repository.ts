import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type { PersonTypeValue } from '../../../../shared/core/utils/document';
import {
  Branch,
  type BranchProps,
  type TaxRegimeValue,
} from '../../domain/entities/branch.entity';
import {
  BranchRepository,
  type BranchListCriteria,
} from '../../domain/repositories/branch.repository.interface';

type BranchRow = {
  id: string;
  organizationId: string;
  code: string;
  personType: string;
  document: string;
  legalName: string;
  tradeName: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  taxRegime: string;
  isHeadquarters: boolean;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  active: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BranchWhere = {
  organizationId: string;
  deletedAt?: null;
  active?: boolean;
  id?: { in: string[] };
  OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>>;
};

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto em
 * toda query, mesmo nas que já o passam explicitamente aqui. As duas travas são
 * de propósito — uma pega o esquecimento, a outra o bug de chamada.
 */
@Injectable()
export class PrismaBranchRepository extends BranchRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(organizationId: string, id: string): Promise<Branch | null> {
    const row = await this.prisma.scoped.branch.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByCode(
    organizationId: string,
    code: string,
  ): Promise<Branch | null> {
    const trimmed = code.trim();
    if (!trimmed) return null;

    // Inclui as desativadas de propósito: o unique do banco
    // (`organizationId, code`) não conhece soft-delete. Filtrar aqui faria a
    // checagem passar e o INSERT estourar como 500.
    const row = await this.prisma.scoped.branch.findFirst({
      where: {
        organizationId,
        code: { equals: trimmed, mode: 'insensitive' },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Branch | null> {
    // Idem `findByCode`: o unique alcança as unidades desativadas.
    const row = await this.prisma.scoped.branch.findFirst({
      where: { organizationId, document },
    });
    return row ? this.toEntity(row) : null;
  }

  async findHeadquarters(organizationId: string): Promise<Branch | null> {
    const row = await this.prisma.scoped.branch.findFirst({
      where: { organizationId, isHeadquarters: true, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: BranchListCriteria = {},
  ): Promise<Branch[]> {
    const rows = await this.prisma.scoped.branch.findMany({
      where: this.buildWhere(organizationId, criteria),
      // Matriz primeiro, depois por código: é a ordem em que o lojista pensa
      // sobre as unidades dele.
      orderBy: [{ isHeadquarters: 'desc' }, { code: 'asc' }],
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: BranchListCriteria = {},
  ): Promise<number> {
    return this.prisma.scoped.branch.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async save(branch: Branch): Promise<Branch> {
    const address = branch.address;
    const data = {
      organizationId: branch.organizationId,
      code: branch.code,
      personType: branch.personType,
      document: branch.document,
      legalName: branch.legalName,
      tradeName: branch.tradeName,
      stateRegistration: branch.stateRegistration,
      municipalRegistration: branch.municipalRegistration,
      taxRegime: branch.taxRegime,
      isHeadquarters: branch.isHeadquarters,
      ...address,
      phone: branch.phone,
      email: branch.email,
      timezone: branch.timezone,
      active: branch.active,
      deletedAt: branch.deletedAt,
      updatedAt: branch.updatedAt,
    };

    const row = await this.prisma.scoped.branch.upsert({
      where: { id: branch.id },
      create: { id: branch.id, ...data, createdAt: branch.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  private buildWhere(
    organizationId: string,
    criteria: BranchListCriteria,
  ): BranchWhere {
    const search = criteria.search?.trim();
    const where: BranchWhere = { organizationId };

    if (!criteria.includeDeleted) where.deletedAt = null;
    if (criteria.activeOnly) where.active = true;
    // `null` significa "todas" (OWNER/ADMIN); lista vazia significa "nenhuma".
    if (criteria.allowedBranchIds !== null && criteria.allowedBranchIds) {
      where.id = { in: criteria.allowedBranchIds };
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { legalName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private toEntity(row: BranchRow): Branch {
    const props: BranchProps = {
      organizationId: row.organizationId,
      code: row.code,
      personType: row.personType as PersonTypeValue,
      document: row.document,
      legalName: row.legalName,
      tradeName: row.tradeName,
      stateRegistration: row.stateRegistration,
      municipalRegistration: row.municipalRegistration,
      taxRegime: row.taxRegime as TaxRegimeValue,
      isHeadquarters: row.isHeadquarters,
      zipCode: row.zipCode,
      street: row.street,
      number: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      phone: row.phone,
      email: row.email,
      timezone: row.timezone,
      active: row.active,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Branch.with(props, row.id);
  }
}
