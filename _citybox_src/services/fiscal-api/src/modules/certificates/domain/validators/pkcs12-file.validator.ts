import { InvalidCertificateFileError } from '../errors/invalid-certificate-file.error';

const MAX_BYTES = 10 * 1024 * 1024;

/// PKCS#12/.pfx é um container ASN.1 DER — sempre começa com a tag SEQUENCE
/// (0x30). Mesma técnica de assinatura binária de `DocumentFileValidator`
/// (imoveis-api) — o mime declarado pelo client não é confiável.
const DER_SEQUENCE_TAG = 0x30;

function extensionOf(filename: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
  return match ? match[1].toLowerCase() : '';
}

/// Valida o arquivo de certificado A1 por assinatura binária + extensão
/// ANTES de tentar o parse PKCS#12 completo (`parsePkcs12`, que já faz sua
/// própria validação criptográfica mais profunda — esta checagem é a
/// primeira linha de defesa, barata, contra uploads obviamente inválidos).
export class Pkcs12FileValidator {
  static readonly maxBytes = MAX_BYTES;

  static validate(buffer: Buffer, filename: string, context: string): void {
    if (!buffer?.length) {
      throw new InvalidCertificateFileError(context, 'empty');
    }
    if (buffer.length > MAX_BYTES) {
      throw new InvalidCertificateFileError(context, 'too_large');
    }
    if (buffer[0] !== DER_SEQUENCE_TAG) {
      throw new InvalidCertificateFileError(context, 'signature');
    }

    const extension = extensionOf(filename);
    if (extension !== 'pfx' && extension !== 'p12') {
      throw new InvalidCertificateFileError(context, 'extension');
    }
  }
}
