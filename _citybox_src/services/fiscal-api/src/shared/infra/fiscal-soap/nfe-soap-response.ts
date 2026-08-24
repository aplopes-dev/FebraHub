import * as libxmljs from 'libxmljs2';

/// Extrai o XML bruto de um elemento (por nome local, primeira ocorrência em
/// ordem de documento) e o serializa de volta para string — usado tanto para
/// desembrulhar o payload de negócio de dentro do wrapper genérico da SOAP
/// (`nfeResultMsg`) quanto para isolar sub-elementos aninhados (ex.:
/// `infProt` dentro de `protNFe`) antes de ler campos escalares com
/// `readElementText`, evitando XPaths ambíguos quando o mesmo nome de
/// elemento aparece em mais de um nível (ex.: `cStat`/`xMotivo` existem tanto
/// no lote quanto dentro de `infProt`).
export function extractElementXml(
  xml: string,
  localName: string,
): string | null {
  const doc = libxmljs.parseXml(xml);
  const node = doc.get(`//*[local-name()="${localName}"]`);
  return node ? node.toString() : null;
}

/// Extrai o XML bruto embutido dentro de um elemento wrapper genérico (ex.:
/// `nfeResultMsg`) de uma resposta SOAP — os webservices da SEFAZ (NFe/NFC-e/
/// CT-e/MDF-e, padrão nacional estável desde a versão 3.10) sempre embrulham
/// o payload de negócio real (`retEnviNFe`, `retConsSitNFe`, ...) dentro de um
/// elemento sem schema forte, então extraímos via XPath por nome local em vez
/// de confiar no parse tipado do `node-soap` (que não modela esse conteúdo).
export function extractWrappedElementXml(
  rawSoapResponseXml: string,
  wrapperLocalName: string,
): string | null {
  const doc = libxmljs.parseXml(rawSoapResponseXml);
  const [wrapper] = doc.find(`//*[local-name()="${wrapperLocalName}"]`);
  if (!wrapper) return null;

  const [innerElement] = wrapper.childNodes();
  return innerElement ? innerElement.toString() : null;
}

/// Lê o texto de um único elemento filho (por nome local) dentro do XML já
/// extraído (ex.: `cStat`, `xMotivo`, `nProt` dentro de `retEnviNFe` ou de um
/// sub-elemento já isolado via `extractElementXml`).
export function readElementText(xml: string, localName: string): string | null {
  const doc = libxmljs.parseXml(xml);
  const node = doc.get(`//*[local-name()="${localName}"]`);
  return node ? node.text() : null;
}
