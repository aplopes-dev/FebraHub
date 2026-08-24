import { readFileSync } from 'fs';
import { join } from 'path';
import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  AuxiliaryDocumentRenderer,
  type RenderInput,
} from '../../domain/renderer.interface';
import {
  readNfseXml,
  type NfseDocumentData,
  type NfseAddress,
} from './nfse-xml.reader';
import { formatAccessKey, renderVerificationQrCode } from './barcode';
import {
  fieldsRow,
  textBlock,
  topicLine,
  vLine,
  outerFrame,
  ensureSpace,
  MARGIN,
  CONTENT_WIDTH,
  ROW_HEIGHT,
} from './danfse-layout';

/// URL de consulta pública do Padrão Nacional. Vai no QR Code para que o
/// tomador confira a nota sem digitar 50 dígitos.
const PUBLIC_LOOKUP_URL = 'https://www.nfse.gov.br/consultapublica?chave=';

/// Identidade visual nacional (FR-002). Asset oficial da NFS-e (gov.br/nfse).
///
/// ⚠️ Mora em `resources/`, lido via `process.cwd()` — o `nest build` compila
/// só TS para `dist/`, então arquivo não compilável fica em `resources/`
/// (copiado pelo Dockerfile) e é lido pelo diretório de trabalho.
const NATIONAL_LOGO_PATH = join(
  process.cwd(),
  'resources/brand/nfse-nacional-horizontal.png',
);
const LOGO_WIDTH = 118;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * 389) / 1920);
const HEADER_HEIGHT = 40;
const EMPTY = '';

/// Renderiza o **DANFSe v2.0** conforme o modelo oficial da NT 008/2026 (RTC
/// NT-008 v1.02, figura do leiaute).
///
/// **Implementação própria, ao contrário do DANFE** (research.md R3, spec 004):
/// para o DANFSE as opções de mercado são caixas-pretas sem repositório público.
///
/// ⚠️ Leiaute **sem grade de células**: os campos são rótulo + valor em colunas,
/// sem moldura por campo. A divisão é só **por tópico** (linha horizontal entre
/// seções) + célula-título cinza + moldura externa. Cabeçalho e rodapé têm
/// divisória entre as 3 colunas. Ordem das seções: cabeçalho → chave/QR +
/// identificação → PRESTADOR/FORNECEDOR → TOMADOR/ADQUIRENTE → DESTINATÁRIO DA
/// OPERAÇÃO → INTERMEDIÁRIO DA OPERAÇÃO → SERVIÇO PRESTADO → TRIBUTAÇÃO MUNICIPAL
/// (ISSQN) → TRIBUTAÇÃO FEDERAL (EXCETO CBS) → TRIBUTAÇÃO IBS/CBS → VALOR TOTAL
/// DA NFS-e → INFORMAÇÕES COMPLEMENTARES → rodapé (Nº/Chave). Células sem dado no
/// XML ficam em branco (spec 029 R3 — sem `0,00` fabricado).
@Injectable()
export class DanfseRenderer extends AuxiliaryDocumentRenderer {
  private readonly logger = new Logger(DanfseRenderer.name);
  private cachedLogo?: Buffer | null;

