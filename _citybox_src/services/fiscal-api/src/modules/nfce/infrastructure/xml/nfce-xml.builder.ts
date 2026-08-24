import { InfrastructureError } from '../../../../shared/core/errors/infrastructure.error';

/// XML entregue sem `<Signature>`.
///
/// Existe como erro porque o modo de falha alternativo é devolver o XML
/// intacto: cupom transmitido **sem QR Code**, autorizado pela SEFAZ, e
/// inconsultável pelo consumidor — a falha silenciosa que a spec 005 inteira
/// existe para evitar.
export class NfceNotSignedError extends InfrastructureError {
  constructor(context: string) {
    super({
      internalMessage:
        'Cannot insert infNFeSupl: the XML has no <Signature> element',
      externalMessage:
        'Falha ao montar o cupom fiscal: o documento não foi assinado antes da inclusão do QR Code.',
      context,
    });
  }
}

export type NfceSupplement = {
  /// Conteúdo textual do QR Code — ver `domain/qr-code.ts`.
  qrCode: string;
  /// URL da "Consulta por chave de acesso da NFC-e". ⚠️ **Não é a mesma** URL
  /// do QR Code: o XSD define os dois elementos separadamente, e a mesma
  /// `urlChave` precisa aparecer impressa no cupom para consulta manual.
  urlChave: string;
};

/// Abertura de `<Signature>`, em qualquer prefixo de namespace.
///
/// A classe final inclui `/` para casar também a forma autofechada
/// (`<Signature/>`). O `xml-crypto` sempre emite o elemento completo, mas a
/// omissão fazia o guard **recusar um XML que tem assinatura** — e o erro
/// resultante ("não foi assinado") apontaria para o lugar errado.
const SIGNATURE_OPEN = /<(?:\w+:)?Signature[\s/>]/;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/// Insere `infNFeSupl` num XML de NFC-e **já assinado**.
///
/// ⚠️ **Por que manipulação de texto e não DOM** — é a decisão que sustenta
/// este arquivo, e parece errada até se entender o motivo:
///
/// A assinatura cobre `infNFe` e o digest é calculado sobre a forma canônica
/// **daqueles bytes**. Reserializar o documento por um DOM (`xmldom`,
/// `xmlbuilder2`) reescreve espaçamento, ordem de atributos e declarações de
/// namespace — mudanças invisíveis a olho nu que **quebram o digest**. E
/// quebram em silêncio: o XML continua bem-formado, continua validando contra
/// o XSD, e só a SEFAZ recusa, com um código de rejeição que não diz "seu
/// serializador mexeu no XML".
///
/// Inserir uma fatia de texto num offset deixa cada byte de `infNFe` intocado.
/// O teste que prova isso é o `checkSignature` da suíte — nenhuma outra
/// asserção pegaria a diferença.
///
/// A posição também é obrigatória: `TNFe` é `xs:sequence` com
/// `infNFe, infNFeSupl?, Signature`, então o grupo entra **antes** de
/// `<Signature>`. Como o signer anexa a assinatura ao fim de `NFe`, "antes de
/// Signature" e "depois de infNFe" são o mesmo ponto.
export function insertNfceSupplement(
  signedXml: string,
  supplement: NfceSupplement,
): string {
  const match = SIGNATURE_OPEN.exec(signedXml);
  if (!match) {
    throw new NfceNotSignedError('insertNfceSupplement');
  }

  const at = match.index;
  const group =
    `<infNFeSupl>` +
    `<qrCode>${escapeXml(supplement.qrCode)}</qrCode>` +
    `<urlChave>${escapeXml(supplement.urlChave)}</urlChave>` +
    `</infNFeSupl>`;

  return `${signedXml.slice(0, at)}${group}${signedXml.slice(at)}`;
}
