import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { FiscalConfigService } from './fiscal-config.service';
import {
  DadosComprovante,
  EmitenteComprovante,
  montarComprovanteHtml,
} from './comprovante';

const jsonSeguro = <T>(v: T): T =>
  JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));

/**
 * Orquestra a emissao de cupom a partir de uma venda do PDV. O cupom NAO
 * fiscal (recibo) sai daqui direto. O cupom FISCAL (NFC-e) delega ao emissor
 * SVRS (fiscal-nfce.service) quando a config estiver pronta.
 */
@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: FiscalConfigService,
  ) {}

  private async emitente(): Promise<EmitenteComprovante> {
    const c = await this.config.obterConfig();
    const end = (c.endereco as Record<string, string> | null) ?? null;
    return {
      razaoSocial: c.razaoSocial,
      nomeFantasia: c.nomeFantasia,
      cnpj: c.cnpj,
      inscricaoEstadual: c.inscricaoEstadual,
      telefone: c.telefone,
      endereco: end
        ? {
            logradouro: end.logradouro,
            numero: end.numero,
            bairro: end.bairro,
            municipio: end.municipio,
            uf: c.uf,
            cep: end.cep,
          }
        : null,
    };
  }

  private async carregarVenda(vendaId: string) {
    const venda = await this.prisma.pdvVenda.findUnique({
      where: { id: vendaId },
      include: { itens: true, pagamentos: true },
    });
    if (!venda) throw new NotFoundException({ codigo: 'VENDA_NAO_ENCONTRADA', message: 'Venda nao encontrada.' });
    return venda;
  }

  private async dadosDeVenda(vendaId: string): Promise<DadosComprovante> {
    const [venda, emit] = await Promise.all([this.carregarVenda(vendaId), this.emitente()]);
    return {
      emitente: emit,
      numero: venda.numero,
      emitidoEm: venda.criadoEm,
      clienteNome: venda.clienteNome || null,
      clienteDoc: venda.clienteDocumento,
      itens: venda.itens.map((i) => ({
        descricao: i.descricao,
        quantidade: Number(i.quantidade),
        precoUnit: Number(i.precoUnit),
        total: Number(i.total),
      })),
      subtotal: Number(venda.subtotal),
      desconto: Number(venda.desconto),
      total: Number(venda.total),
      pagamentos: venda.pagamentos.map((p) => ({
        forma: p.formaPagamento,
        valor: Number(p.valor),
        bandeira: p.bandeira,
        parcelas: p.parcelas,
      })),
      operadorNome: venda.operadorNome,
      observacoes: venda.observacoes || null,
      fiscal: null,
    };
  }

  /**
   * Cupom NAO fiscal (recibo interno). Sem SEFAZ, sem certificado. Registra o
   * documento e devolve o HTML pronto para impressao.
   */
  async emitirNaoFiscal(vendaId: string, u: UsuarioLogado): Promise<{ documentoId: string; html: string }> {
    const dados = await this.dadosDeVenda(vendaId);
    const config = await this.config.obterConfig();

    const doc = await this.prisma.fiscalDocumento.create({
      data: {
        tipoDocumento: 'NAO_FISCAL',
        ambiente: config.ambiente,
        situacao: 'autorizado', // recibo interno nasce "pronto"
        vendaId,
        valorTotal: dados.total,
        clienteNome: dados.clienteNome,
        clienteDoc: dados.clienteDoc,
        emitidoPorId: u.id,
        emitidoPorNome: u.nome,
        autorizadoEm: new Date(),
      },
    });

    const html = montarComprovanteHtml(dados, 'bobina');
    return { documentoId: doc.id, html };
  }

  /**
   * Reimpressao / visualizacao de um documento ja emitido (fiscal ou nao).
   * Rebuild do HTML a partir da venda + do bloco fiscal persistido.
   */
  async reimprimir(documentoId: string, formato: 'bobina' | 'a4' = 'bobina'): Promise<string> {
    const doc = await this.prisma.fiscalDocumento.findUnique({ where: { id: documentoId } });
    if (!doc) throw new NotFoundException({ codigo: 'DOC_NAO_ENCONTRADO', message: 'Documento nao encontrado.' });
    if (!doc.vendaId) throw new BadRequestException({ codigo: 'SEM_VENDA', message: 'Documento sem venda de origem.' });

    const dados = await this.dadosDeVenda(doc.vendaId);
    if (doc.tipoDocumento === 'NFCE' && doc.chaveAcesso) {
      let qrDataUrl: string | null = null;
      if (doc.qrCode) {
        qrDataUrl = await QRCode.toDataURL(doc.qrCode, { margin: 1, width: 260 });
      }
      dados.fiscal = {
        chaveAcesso: doc.chaveAcesso,
        protocolo: doc.protocolo,
        serie: doc.serie ?? 1,
        numero: Number(doc.numero ?? 0),
        ambiente: doc.ambiente,
        qrCodeDataUrl: qrDataUrl,
        urlConsulta: doc.qrCode,
      };
    }
    return montarComprovanteHtml(dados, formato);
  }

  /** Lista de documentos fiscais emitidos (para a tela de historico). */
  async listar(tipo?: string, situacao?: string) {
    return jsonSeguro(
      await this.prisma.fiscalDocumento.findMany({
        where: { ...(tipo ? { tipoDocumento: tipo } : {}), ...(situacao ? { situacao } : {}) },
        orderBy: { criadoEm: 'desc' },
        take: 100,
        select: {
          id: true, tipoDocumento: true, ambiente: true, situacao: true,
          vendaId: true, serie: true, numero: true, chaveAcesso: true, protocolo: true,
          valorTotal: true, clienteNome: true, emitidoPorNome: true,
          codigoErro: true, mensagemErro: true, autorizadoEm: true, criadoEm: true,
        },
      }),
    );
  }

  async obter(documentoId: string) {
    const doc = await this.prisma.fiscalDocumento.findUnique({ where: { id: documentoId } });
    if (!doc) throw new NotFoundException({ codigo: 'DOC_NAO_ENCONTRADO', message: 'Documento nao encontrado.' });
    return jsonSeguro(doc);
  }
}
