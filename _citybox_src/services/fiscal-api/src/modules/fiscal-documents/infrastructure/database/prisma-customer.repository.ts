import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { CustomerRepository } from '../../domain/repositories/customer.repository.interface';
import {
  Customer,
  type CustomerAddress,
  type CustomerDocumentType,
  type CustomerProps,
} from '../../domain/entities/customer.entity';

type CustomerRow = {
  id: string;
  companyId: string;
  documentType: string;
  document: string;
  name: string;
  email: string | null;
  phone: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  address: unknown;
  createdAt: Date;
};

@Injectable()
export class PrismaCustomerRepository extends CustomerRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByDocument(
    companyId: string,
    document: string,
  ): Promise<Customer | null> {
    const row = await this.prisma.customer.findFirst({
      where: { companyId, document },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(customer: Customer): Promise<Customer> {
    const row = await this.prisma.customer.upsert({
      where: { id: customer.id },
      create: {
        id: customer.id,
        companyId: customer.companyId,
        documentType: customer.documentType,
        document: customer.document,
        name: customer.name,
        email: customer.email,
        address: customer.address,
        createdAt: customer.createdAt,
      },
      update: {
        name: customer.name,
        email: customer.email,
        address: customer.address,
      },
    });
    return this.toEntity(row);
  }

  private toEntity(row: CustomerRow): Customer {
    const props: CustomerProps = {
      companyId: row.companyId,
      documentType: row.documentType as CustomerDocumentType,
      document: row.document,
      name: row.name,
      email: row.email,
      phone: row.phone,
      stateRegistration: row.stateRegistration,
      municipalRegistration: row.municipalRegistration,
      address: row.address as CustomerAddress,
      createdAt: row.createdAt,
    };
    return Customer.with(props, row.id);
  }
}
