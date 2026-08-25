import { readFileSync } from 'fs';
import { rootCertificates } from 'tls';
import { join } from 'path';

/**
 * Trust store ICP-Brasil para o TLS mútuo com a SEFAZ/SVRS. Portado de
 * @citybox/fiscal-api (sefaz-ca-bundle.ts).
 *
 * Cadeia ICP-Brasil (raiz + intermediária) usada para validar o certificado
 * APRESENTADO PELO SERVIDOR da SEFAZ — não confundir com o certificado A1 do
 * Emitente, que é a credencial do cliente no TLS mútuo.
 *
 * O bundle padrão do Node é a lista de raízes da Mozilla, que não inclui a
 * ICP-Brasil; e o servidor da SEFAZ envia apenas a folha e a intermediária. Sem
 * este arquivo o handshake falha com `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`.
 */

/** Bundle ICP-Brasil ausente no caminho configurado — erro de config local. */
export class SefazCaBundleNaoEncontrado extends Error {
  readonly path: string;
  constructor(path: string) {
    super(
      `Bundle ICP-Brasil não encontrado em "${path}". ` +
        'Coloque o arquivo icp-brasil.pem em resources/ca/ ou configure SEFAZ_CA_BUNDLE_PATH.',
    );
    this.name = 'SefazCaBundleNaoEncontrado';
    this.path = path;
  }
}

/**
 * Resolvido a cada chamada (não no load do módulo) para que a env valha mesmo
 * quando definida depois do import — o que também dispensa recarregar o módulo
 * nos testes. Sobrescrevível por env para deployments com layout diferente.
 */
export function resolveSefazCaBundlePath(): string {
  return (
    process.env.SEFAZ_CA_BUNDLE_PATH ??
    join(process.cwd(), 'resources/ca/icp-brasil.pem')
  );
}

let cached: { path: string; buffer: Buffer } | null = null;

/**
 * Lê o bundle uma única vez por caminho. Falha explícita e cedo: um bundle
 * ausente vira erro de configuração legível, não um `ENOENT` cru no meio de uma
 * tentativa de emissão.
 */
export function loadSefazCaBundle(): Buffer {
  const path = resolveSefazCaBundlePath();
  if (cached?.path === path) return cached.buffer;
  try {
    cached = { path, buffer: readFileSync(path) };
  } catch {
    throw new SefazCaBundleNaoEncontrado(path);
  }
  return cached.buffer;
}

/**
 * Só para testes — o cache é por processo e precisa ser derrubado quando o teste
 * troca `SEFAZ_CA_BUNDLE_PATH`.
 */
export function resetSefazCaBundleCache(): void {
  cached = null;
  cachedTrustStore = null;
}

let cachedTrustStore: string[] | null = null;

/**
 * Trust store **somado** ao padrão do Node, não substituto dele.
 *
 * Passar `ca` em `https.request` REPLACES a lista de raízes confiáveis — não
 * acrescenta. Usar só o bundle ICP-Brasil funciona para a SEFAZ-BA (servidor
 * assinado por AC Certisign ICP-Brasil), mas quebra contra CAs públicas, cujo
 * handshake falha com `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`.
 *
 * Combinar as duas listas é correto para ambos e não afrouxa nada: as raízes
 * públicas já seriam aceitas por padrão se `ca` não fosse passado.
 */
export function loadFiscalTrustStore(): string[] {
  if (cachedTrustStore) return cachedTrustStore;
  cachedTrustStore = [
    ...rootCertificates,
    loadSefazCaBundle().toString('utf-8'),
  ];
  return cachedTrustStore;
}
