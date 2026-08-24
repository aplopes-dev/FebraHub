import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import type { PersonTypeValue } from '../../../../../shared/core/utils/document';
import {
  Carrier,
  type CarrierDeliveryTypeValue,
  type CarrierProps,
} from '../../domain/entities/carrier.entity';
import {
  CarrierRepository,
  type CarrierListCriteria,
} from '../../domain/repositories/carrier.repository.interface';

type CarrierRow = {
  id: string;
  organizationId: string;
  personType: string;
  deliveryType: string;
  name: string;
  legalName: string | null;
  document: string;
  icmsExempt: boolean;
  registerInNfe: boolean;
  stateRegistration: string | null;
  stateExempt: boolean;
  municipalRegistration: string | null;
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
export class PrismaCarrierRepository extends CarrierRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(organizationId: string, id: string): Promise<Carrier | null> {
    const row = await this.prisma.scoped.carrier.findFirst({
      where: { id, organizationId },
      include: WITH_BRANCHES,
    });
    return row ? this.toEntity(row) : null;
  }

  async findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Carrier | null> {
    // Inclui as excluídas de propósito: o unique do banco
    // (`organizationId, document`) não conhece soft-delete. Filtrar aqui faria
    // a checagem passar e o INSERT estourar como 500.
    const row = await this.prisma.scoped.carrier.findFirst({
      where: { organizationId, document },
      include: WITH_BRANCHES,
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: CarrierListCriteria = {},
  ): Promise<Carrier[]> {
    const rows = await this.prisma.scoped.carrier.findMany({
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
    criteria: CarrierListCriteria = {},
  ): Promise<number> {
    return this.prisma.scoped.carrier.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async save(carrier: Carrier): Promise<Carrier> {
    const contact = carrier.contact;
    const address = carrier.address;
    const data = {
      organizationId: carrier.organizationId,
      personType: carrier.personType,
      deliveryType: carrier.deliveryType,
      name: carrier.name,
      legalName: carrier.legalName,
      document: carrier.document,
      icmsExempt: carrier.icmsExempt,
      registerInNfe: carrier.registerInNfe,
      stateRegistration: carrier.stateRegistration,
      stateExempt: carrier.stateExempt,
      municipalRegistration: carrier.municipalRegistration,
      ...contact,
      ...address,
      deletedAt: carrier.deletedAt,
      updatedAt: carrier.updatedAt,
    };

    // Transportadora e vínculos na mesma transação: uma transportadora salva
    // com a lista de unidades pela metade apareceria na filial errada até a
    // próxima gravação. `scoped.$transaction` mantém o recorte por organização
    // dentro da transação — o cliente cru o perderia.
    const row = await this.prisma.scoped.$transaction(async (tx) => {
      const saved = await tx.carrier.upsert({
        where: { id: carrier.id },
        create: { id: carrier.id, ...data, createdAt: carrier.createdAt },
        update: data,
      });

      await tx.carrierBranch.deleteMany({
        where: {
          carrierId: saved.id,
          organizationId: carrier.organizationId,
        },
      });
      if (carrier.branchIds.length > 0) {
        await tx.carrierBranch.createMany({
          data: carrier.branchIds.map((branchId) => ({
            organizationId: carrier.organizationId,
            carrierId: saved.id,
            branchId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.carrier.findFirstOrThrow({
        where: { id: saved.id },
        include: WITH_BRANCHES,
      });
    });

    return this.toEntity(row);
  }

  private buildWhere(
    organizationId: string,
    criteria: CarrierListCriteria,
  ): Prisma.CarrierWhereInput {
    const and: Prisma.CarrierWhereInput[] = [];
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

  private toEntity(row: CarrierRow): Carrier {
    const props: CarrierProps = {
      organizationId: row.organizationId,
      personType: row.personType as PersonTypeValue,
      deliveryType: row.deliveryType as CarrierDeliveryTypeValue,
      name: row.name,
      legalName: row.legalName,
      document: row.document,
      icmsExempt: row.icmsExempt,
      registerInNfe: row.registerInNfe,
      stateRegistration: row.stateRegistration,
      stateExempt: row.stateExempt,
      municipalRegistration: row.municipalRegistration,
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
    return Carrier.with(props, row.id);
  }
}
