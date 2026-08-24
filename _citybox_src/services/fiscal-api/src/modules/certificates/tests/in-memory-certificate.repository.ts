import { CertificateRepository } from '../domain/repositories/certificate.repository.interface';
import type { Certificate } from '../domain/entities/certificate.entity';

export class InMemoryCertificateRepository extends CertificateRepository {
  private readonly certificates = new Map<string, Certificate>();

  findById(id: string): Promise<Certificate | null> {
    return Promise.resolve(this.certificates.get(id) ?? null);
  }

  findValidByCompanyId(companyId: string): Promise<Certificate | null> {
    const found = [...this.certificates.values()]
      .filter((cert) => cert.companyId === companyId && cert.status === 'VALID')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return Promise.resolve(found ?? null);
  }

  findAllByCompanyId(companyId: string): Promise<Certificate[]> {
    return Promise.resolve(
      [...this.certificates.values()].filter(
        (cert) => cert.companyId === companyId,
      ),
    );
  }

  save(certificate: Certificate): Promise<Certificate> {
    this.certificates.set(certificate.id, certificate);
    return Promise.resolve(certificate);
  }
}
