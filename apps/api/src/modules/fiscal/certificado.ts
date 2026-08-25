/**
 * Parse de certificado A1 (PKCS#12 / .pfx) em memoria, extraindo a chave
 * privada (PEM), o certificado X.509 (PEM) e a validade. Portado de
 * @citybox/fiscal-api (pkcs12-parser.ts).
 *
 * Nunca persiste nem loga a senha — quem chama cifra antes de gravar. O CNPJ
 * do titular sai do CN no padrao ICP-Brasil e-CNPJ ("RAZAO SOCIAL:14DIGITOS").
 *
 * `node-forge` e dependencia opcional em runtime: se nao estiver instalada, o
 * import dinamico falha com mensagem clara em vez de quebrar o boot da API.
 */

export interface CertificadoLido {
  privateKeyPem: string;
  certificatePem: string;
  cnpjTitular: string | null;
  commonName: string | null;
  validoDe: Date;
  validoAte: Date;
}

export class CertificadoInvalido extends Error {
  constructor(detalhe: string) {
    super(`Certificado invalido: ${detalhe}`);
    this.name = 'CertificadoInvalido';
  }
}

function extrairCnpj(cn: string | null): string | null {
  if (!cn) return null;
  const m = cn.match(/(\d{14})(?!.*\d{14})/);
  return m ? m[1] : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let forgeCache: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function carregarForge(): Promise<any> {
  if (forgeCache) return forgeCache;
  try {
    // import dinamico: a dependencia so e exigida quando alguem sobe certificado
    forgeCache = await import('node-forge');
    return forgeCache.default ?? forgeCache;
  } catch {
    throw new CertificadoInvalido(
      'dependencia node-forge nao instalada no servidor — instale para habilitar upload de certificado',
    );
  }
}

export async function lerPkcs12(
  pfx: Buffer,
  senha: string,
): Promise<CertificadoLido> {
  const forge = await carregarForge();

  let asn1;
  try {
    const der = forge.util.createBuffer(pfx.toString('binary'));
    asn1 = forge.asn1.fromDer(der);
  } catch {
    throw new CertificadoInvalido('arquivo nao e um PKCS#12 (.pfx/.p12) valido');
  }

  let p12;
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, senha);
  } catch {
    throw new CertificadoInvalido('senha incorreta ou arquivo corrompido');
  }

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];

  if (!keyBag?.key || !certBag?.cert) {
    throw new CertificadoInvalido(
      'nao contem chave privada e/ou certificado X.509 validos',
    );
  }

  const cnField = certBag.cert.subject.getField('CN') as
    | { value?: string }
    | undefined;
  const cn = cnField?.value ?? null;

  return {
    privateKeyPem: forge.pki.privateKeyToPem(keyBag.key),
    certificatePem: forge.pki.certificateToPem(certBag.cert),
    cnpjTitular: extrairCnpj(cn),
    commonName: cn,
    validoDe: certBag.cert.validity.notBefore,
    validoAte: certBag.cert.validity.notAfter,
  };
}

/** So os digitos do CNPJ (para comparar com o cadastro do emitente). */
export function soDigitos(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '');
}
