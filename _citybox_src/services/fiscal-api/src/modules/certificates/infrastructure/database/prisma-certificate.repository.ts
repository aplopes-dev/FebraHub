import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { CertificateRepository } from '../../domain/repositories/certificate.repository.interface';
import {
  Certificate,
  type CertificateProps,
  type CertificateStatus,
} from '../../domain/entities/certificate.entity';

type CertificateRow = {
  id: string;
  companyId: string;
  type: string;
  name: string | null;
  encryptedPfxObjectKey: string;
  encryptedPassword: string;
  subjectCnpj: string;
  validFrom: Date;
  validUntil: Date;
  status: string;
  createdAt: Date;
};

@Injectable()
export class PrismaCertificateRepository extends CertificateRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Certificate | null> {
    const row = await this.prisma.certificate.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findValidByCompanyId(companyId: string): Promise<Certificate | null> {
    const row = await this.prisma.certificate.findFirst({
      where: { companyId, status: 'VALID' },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Certificate[]> {
    const rows = await this.prisma.certificate.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async save(certificate: Certificate): Promise<Certificate> {
    const row = await this.prisma.certificate.upsert({
      where: { id: certificate.id },
      create: {
        id: certificate.id,
        companyId: certificate.companyId,
        type: certificate.type,
        name: certificate.name,
        encryptedPfxObjectKey: certificate.encryptedPfxObjectKey,
        encryptedPassword: certificate.encryptedPassword,
        subjectCnpj: certificate.subjectCnpj,
        validFrom: certificate.validFrom,
        validUntil: certificate.validUntil,
        status: certificate.status,
        createdAt: certificate.createdAt,
      },
      update: {
        name: certificate.name,
        status: certificate.status,
      },
    });
    return this.toEntity(row);
  }

  private toEntity(row: CertificateRow): Certificate {
    const props: CertificateProps = {
      companyId: row.companyId,
      type: row.type,
      name: row.name,
      encryptedPfxObjectKey: row.encryptedPfxObjectKey,
      encryptedPassword: row.encryptedPassword,
      subjectCnpj: row.subjectCnpj,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
      status: row.status as CertificateStatus,
      createdAt: row.createdAt,
    };
    return Certificate.with(props, row.id);
  }
}
