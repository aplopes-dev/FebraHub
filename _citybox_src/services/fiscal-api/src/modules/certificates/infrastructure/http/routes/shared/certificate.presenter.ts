import type { Certificate } from '../../../../domain/entities/certificate.entity';
import { toCertificateResponse } from './certificate-response.mapper';

export class CertificatePresenter {
  static toHttp(certificate: Certificate) {
    return { data: toCertificateResponse(certificate) };
  }

  static toListHttp(certificates: Certificate[]) {
    return { data: certificates.map(toCertificateResponse) };
  }
}