  async render(input: RenderInput): Promise<Buffer> {
    const data = readNfseXml(input.authorizedXml);
    const qrCode = await renderVerificationQrCode(
      `${PUBLIC_LOOKUP_URL}${data.accessKey}`,
    );

    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      info: {
        Title: `DANFSe ${data.accessKey}`,
        Author: data.provider.legalName,
        // Ancorada na emissão: sem isto o pdfkit semeia `new Date()` e deriva o
        // `/ID` dela, quebrando a reprodutibilidade byte a byte (FR-008).
        CreationDate: this.creationDate(data.issuedAt),
      },
    });

    const chunks: Buffer[] = [];
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const top = MARGIN;
    let y = this.drawHeader(doc, data);
    y = this.drawKeyBlock(doc, y, data, input, qrCode);
    y = this.topicSection(doc, y, (yy) =>
      this.drawPerson(doc, yy, 'Prestador / Fornecedor', {
        document: data.provider.cnpj,
        name: data.provider.legalName,
        municipalRegistration: data.provider.municipalRegistration,
        cityName: data.cityName,
        address: data.provider.address,
        contact: data.provider.contact,
        simplesNacional: data.provider.simplesNacional,
        taxRegimeSN: data.provider.taxRegimeSN,
      }),
    );
    y = this.topicSection(doc, y, (yy) =>
      this.drawPerson(doc, yy, 'Tomador / Adquirente', {
        document: data.customer.document,
        name: data.customer.name || 'NÃO IDENTIFICADO',
        municipalRegistration: data.customer.municipalRegistration,
        address: data.customer.address,
        contact: data.customer.contact,
      }),
    );
    y = this.topicSection(doc, y, (yy) =>
      this.drawPerson(doc, yy, 'Destinatário da Operação', {}),
    );
    y = this.topicSection(doc, y, (yy) =>
      this.drawPerson(
        doc,
        yy,
        'Intermediário da Operação',
        data.intermediary
          ? {
              document: data.intermediary.document,
              name: data.intermediary.name,
              address: data.intermediary.address,
              contact: data.intermediary.contact,
            }
          : {},
      ),
    );
    y = this.topicSection(doc, y, (yy) => this.drawService(doc, yy, data));
    y = this.topicSection(doc, y, (yy) => this.drawMunicipalTax(doc, yy, data));
    y = this.topicSection(doc, y, (yy) => this.drawFederalTax(doc, yy, data));
    y = this.topicSection(doc, y, (yy) => this.drawIbsCbs(doc, yy));
    y = this.topicSection(doc, y, (yy) => this.drawTotals(doc, yy, data));
    y = this.topicSection(doc, y, (yy) =>
      this.drawComplementary(doc, yy, data, input),
    );
    y = this.drawFooter(doc, y, data);

    outerFrame(doc, top, y);

    doc.end();
    return done;
  }

  /// Executa um tópico: separador horizontal + conteúdo. Retorna o `y` final.
  private topicSection(
    doc: PDFKit.PDFDocument,
    y: number,
    draw: (y: number) => number,
  ): number {
    topicLine(doc, y);
    return draw(y);
  }

  /// Cabeçalho: identidade nacional | título | município/ambiente, com 2
  /// divisórias verticais (é uma das exceções com colunas emolduradas).
  private drawHeader(doc: PDFKit.PDFDocument, data: NfseDocumentData): number {
    const y = MARGIN;
    const logoW = CONTENT_WIDTH * 0.28;
    const titleW = CONTENT_WIDTH * 0.44;
    const infoW = CONTENT_WIDTH - logoW - titleW;
    const bottom = y + HEADER_HEIGHT;

    vLine(doc, MARGIN + logoW, y, bottom);
    vLine(doc, MARGIN + logoW + titleW, y, bottom);

    const logo = this.loadNationalLogo();
    if (logo) {
      doc.image(
        logo,
        MARGIN + (logoW - LOGO_WIDTH) / 2,
        y + (HEADER_HEIGHT - LOGO_HEIGHT) / 2,
        { width: LOGO_WIDTH, height: LOGO_HEIGHT },
      );
    } else {
      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .fontSize(13)
        .text('NFS-e', MARGIN, y + 9, { width: logoW, align: 'center' })
        .font('Helvetica')
        .fontSize(6)
        .text('Padrão Nacional', MARGIN, y + 25, {
          width: logoW,
          align: 'center',
        });
    }

    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('DANFSe v2.0', MARGIN + logoW, y + 9, {
        width: titleW,
        align: 'center',
      })
      .font('Helvetica')
      .fontSize(7)
      .text('Documento Auxiliar da NFS-e', MARGIN + logoW, y + 24, {
        width: titleW,
        align: 'center',
      });

    const infoX = MARGIN + logoW + titleW + 4;
    doc
      .fillColor('#000000')
      .font('Helvetica')
      .fontSize(6.3)
      .text(`Município: ${data.cityName || EMPTY}`, infoX, y + 5, {
        width: infoW - 8,
        lineBreak: false,
        ellipsis: true,
      })
      .text('Ambiente Gerador: Sefin Nacional', infoX, y + 16, {
        width: infoW - 8,
        lineBreak: false,
        ellipsis: true,
      })
      .text('Tipo de Ambiente: Homologação', infoX, y + 27, {
        width: infoW - 8,
        lineBreak: false,
        ellipsis: true,
      });

    return bottom;
  }

  /// Bloco "Chave de Acesso da NFS-e": separador + título cinza + QR (direita,
  /// emoldurado) + identificação (esquerda, sem molduras). A chave de 50 dígitos
  /// vai no rodapé, como no modelo.
  private drawKeyBlock(
    doc: PDFKit.PDFDocument,
    y0: number,
    data: NfseDocumentData,
    input: RenderInput,
    qrCode: Buffer,
  ): number {
    topicLine(doc, y0);

    const qrWidth = CONTENT_WIDTH * 0.2;
    const leftWidth = CONTENT_WIDTH - qrWidth;
    const qrX = MARGIN + leftWidth;
    const titleH = 12;
    const blockHeight = titleH + ROW_HEIGHT * 3;
    const qrSize = Math.min(qrWidth - 12, 46);

    // QR emoldurado à direita (exceção emoldurada do modelo).
    vLine(doc, qrX, y0, y0 + blockHeight);
    doc.image(qrCode, qrX + (qrWidth - qrSize) / 2, y0 + 3, { width: qrSize });
    doc
      .fillColor('#333333')
      .font('Helvetica')
      .fontSize(3.5)
      .text(
        'A autenticidade desta NFS-e pode ser verificada pela leitura deste código QR ou pela consulta da chave de acesso no portal nacional da NFS-e.',
        qrX + 3,
        y0 + qrSize + 5,
        {
          width: qrWidth - 6,
          height: blockHeight - qrSize - 6,
          ellipsis: true,
        },
      );

    let y = fieldsRow(doc, y0, [{ title: 'Chave de Acesso da NFS-e' }], {
      x: MARGIN,
      width: leftWidth,
      height: titleH,
    });

    const situacao = input.isCancelled
      ? 'CANCELADA'
      : input.substitutedBy
        ? 'SUBSTITUÍDA'
        : 'AUTORIZADA';

    y = fieldsRow(
      doc,
      y,
      [
        { label: 'Número da NFS-e', value: data.nfseNumber || EMPTY },
        { label: 'Competência da NFS-e', value: data.competencia ?? EMPTY },
        {
          label: 'Data e Hora da Emissão da NFS-e',
          value: this.formatDate(data.issuedAt),
        },
      ],
      { x: MARGIN, width: leftWidth },
    );
    y = fieldsRow(
      doc,
      y,
      [
        { label: 'Número da DPS', value: data.dps?.number ?? EMPTY },
        { label: 'Série da DPS', value: data.dps?.series ?? EMPTY },
        {
          label: 'Data e Hora da Emissão da DPS',
          value: data.dps?.issuedAt
            ? this.formatDate(data.dps.issuedAt)
            : EMPTY,
        },
      ],
      { x: MARGIN, width: leftWidth },
    );
    y = fieldsRow(
      doc,
      y,
      [
        { label: 'Emitente da NFS-e', value: data.emitterType ?? EMPTY },
        { label: 'Situação da NFS-e', value: situacao },
        { label: 'Finalidade', value: EMPTY },
      ],
      { x: MARGIN, width: leftWidth },
    );

    return Math.max(y, y0 + blockHeight);
  }

  /// PRESTADOR / TOMADOR / DESTINATÁRIO / INTERMEDIÁRIO — mesmas linhas do
  /// modelo (a do Simples Nacional só no prestador).
  private drawPerson(
    doc: PDFKit.PDFDocument,
    y0: number,
    title: string,
    person: {
      document?: string;
      name?: string;
      municipalRegistration?: string;
      cityName?: string;
      address?: NfseAddress;
      contact?: { phone?: string; email?: string };
      simplesNacional?: boolean;
      taxRegimeSN?: string;
    },
  ): number {
    const isProvider = title.startsWith('Prestador');
    const rows = isProvider ? 4 : 3;
    let y = ensureSpace(doc, y0, ROW_HEIGHT * rows);
    const address = person.address;

    y = fieldsRow(doc, y, [
      { title },
      {
        label: 'CNPJ / CPF / NIF',
        value: person.document ? this.formatDocument(person.document) : EMPTY,
      },
      {
        label: 'Indicador Municipal (Inscrição)',
        value: person.municipalRegistration ?? EMPTY,
      },
      { label: 'Telefone', value: person.contact?.phone ?? EMPTY },
    ]);
    y = fieldsRow(doc, y, [
      {
        label: 'Nome / Nome Empresarial',
        value: person.name ?? EMPTY,
        weight: 2,
      },
      {
        label: 'Município / Sigla UF',
        value:
          [person.cityName, address?.uf].filter(Boolean).join(' / ') || EMPTY,
      },
      {
        label: 'Código IBGE / CEP',
        value:
          [address?.cityCode, address?.zipCode].filter(Boolean).join(' / ') ||
          EMPTY,
      },
    ]);
    y = fieldsRow(doc, y, [
      { label: '*Endereço', value: this.addressLine(address), weight: 2 },
      { label: 'E-mail', value: person.contact?.email ?? EMPTY, weight: 2 },
    ]);
    if (isProvider) {
      y = fieldsRow(doc, y, [
        {
          label: 'Simples Nacional na Data de Competência',
          value:
            person.simplesNacional === undefined
              ? EMPTY
              : person.simplesNacional
                ? 'Sim'
                : 'Não',
          weight: 2,
        },
        {
          label: 'Regime de Apuração Tributária pelo SN',
          value: person.taxRegimeSN ?? EMPTY,
          weight: 2,
        },
      ]);
    }
    return y;
  }

  private drawService(
    doc: PDFKit.PDFDocument,
    y0: number,
    data: NfseDocumentData,
  ): number {
    let y = ensureSpace(doc, y0, ROW_HEIGHT + 60);
    y = fieldsRow(doc, y, [
      { title: 'Serviço Prestado' },
      {
        label: 'Código de Tributação Nacional / Municipal',
        value: [data.service.nationalCode, data.service.municipalCode]
          .filter(Boolean)
          .join(' / '),
      },
      { label: 'Código da NBS', value: data.service.nbsCode ?? EMPTY },
      {
        label: 'Local da Prestação / Sigla UF / País',
        value: data.service.provisionCity ?? EMPTY,
      },
    ]);
    y = textBlock(
      doc,
      y,
      'Descrição do Código de Tributação Nacional / Municipal',
      EMPTY,
      { minHeight: 13, italicLabel: true },
    );
    return textBlock(doc, y, 'Descrição do Serviço', data.service.description, {
      minHeight: 46,
    });
  }

  private drawMunicipalTax(
    doc: PDFKit.PDFDocument,
    y0: number,
    data: NfseDocumentData,
  ): number {
    let y = ensureSpace(doc, y0, ROW_HEIGHT * 4);
    y = fieldsRow(doc, y, [
      { title: 'Tributação Municipal (ISSQN)' },
      {
        label: 'Tipo de Tributação do ISSQN',
        value: data.service.issTaxType ?? EMPTY,
      },
      {
        label: 'Município / Sigla UF / País de Incidência do ISSQN',
        value: data.service.incidenceCity ?? EMPTY,
        weight: 2,
      },
    ]);
    y = fieldsRow(doc, y, [
      { label: 'Regime Especial de Tributação do ISSQN' },
      { label: 'Tipo de Imunidade do ISSQN' },
      { label: 'Suspensão da Exigibilidade do ISSQN' },
      { label: 'Número Processo Suspensão' },
    ]);
    y = fieldsRow(doc, y, [
      { label: 'Benefício Municipal' },
      { label: 'Cálculo do BM' },
      {
        label: 'Total Deduções/Reduções',
        value: this.money(data.amounts.deductions),
      },
      {
        label: 'Desconto Incondicionado',
        value: this.money(data.amounts.discounts),
      },
    ]);
    y = fieldsRow(doc, y, [
      { label: 'BC ISSQN', value: this.money(data.amounts.calculationBase) },
      { label: 'Alíquota Aplicada', value: this.percent(data.service.issRate) },
      {
        label: 'Retenção do ISSQN',
        value: data.service.issWithheld ? 'Retido' : 'Não retido',
      },
      { label: 'ISSQN Apurado', value: this.money(data.service.issValue) },
    ]);
    return y;
  }

  private drawFederalTax(
    doc: PDFKit.PDFDocument,
    y0: number,
    data: NfseDocumentData,
  ): number {
    const fed = data.federalTaxes;
    let y = ensureSpace(doc, y0, ROW_HEIGHT * 2);
    y = fieldsRow(doc, y, [
      { title: 'Tributação Federal (exceto CBS)' },
      { label: 'IRRF', value: this.money(fed?.irrf) },
      {
        label: 'Contribuição Previdenciária - Retida',
        value: this.money(fed?.inss),
      },
      {
        label: 'Contribuições Sociais – Retidas',
        value: this.money(fed?.csll),
      },
    ]);
    y = fieldsRow(doc, y, [
      { label: 'PIS - Débito Apuração Própria', value: this.money(fed?.pis) },
      {
        label: 'COFINS - Débito Apuração Própria',
        value: this.money(fed?.cofins),
      },
      { label: 'Descrição Contrib. Sociais – Retidas', weight: 2 },
    ]);
    return y;
  }

  /// Reforma tributária — sem fonte no Padrão Nacional 1.01. Estrutura fixa do
  /// modelo, com valores em branco até haver emissão IBS/CBS.
  private drawIbsCbs(doc: PDFKit.PDFDocument, y0: number): number {
    let y = ensureSpace(doc, y0, ROW_HEIGHT * 4);
    y = fieldsRow(doc, y, [
      { title: 'Tributação IBS / CBS' },
      { label: 'CST / cClassTrib' },
      {
        label:
          'Indicador de Operação / Código IBGE Incidência / Município / Sigla UF',
        weight: 2,
      },
    ]);
    y = fieldsRow(doc, y, [
      { label: 'Exclusões e Reduções da Base de Cálculo' },
      { label: 'Base de Cálculo Após Exclusões e Reduções' },
      { label: 'Red. Alíquota IBS / Red. Alíquota CBS' },
      { label: 'Alíquota – IBS UF / IBS Mun' },
    ]);
    y = fieldsRow(doc, y, [
      { label: 'Alíq. Efetiva Municipal – IBS' },
      { label: 'Valor Apurado Municipal – IBS' },
      { label: 'Alíq. Efetiva Estadual – IBS' },
      { label: 'Valor Apurado Estadual – IBS' },
    ]);
    y = fieldsRow(doc, y, [
      { label: 'Valor Total Apurado – IBS' },
      { label: 'Alíquota - CBS' },
      { label: 'Alíquota Efetiva – CBS' },
      { label: 'Valor Total Apurado – CBS' },
    ]);
    return y;
  }

  private drawTotals(
    doc: PDFKit.PDFDocument,
    y0: number,
    data: NfseDocumentData,
  ): number {
    let y = ensureSpace(doc, y0, ROW_HEIGHT * 2);
    y = fieldsRow(doc, y, [
      { title: 'Valor Total da NFS-e' },
      {
        label: 'Valor da Operação / Serviço',
        value: this.money(data.service.totalValue),
      },
      {
        label: 'Desconto Incondicionado',
        value: this.money(data.amounts.discounts),
      },
      { label: 'Desconto Condicionado' },
    ]);
    y = fieldsRow(doc, y, [
      {
        label: 'Total das Retenções (ISSQN / Federais)',
        value: this.retentionTotal(data),
      },
      {
        label: 'VALOR LÍQUIDO DA NFS-e',
        value: this.money(data.amounts.netValue),
        valueSize: 8.5,
      },
      { label: 'Total do IBS/CBS' },
      { label: 'VALOR LÍQUIDO DA NFS-e + IBS/CBS' },
    ]);
    return y;
  }

  private drawComplementary(
    doc: PDFKit.PDFDocument,
    y0: number,
    data: NfseDocumentData,
    input: RenderInput,
  ): number {
    const lines: string[] = [];
    if (data.totals?.totalTaxes !== undefined) {
      lines.push(
        `Totais aproximados dos tributos (Lei 12.741/2012): ${this.money(
          data.totals.totalTaxes,
        )}`,
      );
    }
    if (data.totals?.approxTaxPercent !== undefined) {
      lines.push(
        `Percentual aproximado dos tributos: ${this.percent(
          data.totals.approxTaxPercent,
        )}`,
      );
    }
    if (input.substitutedBy) {
      lines.push(
        `NOTA SUBSTITUÍDA PELA NFS-e ${formatAccessKey(input.substitutedBy)}`,
      );
    }
    if (input.isCancelled) {
      lines.push('NOTA CANCELADA');
    }

    let y = ensureSpace(doc, y0, ROW_HEIGHT + 34);
    y = fieldsRow(doc, y, [{ title: 'Informações Complementares' }], {
      height: 12,
    });
    return textBlock(doc, y, EMPTY, lines.join('\n'), { minHeight: 34 });
  }

  /// Rodapé em 3 colunas com divisória (exceção emoldurada, como no modelo).
  private drawFooter(
    doc: PDFKit.PDFDocument,
    y0: number,
    data: NfseDocumentData,
  ): number {
    topicLine(doc, y0);
    const y = ensureSpace(doc, y0, ROW_HEIGHT);
    const colW = CONTENT_WIDTH / 4;
    vLine(doc, MARGIN + colW, y, y + ROW_HEIGHT);
    vLine(doc, MARGIN + colW * 2, y, y + ROW_HEIGHT);
    return fieldsRow(doc, y, [
      { label: 'Data de Cientificação' },
      { label: 'Identificação e Assinatura' },
      {
        label: 'Nº NFS-e / Chave da NFS-e',
        value: `${data.nfseNumber || EMPTY}  ${formatAccessKey(data.accessKey)}`,
        valueSize: 6,
        weight: 2,
      },
    ]);
  }

  private retentionTotal(data: NfseDocumentData): string {
    const fed = data.federalTaxes;
    const parts = [
      fed?.irrf,
      fed?.pis,
      fed?.cofins,
      fed?.csll,
      fed?.inss,
      data.service.issWithheld ? data.service.issValue : undefined,
    ].filter((value): value is number => value !== undefined);
    if (parts.length === 0) return EMPTY;
    return this.money(parts.reduce((sum, value) => sum + value, 0));
  }

  private addressLine(address: NfseAddress | undefined): string {
    if (!address) return EMPTY;
    return (
      [
        address.street,
        address.number && `nº ${address.number}`,
        address.complement,
        address.district,
      ]
        .filter((part): part is string => Boolean(part))
        .join(', ') || EMPTY
    );
  }

  private loadNationalLogo(): Buffer | null {
    if (this.cachedLogo === undefined) {
      try {
        this.cachedLogo = readFileSync(NATIONAL_LOGO_PATH);
      } catch (error: unknown) {
        this.cachedLogo = null;
        this.logger.warn(
          `Logo oficial da NFS-e não encontrado em ${NATIONAL_LOGO_PATH}; usando cabeçalho textual. ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    return this.cachedLogo;
  }

  private creationDate(issuedAt: string): Date {
    const parsed = new Date(issuedAt);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
  }

  private money(value: number | undefined): string {
    if (value === undefined) return EMPTY;
    return `R$ ${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private percent(value: number | undefined): string {
    return value === undefined ? EMPTY : `${value.toFixed(2)} %`;
  }

  private formatDocument(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 14) {
      return digits.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        '$1.$2.$3/$4-$5',
      );
    }
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return raw;
  }

  private formatDate(raw: string): string {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime())
      ? raw
      : parsed.toLocaleString('pt-BR', { timeZone: 'America/Bahia' });
  }
}
