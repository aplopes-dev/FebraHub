import { SignedXml } from 'xml-crypto';

/**
 * Assinatura XMLDSig de documentos fiscais. Portado de @citybox/fiscal-api
 * (xml-signer.ts). Mantém os dois perfis de algoritmo (MODERN e NFE_SEFAZ).
 */

/** Falha ao assinar o XML (chave/cert inválidos, XPath inexistente, etc.). */
export class ErroAssinaturaXml extends Error {
  constructor(detalhe: string) {
    super(`Falha ao assinar o XML: ${detalhe}`);
    this.name = 'ErroAssinaturaXml';
  }
}

/**
 * Perfis de algoritmo XMLDSig conhecidos. `MODERN` é o padrão (SHA-256,
 * Exclusive C14N, RSA-SHA256 — boa prática atual). `NFE_SEFAZ` é o perfil
 * exigido pelo schema oficial da NF-e (`xmldsig-core-schema_v1.01.xsd`): o XSD
 * **fixa** (`fixed=`) os atributos `Algorithm` em SHA-1/RSA-SHA1/C14N simples —
 * um requisito legado da própria SEFAZ. Qualquer NF-e assinada com o perfil
 * MODERN é rejeitada pela validação XSD real. Use `NFE_SEFAZ` só para NF-e/NFC-e;
 * outros documentos (NFS-e, futuros) usam o default MODERN.
 */
export type XmlSignatureAlgorithmProfile = 'MODERN' | 'NFE_SEFAZ';

type ResolvedAlgorithms = {
  signatureAlgorithm: string;
  canonicalizationAlgorithm: string;
  digestAlgorithm: string;
  referenceTransforms: string[];
};

const ALGORITHM_PROFILES: Record<
  XmlSignatureAlgorithmProfile,
  ResolvedAlgorithms
> = {
  MODERN: {
    signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
    canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
    referenceTransforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/2001/10/xml-exc-c14n#',
    ],
  },
  NFE_SEFAZ: {
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    canonicalizationAlgorithm:
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    referenceTransforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
  },
};

export type SignXmlInput = {
  xml: string;
  privateKeyPem: string;
  certificatePem: string;
  /**
   * XPath do elemento a assinar (enveloped signature) — ex.: para NF-e, o
   * elemento que carrega o atributo `Id` referenciado (`infNFe`).
   */
  referenceXPath: string;
  /**
   * XPath de onde inserir o nó `<Signature>` gerado — normalmente o elemento pai
   * de `referenceXPath`, com `action: "append"`.
   */
  signatureLocationXPath: string;
  /** @default 'MODERN' */
  algorithmProfile?: XmlSignatureAlgorithmProfile;
};

/**
 * Assina um XML com XMLDSig. Ver `XmlSignatureAlgorithmProfile` para a diferença
 * entre o perfil moderno (default) e o perfil legado exigido pela SEFAZ para
 * NF-e. `privateKeyPem`/`certificatePem` vêm do parser de PKCS#12, nunca da senha
 * em texto claro do certificado.
 */
export function signXml(input: SignXmlInput): string {
  const algorithms = ALGORITHM_PROFILES[input.algorithmProfile ?? 'MODERN'];

  try {
    const sig = new SignedXml({
      privateKey: input.privateKeyPem,
      publicCert: input.certificatePem,
      signatureAlgorithm: algorithms.signatureAlgorithm,
      canonicalizationAlgorithm: algorithms.canonicalizationAlgorithm,
    });

    sig.addReference({
      xpath: input.referenceXPath,
      transforms: algorithms.referenceTransforms,
      digestAlgorithm: algorithms.digestAlgorithm,
    });

    sig.computeSignature(input.xml, {
      location: { reference: input.signatureLocationXPath, action: 'append' },
    });

    return sig.getSignedXml();
  } catch (error) {
    throw new ErroAssinaturaXml((error as Error).message);
  }
}
