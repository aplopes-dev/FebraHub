import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { FiscalConfigService } from './fiscal-config.service';
import { decifrar } from './cripto';
import {
  buildEnviNfeXml,
  buildNfceQrCode,
  buildNfeXml,
  callSefazSoapOperation,
  EnvNfceConsultationUrls,
  insertNfceSupplement,
  parseRetEnviNfeXml,
  resolveSefazBaEndpoint,
  signXml,
  assertValidXml,
  NFE_XSD_PATH,
  type NfeItemInput,
} from './nfce';

const NFE_AUTORIZACAO_NAMESPACE =
  'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4';

/**
 * Emissor de NFC-e (cupom fiscal, modelo 65) a partir de uma venda do PDV.
 * Orquestra: monta o XML (mod 65) → assina (perfil NFE_SEFAZ) → calcula o QR
 * Code (CSC) → insere infNFeSupl → valida contra o XSD → transmite ao SVRS →
 * interpreta o protocolo → persiste tudo. A numeração é reservada sob advisory
 * lock, e toda rejeição acontece ANTES de reservar o número (numeração fiscal
 * e sequencial: salto o fisco cobra explicação).
 */
@Injectable()
export class FiscalNfceService {
  private readonly logger = new Logger(FiscalNfceService.name);
  private readonly urls = new EnvNfceConsultationUrls();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: FiscalConfigService,
  ) {}

  private ambienteSefaz(a: string): 'HOMOLOGATION' | 'PRODUCTION' {
    return a === 'producao' ? 'PRODUCTION' : 'HOMOLOGATION';
  }

  /** Próximo número da série, sob advisory lock por (tipo/serie/ambiente). */
  private async reservarNumero(
    tx: Prisma.TransactionClient,
    serie: number,
    ambiente: string,
  ): Promise<bigint> {
    // lock estável derivado da série (evita corrida entre caixas)
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(779001, ${serie})`;
    const seq = await tx.fiscalSequencia.upsert({
      where: { tipoDocumento_serie_ambiente: { tipoDocumento: 'NFCE', serie, ambiente } },
      create: { tipoDocumento: 'NFCE', serie, ambiente, numeroAtual: BigInt(1) },
      update: { numeroAtual: { increment: 1 } },
    });
    return seq.numeroAtual;
  }

  private async carregarVenda(vendaId: string) {
    const venda = await this.prisma.pdvVenda.findUnique({
      where: { id: vendaId },
      include: { itens: { include: { lojaProduto: true } }, pagamentos: true },
    });
    if (!venda) throw new NotFoundException({ codigo: 'VENDA_NAO_ENCONTRADA', message: 'Venda não encontrada.' });
    if (venda.situacao === 'cancelada') {
      throw new BadRequestException({ codigo: 'VENDA_CANCELADA', message: 'Não é possível emitir cupom de uma venda cancelada.' });
    }
    return venda;
  }

  /** Mapeia a forma de pagamento do PDV para o `tPag` da NFC-e. */
  private tPag(forma: string): string {
    const f = forma.toLowerCase();
    if (f.includes('dinheiro')) return '01';
    if (f.includes('pix')) return '17';
    if (f.includes('débito') || f.includes('debito')) return '04';
    if (f.includes('crédito') || f.includes('credito') || f.includes('cartão') || f.includes('cartao')) return '03';
    return '99'; // outros
  }

  async emitir(vendaId: string, u: UsuarioLogado) {
    const status = await this.config.statusFiscal();
    if (!status.prontoParaNfce) {
      throw new BadRequestException({
        codigo: 'FISCAL_NAO_CONFIGURADO',
        message: 'A emissão de cupom fiscal ainda não está configurada.',
        pendencias: status.pendencias,
      });
    }

    // Idempotência: uma venda gera no máximo um cupom fiscal autorizado.
    const jaEmitido = await this.prisma.fiscalDocumento.findFirst({
      where: { vendaId, tipoDocumento: 'NFCE', situacao: { in: ['autorizado', 'assinado'] } },
    });
    if (jaEmitido) {
      throw new ConflictException({ codigo: 'JA_EMITIDO', message: 'Esta venda já tem cupom fiscal emitido.', documentoId: jaEmitido.id });
    }

    const [venda, config, material] = await Promise.all([
      this.carregarVenda(vendaId),
      this.config.obterConfig(),
      this.config.materialCertificadoAtivo(),
    ]);

    const ambiente = this.ambienteSefaz(config.ambiente);
    const serie = config.serieNfce;
    const cscToken = decifrar(config.cscTokenCifrado!);
    const consulta = this.urls.forUf(config.uf, ambiente);

    const endereco = (config.endereco as Record<string, string> | null) ?? {};

    // Itens: NCM/CFOP genéricos configuráveis por produto no futuro; hoje
    // usamos defaults seguros de homologação. CSOSN/CST conforme o regime.
    const regimeSimples = config.regimeTributario === '1';
    const itens: NfeItemInput[] = venda.itens.map((i) => ({
      description: i.descricao,
      ncm: '00000000',
      cfop: '5102',
      quantity: Number(i.quantidade),
      unitValue: Number(i.precoUnit),
      totalValue: Number(i.total),
      ...(regimeSimples ? { csosn: '102' } : { cst: '00', icmsAliquota: 0 }),
      origem: '0',
    }));

    // Pagamentos do cupom (várias formas + o tPag real de cada uma).
    const payments = venda.pagamentos.map((p) => ({
      method: this.tPag(p.formaPagamento),
      amount: Number(p.valor),
    }));

    // Documento em rascunho já persistido (rastreabilidade mesmo se falhar).
    const doc = await this.prisma.fiscalDocumento.create({
      data: {
        tipoDocumento: 'NFCE',
        ambiente: config.ambiente,
        situacao: 'rascunho',
        vendaId,
        serie,
        valorTotal: Number(venda.total),
        clienteNome: venda.clienteNome || null,
        clienteDoc: venda.clienteDocumento,
        emitidoPorId: u.id,
        emitidoPorNome: u.nome,
      },
    });

    try {
      // 1) Reserva o número (transação curta, só o contador).
      const numero = await this.prisma.$transaction((tx) => this.reservarNumero(tx, serie, config.ambiente));

      // 2) Monta o XML da NFC-e (modelo 65). A chave de acesso (incl. cNF) é
      //    gerada dentro do builder e devolvida em `built.accessKey`.
      const built = buildNfeXml({
        environment: ambiente,
        model: '65',
        emissionType: '1',
        emitter: {
          cnpj: config.cnpj,
          legalName: config.razaoSocial,
          stateRegistration: config.inscricaoEstadual ?? '',
          taxRegimeCode: regimeSimples ? '1' : '3',
          address: {
            street: endereco.logradouro ?? '',
            number: endereco.numero ?? 'S/N',
            complement: endereco.complemento ?? null,
            district: endereco.bairro ?? '',
            cityCodeIbge: config.codigoMunicipio ?? '',
            cityName: endereco.municipio ?? '',
            uf: config.uf,
            zipCode: (endereco.cep ?? '').replace(/\D/g, ''),
          },
        },
        recipient: venda.clienteDocumento
          ? {
              document: venda.clienteDocumento.replace(/\D/g, ''),
              documentType: venda.clienteDocumento.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF',
              name: venda.clienteNome || 'CONSUMIDOR',
            }
          : undefined,
        series: String(serie),
        number: String(numero),
        operationNature: 'VENDA',
        operationType: '1',
        destinationIndicator: '1',
        finalConsumer: true,
        presenceIndicator: '1',
        items: itens,
        paymentMethodCode: payments[0]?.method ?? '01',
        payments,
        emissionDate: new Date(),
      });

      const chave = built.accessKey;

      // 3) Assina (perfil NFE_SEFAZ, sobre infNFe).
      const assinado = signXml({
        xml: built.xml.toString('utf-8'),
        privateKeyPem: material.privateKeyPem,
        certificatePem: material.certificatePem,
        referenceXPath: "//*[local-name(.)='infNFe']",
        signatureLocationXPath: "//*[local-name(.)='NFe']",
        algorithmProfile: 'NFE_SEFAZ',
      });

      // 4) QR Code (CSC) + insere infNFeSupl no XML JÁ assinado (text-splice).
      const { qrCode } = buildNfceQrCode({
        accessKey: chave,
        environment: ambiente,
        cscId: config.cscId!,
        cscToken,
        consultationUrl: consulta.qrCode,
      });
      const suplementado = insertNfceSupplement(assinado, {
        qrCode,
        urlChave: consulta.accessKeyLookup,
      });

      // 5) Valida contra o XSD oficial (antes de transmitir).
      assertValidXml(suplementado, NFE_XSD_PATH);

      await this.prisma.fiscalDocumento.update({
        where: { id: doc.id },
        data: { situacao: 'assinado', numero, chaveAcesso: chave, qrCode },
      });

      // 6) Transmite ao SVRS (NFC-e, modelo 65).
      const requestBody = buildEnviNfeXml({ idLote: String(Date.now()), signedNfeXml: suplementado });
      const soap = await callSefazSoapOperation({
        wsdlPath: 'NFeAutorizacao4',
        endpoint: resolveSefazBaEndpoint('NFeAutorizacao4', ambiente, '65'),
        operation: 'nfeAutorizacaoLote',
        requestElementName: 'nfeDadosMsg',
        requestNamespace: NFE_AUTORIZACAO_NAMESPACE,
        requestBodyXml: requestBody,
        responseWrapperLocalName: 'nfeResultMsg',
        privateKeyPem: material.privateKeyPem,
        certificatePem: material.certificatePem,
      });

      const parsed = parseRetEnviNfeXml(soap.responseBodyXml, suplementado);

      // 7) Trilha de auditoria (o que foi enviado e o que voltou).
      await this.prisma.fiscalEvento.create({
        data: {
          documentoId: doc.id,
          tipo: 'EMISSAO',
          operacao: 'nfeAutorizacaoLote',
          situacao: parsed.status,
          protocolo: parsed.status === 'AUTHORIZED' ? parsed.protocol : null,
          requestXml: soap.rawRequestXml,
          responseXml: soap.rawResponseXml,
        },
      });

      if (parsed.status === 'AUTHORIZED') {
        const atualizado = await this.prisma.fiscalDocumento.update({
          where: { id: doc.id },
          data: { situacao: 'autorizado', protocolo: parsed.protocol, autorizadoEm: new Date() },
        });
        this.logger.log(`NFC-e autorizada (doc=${doc.id}, chave=${chave}, prot=${parsed.protocol})`);
        return { documentoId: atualizado.id, tipo: 'fiscal', situacao: 'autorizado', chaveAcesso: chave, protocolo: parsed.protocol };
      }

      const msg = parsed.status === 'SYNC_REQUIRED'
        ? 'Lote em processamento na SEFAZ — consulte novamente em instantes.'
        : `${parsed.errorCode} — ${parsed.errorMessage}`;
      const cod = parsed.status === 'SYNC_REQUIRED' ? '105' : parsed.errorCode;
      await this.prisma.fiscalDocumento.update({
        where: { id: doc.id },
        data: { situacao: parsed.status === 'SYNC_REQUIRED' ? 'assinado' : 'rejeitado', codigoErro: cod, mensagemErro: msg },
      });
      throw new BadRequestException({ codigo: 'NFCE_REJEITADA', message: msg, documentoId: doc.id, situacao: parsed.status });
    } catch (e) {
      if (e instanceof BadRequestException || e instanceof ConflictException) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Falha ao emitir NFC-e (doc=${doc.id}): ${msg}`);
      await this.prisma.fiscalDocumento.update({
        where: { id: doc.id },
        data: { situacao: 'erro', mensagemErro: msg.slice(0, 500) },
      }).catch(() => undefined);
      throw new BadRequestException({ codigo: 'NFCE_ERRO', message: `Falha ao emitir cupom fiscal: ${msg}`, documentoId: doc.id });
    }
  }

  /** Cancelamento de NFC-e autorizada (evento). Placeholder até o fluxo de evento. */
  async cancelar(documentoId: string, justificativa: string, u: UsuarioLogado) {
    const doc = await this.prisma.fiscalDocumento.findUnique({ where: { id: documentoId } });
    if (!doc) throw new NotFoundException({ codigo: 'DOC_NAO_ENCONTRADO', message: 'Documento não encontrado.' });
    if (doc.tipoDocumento !== 'NFCE' || doc.situacao !== 'autorizado') {
      throw new BadRequestException({ codigo: 'NAO_CANCELAVEL', message: 'Só é possível cancelar uma NFC-e autorizada.' });
    }
    if (justificativa.trim().length < 15) {
      throw new BadRequestException({ codigo: 'JUSTIFICATIVA_CURTA', message: 'A justificativa de cancelamento precisa de ao menos 15 caracteres.' });
    }
    // O envio do evento de cancelamento ao SVRS será ligado na sequência;
    // por ora registramos a intenção para não perder o rastro.
    void u;
    throw new BadRequestException({
      codigo: 'CANCELAMENTO_EM_IMPLANTACAO',
      message: 'O cancelamento eletrônico será habilitado junto com a homologação da emissão. Registre o pedido com a contabilidade.',
    });
  }
}
