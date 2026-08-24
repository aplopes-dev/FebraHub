import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { txClient } from '../../../../shared/infra/prisma/transaction.context';
import {
  StoreRepository,
  type StoreListCriteria,
} from '../../domain/repositories/store.repository.interface';
import {
  Store,
  type StoreProps,
  type StoreStatus,
  type StoreDeploymentStatus,
  type StorePersonType,
  type StoreVertical,
} from '../../domain/entities/store.entity';
import { normalizeStoreVertical } from '../../domain/catalog/normalize-store-vertical';
import { isClinicStrand } from '@citybox/messaging';

@Injectable()
export class PrismaStoreRepository extends StoreRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Store | null> {
    const row = await this.prisma.store.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const row = await this.prisma.store.findUnique({ where: { slug } });
    return row ? this.toEntity(row) : null;
  }

  async findByGatewayCustomerId(
    gatewayCustomerId: string,
  ): Promise<Store | null> {
    const row = await this.prisma.store.findUnique({
      where: { gatewayCustomerId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(criteria?: StoreListCriteria): Promise<Store[]> {
    const rows = await this.prisma.store.findMany({
      where: this.buildWhere(criteria),
      skip: criteria?.skip,
      take: criteria?.take,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async count(criteria?: StoreListCriteria): Promise<number> {
    return this.prisma.store.count({ where: this.buildWhere(criteria) });
  }

  async save(store: Store): Promise<Store> {
    const row = await txClient(this.prisma).store.upsert({
      where: { id: store.id },
      create: {
        id: store.id,
        vertical: store.vertical,
        clinicStrand: store.clinicStrand,
        tradeName: store.tradeName,
        slug: store.slug,
        status: store.status,
        deploymentStatus: store.deploymentStatus,
        document: store.document,
        personType: store.personType,
        responsibleName: store.responsibleName,
        billingEmail: store.billingEmail,
        gatewayCustomerId: store.gatewayCustomerId,
        legalName: store.legalName,
        stateRegistration: store.stateRegistration,
        zipCode: store.zipCode,
        street: store.street,
        number: store.streetNumber,
        complement: store.complement,
        neighborhood: store.neighborhood,
        city: store.city,
        state: store.state,
        phone: store.phone,
        timezone: store.timezone,
        lastSeenAt: store.lastSeenAt,
        ordersToday: store.ordersToday,
        ordersThisMonth: store.ordersThisMonth,
        revenueTodayCents: store.revenueTodayCents,
        averageTicketCents: store.averageTicketCents,
        averageAcceptTimeSeconds: store.averageAcceptTimeSeconds,
        lastOrderAt: store.lastOrderAt,
        lastAccessAt: store.lastAccessAt,
        maintenanceMode: store.maintenanceMode,
        visibleInApp: store.visibleInApp,
        trialEndsAt: store.trialEndsAt,
        sefazHomologacao: store.sefazHomologacao,
        contingenciaOffline: store.contingenciaOffline,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
      },
      update: {
        tradeName: store.tradeName,
        slug: store.slug,
        status: store.status,
        deploymentStatus: store.deploymentStatus,
        document: store.document,
        personType: store.personType,
        responsibleName: store.responsibleName,
        billingEmail: store.billingEmail,
        gatewayCustomerId: store.gatewayCustomerId,
        legalName: store.legalName,
        stateRegistration: store.stateRegistration,
        zipCode: store.zipCode,
        street: store.street,
        number: store.streetNumber,
        complement: store.complement,
        neighborhood: store.neighborhood,
        city: store.city,
        state: store.state,
        phone: store.phone,
        timezone: store.timezone,
        lastSeenAt: store.lastSeenAt,
        ordersToday: store.ordersToday,
        ordersThisMonth: store.ordersThisMonth,
        revenueTodayCents: store.revenueTodayCents,
        averageTicketCents: store.averageTicketCents,
        averageAcceptTimeSeconds: store.averageAcceptTimeSeconds,
        lastOrderAt: store.lastOrderAt,
        lastAccessAt: store.lastAccessAt,
        maintenanceMode: store.maintenanceMode,
        visibleInApp: store.visibleInApp,
        trialEndsAt: store.trialEndsAt,
        sefazHomologacao: store.sefazHomologacao,
        contingenciaOffline: store.contingenciaOffline,
        updatedAt: store.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  private buildWhere(criteria?: StoreListCriteria): Prisma.StoreWhereInput {
    const conditions: Prisma.StoreWhereInput[] = [];

    if (criteria?.status?.length) {
      conditions.push({ status: { in: criteria.status } });
    }

    if (criteria?.vertical?.length) {
      conditions.push({ vertical: { in: criteria.vertical } });
    }

    if (criteria?.createdFrom || criteria?.createdTo) {
      conditions.push({
        createdAt: {
          ...(criteria.createdFrom ? { gte: criteria.createdFrom } : {}),
          ...(criteria.createdTo ? { lte: criteria.createdTo } : {}),
        },
      });
    }

    const search = criteria?.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { tradeName: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          // Buscava pelo nome do cliente; agora pelo responsável da própria loja.
          { responsibleName: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (!conditions.length) return {};
    return { AND: conditions };
  }

  private toEntity(row: {
    id: string;
    vertical: string;
    clinicStrand: string | null;
    tradeName: string;
    slug: string;
    status: string;
    deploymentStatus: string;
    document: string | null;
    personType: string | null;
    responsibleName: string | null;
    billingEmail: string | null;
    gatewayCustomerId: string | null;
    legalName: string | null;
    stateRegistration: string | null;
    zipCode: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    timezone: string;
    lastSeenAt: Date | null;
    ordersToday: number;
    ordersThisMonth: number;
    revenueTodayCents: number;
    averageTicketCents: number;
    averageAcceptTimeSeconds: number;
    lastOrderAt: Date | null;
    lastAccessAt: Date | null;
    maintenanceMode: boolean;
    visibleInApp: boolean;
    trialEndsAt: Date | null;
    sefazHomologacao: boolean;
    contingenciaOffline: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Store {
    const props: StoreProps = {
      vertical: normalizeStoreVertical(row.vertical) as StoreVertical,
      clinicStrand:
        row.clinicStrand && isClinicStrand(row.clinicStrand)
          ? row.clinicStrand
          : row.vertical === 'Clínica'
            ? 'odontologia'
            : null,
      tradeName: row.tradeName,
      slug: row.slug,
      status: row.status as StoreStatus,
      deploymentStatus: row.deploymentStatus as StoreDeploymentStatus,
      document: row.document,
      personType: row.personType as StorePersonType | null,
      responsibleName: row.responsibleName,
      billingEmail: row.billingEmail,
      gatewayCustomerId: row.gatewayCustomerId,
      legalName: row.legalName,
      stateRegistration: row.stateRegistration,
      zipCode: row.zipCode,
      street: row.street,
      streetNumber: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      phone: row.phone,
      timezone: row.timezone,
      lastSeenAt: row.lastSeenAt,
      ordersToday: row.ordersToday,
      ordersThisMonth: row.ordersThisMonth,
      revenueTodayCents: row.revenueTodayCents,
      averageTicketCents: row.averageTicketCents,
      averageAcceptTimeSeconds: row.averageAcceptTimeSeconds,
      lastOrderAt: row.lastOrderAt,
      lastAccessAt: row.lastAccessAt,
      maintenanceMode: row.maintenanceMode,
      visibleInApp: row.visibleInApp,
      trialEndsAt: row.trialEndsAt,
      sefazHomologacao: row.sefazHomologacao,
      contingenciaOffline: row.contingenciaOffline,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Store.with(props, row.id);
  }
}
