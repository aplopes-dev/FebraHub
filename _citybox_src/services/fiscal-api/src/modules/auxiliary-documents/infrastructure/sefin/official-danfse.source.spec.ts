import { randomUUID } from 'crypto';
import { OfficialDanfseSource } from './official-danfse.source';
import { OfficialDanfseClient } from './official-danfse.client';
import { CertificateRepository } from '../../../certificates/domain/repositories/certificate.repository.interface';
import { ObjectStorage } from '../../../../shared/domain/storage/object-storage.interface';
import { InMemoryObjectStorage } from '../../../../shared/infra/storage/in-memory-object-storage';
import { buildFiscalDocument } from '../../../fiscal-documents/tests/fixtures/fiscal-document.fixture';
import type { Certificate } from '../../../certificates/domain/entities/certificate.entity';
import * as keyLoader from '../../../../shared/infra/fiscal-signature/certificate-key-loader';

const ACCESS_KEY = '29136062250031609000104000000000002026080715989993';

function certificateStub(isValid = true): Certificate {
  return {
    isValidNow: () => isValid,
    encryptedPfxObjectKey: 'cert.pfx',
    encryptedPassword: 'senha-cifrada',
  } as unknown as Certificate;
}

class StubCertificateRepository extends CertificateRepository {
  constructor(private readonly certificate: Certificate | null) {
    super();
  }
  findValidByCompanyId(): Promise<Certificate | null> {
    return Promise.resolve(this.certificate);
  }
  findById = (): Promise<null> => Promise.resolve(null);
  findAllByCompanyId = (): Promise<Certificate[]> => Promise.resolve([]);
  save = (c: Certificate): Promise<Certificate> => Promise.resolve(c);
}

/// Repositório que **explode** — simula banco fora do ar. É o cenário em que a
/// diferença entre "devolve null" e "propaga erro" decide se a impressão de
/// nota continua funcionando.
class ExplodingCertificateRepository extends StubCertificateRepository {
  constructor() {
    super(null);
  }
  findValidByCompanyId(): Promise<never> {
    return Promise.reject(new Error('connection pool exhausted'));
  }
}

describe('OfficialDanfseSource', () => {
  let storage: ObjectStorage;
  let client: OfficialDanfseClient;
  let clientFetch: jest.SpyInstance;

  beforeEach(() => {
    storage = new InMemoryObjectStorage();
    client = new OfficialDanfseClient();
    clientFetch = jest
      .spyOn(client, 'fetch')
      .mockResolvedValue(Buffer.from('%PDF-oficial'));
    jest.spyOn(keyLoader, 'loadCertificateKeyMaterial').mockResolvedValue({
      privateKeyPem: 'KEY',
      certificatePem: 'CERT',
    });
  });

  afterEach(() => jest.restoreAllMocks());

  function documentWith(overrides: Parameters<typeof buildFiscalDocument>[0]) {
    return buildFiscalDocument(overrides, randomUUID());
  }

  function sourceWith(repository: CertificateRepository) {
    return new OfficialDanfseSource(repository, storage, client);
  }

  it('busca o documento oficial quando ha certificado valido', async () => {
    const source = sourceWith(new StubCertificateRepository(certificateStub()));

    const result = await source.fetch(
      documentWith({ documentType: 'NFSE', accessKey: ACCESS_KEY }),
    );

    expect(result?.toString()).toContain('%PDF-oficial');
    expect(clientFetch).toHaveBeenCalledWith(
      expect.objectContaining({ accessKey: ACCESS_KEY }),
    );
  });

  /// ⚠️ O contrato inteiro do adapter: **nunca lança**. Se ele propagasse,
  /// qualquer problema de certificado ou de banco derrubaria a impressão de
  /// notas que o sistema gera sozinho, sem depender de certificado nenhum — o
  /// XML autorizado já está armazenado.
  describe('nunca lanca — sempre cai para o caminho local', () => {
    it('devolve null quando a nota nao tem chave de acesso', async () => {
      const source = sourceWith(
        new StubCertificateRepository(certificateStub()),
      );

      const result = await source.fetch(
        documentWith({ documentType: 'NFSE', accessKey: null }),
      );

      expect(result).toBeNull();
      expect(clientFetch).not.toHaveBeenCalled();
    });

    it('devolve null quando a empresa nao tem certificado', async () => {
      const source = sourceWith(new StubCertificateRepository(null));

      const result = await source.fetch(
        documentWith({ documentType: 'NFSE', accessKey: ACCESS_KEY }),
      );

      expect(result).toBeNull();
      expect(clientFetch).not.toHaveBeenCalled();
    });

    it('devolve null quando o certificado esta vencido', async () => {
      const source = sourceWith(
        new StubCertificateRepository(certificateStub(false)),
      );

      const result = await source.fetch(
        documentWith({ documentType: 'NFSE', accessKey: ACCESS_KEY }),
      );

      expect(result).toBeNull();
      expect(clientFetch).not.toHaveBeenCalled();
    });

    it('devolve null quando o repositorio de certificados explode', async () => {
      const source = sourceWith(new ExplodingCertificateRepository());

      await expect(
        source.fetch(
          documentWith({ documentType: 'NFSE', accessKey: ACCESS_KEY }),
        ),
      ).resolves.toBeNull();
    });

    it('devolve null quando a decifragem do certificado falha', async () => {
      jest
        .spyOn(keyLoader, 'loadCertificateKeyMaterial')
        .mockRejectedValue(new Error('PKCS#12 invalido'));
      const source = sourceWith(
        new StubCertificateRepository(certificateStub()),
      );

      await expect(
        source.fetch(
          documentWith({ documentType: 'NFSE', accessKey: ACCESS_KEY }),
        ),
      ).resolves.toBeNull();
    });

    it('devolve null quando o proprio cliente HTTP explode', async () => {
      // O cliente já engole os próprios erros, mas o adapter não pode depender
      // disso: são duas camadas, e a garantia precisa valer nas duas.
      clientFetch.mockRejectedValue(new Error('falha inesperada'));
      const source = sourceWith(
        new StubCertificateRepository(certificateStub()),
      );

      await expect(
        source.fetch(
          documentWith({ documentType: 'NFSE', accessKey: ACCESS_KEY }),
        ),
      ).resolves.toBeNull();
    });
  });
});
