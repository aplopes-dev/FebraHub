/**
 * Núcleo de emissão de NFC-e (modelo 65) portado de @citybox/fiscal-api.
 * Re-exporta as funções públicas dos módulos deste diretório.
 */

// Chave de acesso (44 dígitos + DV módulo 11).
export {
  buildNfeAccessKey,
  type BuildAccessKeyInput,
  type BuiltAccessKey,
} from './access-key';

// Construção do XML da NF-e/NFC-e (layout 4.00).
export {
  buildNfeXml,
  toNfeDateTime,
  type BuildNfeXmlInput,
  type BuiltNfeXml,
  type FiscalModel,
  type EmissionType,
  type NfeAddress,
  type NfeEmitter,
  type NfeRecipient,
  type NfeItemInput,
  type NfePisCofinsInput,
  type NfeIpiInput,
  type NfeAdditionalInfo,
  type PisCofinsCst,
  type IpiCst,
} from './xml-builder';

// QR Code da NFC-e (SHA-1 + ordem de campos travada).
export {
  buildNfceQrCode,
  CscNaoConfigurado,
  QR_CODE_VERSION,
  type BuildNfceQrCodeInput,
  type QrCodeEnvironment,
  type OfflineQrCodeData,
} from './qr-code';

// Inserção do grupo infNFeSupl (QR Code + urlChave) no XML assinado.
export {
  insertNfceSupplement,
  NfceNaoAssinada,
  type NfceSupplement,
} from './supplement';

// Assinatura XMLDSig (perfis MODERN e NFE_SEFAZ).
export {
  signXml,
  ErroAssinaturaXml,
  type SignXmlInput,
  type XmlSignatureAlgorithmProfile,
} from './signer';

// Trust store ICP-Brasil para o TLS mútuo.
export {
  loadFiscalTrustStore,
  loadSefazCaBundle,
  resolveSefazCaBundlePath,
  resetSefazCaBundleCache,
  SefazCaBundleNaoEncontrado,
} from './ca-bundle';

// Cliente SOAP (HTTPS bruto + mTLS).
export {
  callSefazSoapOperation,
  extractWrappedElementXml,
  SefazIndisponivel,
  type SefazSoapCallInput,
  type SefazSoapCallResult,
} from './soap-client';

// Builders/parsers de envelopes de negócio (enviNFe, consulta, evento, inut).
export {
  buildEnviNfeXml,
  parseRetEnviNfeXml,
  buildConsultaProtocoloXml,
  parseRetConsSitNfeXml,
  buildConsStatServXml,
  parseRetConsStatServXml,
  buildNfeEventXml,
  buildEnvEventoXml,
  parseRetEnvEventoXml,
  buildInutNfeXml,
  parseRetInutNfeXml,
  type SefazProtocolResult,
  type SefazStatusServResult,
  type SefazEventResult,
  type SefazInutilizeResult,
  type NfeEventKind,
  type BuildNfeEventXmlInput,
  type BuildInutNfeXmlInput,
} from './soap-envelope';

// Roteamento de endpoints SEFAZ-BA (NF-e) / SVRS (NFC-e).
export {
  resolveSefazBaEndpoint,
  SefazAmbienteNaoConfigurado,
  NFE_AUTORIZACAO_WSDL_PATH,
  NFE_CONSULTA_PROTOCOLO_WSDL_PATH,
  NFE_RECEPCAO_EVENTO_WSDL_PATH,
  NFE_INUTILIZACAO_WSDL_PATH,
  type SefazOperation,
  type SefazFiscalModel,
} from './svrs-config';

// URLs de consulta pública da NFC-e (com limite de 85 chars do urlChave).
export {
  EnvNfceConsultationUrls,
  NfceConsultationUrls,
  NfceConsultationUrlNaoConfigurada,
  type NfceUrls,
} from './consultation-urls';

// Validação contra o XSD oficial da NF-e 4.00.
export {
  assertValidXml,
  validateXmlAgainstXsd,
  NFE_XSD_PATH,
  type XsdValidationResult,
} from './xsd-validator';
