import { InfrastructureError } from '../../../core/errors/infrastructure.error';

/// Erro de configuração, não de comunicação: a cadeia ICP-Brasil usada para
/// validar o certificado do servidor da SEFAZ não foi encontrada no caminho
/// esperado. Sem ela nenhuma transmissão é possível — melhor falhar com uma
/// mensagem que aponta o arquivo do que deixar o handshake estourar
/// `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, que não diz o que fazer.
export class SefazCaBundleNotFoundError extends InfrastructureError {
  constructor(bundlePath: string) {
    super({
      internalMessage: `Bundle de CA da ICP-Brasil não encontrado em "${bundlePath}" — verifique resources/ca/icp-brasil.pem ou a env SEFAZ_CA_BUNDLE_PATH`,
      externalMessage:
        'Serviço fiscal não está configurado para comunicar com o órgão fiscal.',
      context: 'SefazCaBundle',
    });
  }
}
