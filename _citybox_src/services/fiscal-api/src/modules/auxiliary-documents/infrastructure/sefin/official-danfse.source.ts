import { Injectable, Logger } from '@nestjs/common';
import { OfficialDocumentSource } from '../../domain/official-source.interface';
import { OfficialDanfseClient } from './official-danfse.client';
import { CertificateRepository } from '../../../certificates/domain/repositories/certificate.repository.interface';
import { loadCertificateKeyMaterial } from '../../../../shared/infra/fiscal-signature/certificate-key-loader';
import { ObjectStorage } from '../../../../shared/domain/storage/object-storage.interface';
import type { FiscalDocument } from '../../../fiscal-documents/domain/entities/fiscal-document.entity';

/// Adapter entre a porta de domínio `OfficialDocumentSource` e o cliente HTTP.
///
/// Existe para manter o certificado **fora** do use case: buscar o DANFSE
/// oficial exige mTLS, o que exige localizar o certificado da empresa e
/// descriptografá-lo. Nada disso é assunto de "entregar o documento de uma
/// nota".
///
/// ⚠️ Como a porta manda, **nunca lança**. Sem certificado válido não há
/// chamada — e não há erro: o caminho local não depende de certificado nenhum,
/// já que o XML autorizado está armazenado.
@Injectable()
export class OfficialDanfseSource extends OfficialDocumentSource {
  private readonly logger = new Logger(OfficialDanfseSource.name);

  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly objectStorage: ObjectStorage,
    private readonly client: OfficialDanfseClient,
  ) {
    super();
  }

  async fetch(document: FiscalDocument): Promise<Buffer | null> {
    // Sem chave de acesso não há o que consultar. Acontece com nota que ficou
    // em estado intermediário; o caminho local segue funcionando.
    if (!document.accessKey) return null;

    try {
      const certificate = await this.certificateRepository.findValidByCompanyId(
        document.companyId,
      );
      if (!certificate?.isValidNow()) return null;

      const { privateKeyPem, certificatePem } =
        await loadCertificateKeyMaterial(this.objectStorage, certificate);

      return await this.client.fetch({
        accessKey: document.accessKey,
        privateKeyPem,
        certificatePem,
      });
    } catch (error: unknown) {
      this.logger.debug(
        `Nao foi possivel consultar o DANFSE oficial de ${document.id}; usando geracao local. Causa: ${
          error instanceof Error ? error.message : 'desconhecida'
        }`,
      );
      return null;
    }
  }
}
