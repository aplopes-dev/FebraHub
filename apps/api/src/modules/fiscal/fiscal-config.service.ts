import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  cifrar,
  cifrarBinario,
  temChaveCifra,
} from './cripto';
import { CertificadoInvalido, lerPkcs12, soDigitos } from './certificado';
import {
  AtualizarFiscalConfigDto,
  DefinirCscDto,
  UploadCertificadoDto,
} from './fiscal.dto';

const CONFIG_ID = 1;

/**
 * Gerencia a configuracao fiscal do emitente (singleton), o certificado A1 e
 * o CSC. Tudo que e segredo (senha do cert, PFX, token do CSC) sai daqui
 * cifrado; nenhuma rota retorna esses campos em claro.
 */
@Injectable()
export class FiscalConfigService {
  private readonly logger = new Logger(FiscalConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Config atual (cria o singleton vazio na primeira leitura, se preciso). */
  async obterConfig() {
    const c = await this.prisma.fiscalConfig.findUnique({ where: { id: CONFIG_ID } });
    if (c) return c;
    return this.prisma.fiscalConfig.create({
      data: { id: CONFIG_ID, razaoSocial: 'Febracis', cnpj: '' },
    });
  }

  /** Versao publica: sem token do CSC, com flags de prontidao para a UI. */
  async statusFiscal() {
    const [config, cert] = await Promise.all([
      this.obterConfig(),
      this.prisma.fiscalCertificado.findFirst({
        where: { situacao: 'ativo' },
        orderBy: { criadoEm: 'desc' },
      }),
    ]);

    const agora = new Date();
    const certValido = cert ? cert.validoAte > agora && cert.validoDe <= agora : false;
    const temCsc = Boolean(config.cscId && config.cscTokenCifrado);

    const pendencias: string[] = [];
    if (!temChaveCifra()) pendencias.push('Chave de cifra (FISCAL_CERT_ENCRYPTION_KEY) nao configurada no servidor.');
    if (!config.cnpj) pendencias.push('CNPJ do emitente nao informado.');
    if (!config.inscricaoEstadual) pendencias.push('Inscricao Estadual nao informada.');
    if (!config.codigoMunicipio) pendencias.push('Codigo IBGE do municipio nao informado.');
    if (!cert) pendencias.push('Nenhum certificado digital A1 cadastrado.');
    else if (!certValido) pendencias.push('Certificado digital vencido ou fora da validade.');
    if (!temCsc) pendencias.push('CSC (Codigo de Seguranca do Contribuinte) nao cadastrado.');

    return {
      ambiente: config.ambiente,
      razaoSocial: config.razaoSocial,
      nomeFantasia: config.nomeFantasia,
      cnpj: config.cnpj,
      inscricaoEstadual: config.inscricaoEstadual,
      inscricaoMunicipal: config.inscricaoMunicipal,
      regimeTributario: config.regimeTributario,
      endereco: config.endereco,
      uf: config.uf,
      codigoMunicipio: config.codigoMunicipio,
      telefone: config.telefone,
      serieNfce: config.serieNfce,
      nfceHabilitada: config.nfceHabilitada,
      temChaveCifra: temChaveCifra(),
      temCsc,
      cscId: config.cscId ?? null,
      certificado: cert
        ? {
            id: cert.id,
            nome: cert.nome,
            cnpjTitular: cert.cnpjTitular,
            validoDe: cert.validoDe,
            validoAte: cert.validoAte,
            situacao: cert.situacao,
            valido: certValido,
          }
        : null,
      pendencias,
      prontoParaNfce: pendencias.length === 0,
    };
  }

  async atualizarConfig(dto: AtualizarFiscalConfigDto) {
    await this.obterConfig(); // garante o singleton
    const data: Record<string, unknown> = {};
    if (dto.ambiente !== undefined) data.ambiente = dto.ambiente;
    if (dto.razaoSocial !== undefined) data.razaoSocial = dto.razaoSocial;
    if (dto.nomeFantasia !== undefined) data.nomeFantasia = dto.nomeFantasia;
    if (dto.cnpj !== undefined) data.cnpj = soDigitos(dto.cnpj);
    if (dto.inscricaoEstadual !== undefined) data.inscricaoEstadual = soDigitos(dto.inscricaoEstadual);
    if (dto.inscricaoMunicipal !== undefined) data.inscricaoMunicipal = dto.inscricaoMunicipal;
    if (dto.regimeTributario !== undefined) data.regimeTributario = dto.regimeTributario;
    if (dto.endereco !== undefined) data.endereco = dto.endereco as object;
    if (dto.uf !== undefined) data.uf = dto.uf.toUpperCase();
    if (dto.codigoMunicipio !== undefined) data.codigoMunicipio = soDigitos(dto.codigoMunicipio);
    if (dto.telefone !== undefined) data.telefone = dto.telefone;
    if (dto.serieNfce !== undefined) data.serieNfce = dto.serieNfce;
    if (dto.nfceHabilitada !== undefined) data.nfceHabilitada = dto.nfceHabilitada;

    await this.prisma.fiscalConfig.update({ where: { id: CONFIG_ID }, data });
    return this.statusFiscal();
  }

  async definirCsc(dto: DefinirCscDto) {
    if (!temChaveCifra()) {
      throw new BadRequestException({
        codigo: 'CIFRA_NAO_CONFIGURADA',
        message: 'FISCAL_CERT_ENCRYPTION_KEY nao configurada no servidor.',
      });
    }
    await this.obterConfig();
    await this.prisma.fiscalConfig.update({
      where: { id: CONFIG_ID },
      data: { cscId: dto.cscId, cscTokenCifrado: cifrar(dto.cscToken) },
    });
    this.logger.log('CSC atualizado');
    return this.statusFiscal();
  }

  /**
   * Recebe o .pfx + senha, valida (parse real do PKCS#12), confere o CNPJ do
   * titular contra o emitente, cifra e guarda: PFX no MinIO cifrado, senha
   * cifrada no banco. Substitui o certificado ativo anterior.
   */
  async uploadCertificado(pfx: Buffer, dto: UploadCertificadoDto) {
    if (!temChaveCifra()) {
      throw new BadRequestException({
        codigo: 'CIFRA_NAO_CONFIGURADA',
        message: 'FISCAL_CERT_ENCRYPTION_KEY nao configurada no servidor.',
      });
    }
    if (!pfx?.length) {
      throw new BadRequestException({ codigo: 'ARQUIVO_VAZIO', message: 'Arquivo do certificado vazio.' });
    }

    let lido;
    try {
      lido = await lerPkcs12(pfx, dto.senha);
    } catch (e) {
      if (e instanceof CertificadoInvalido) {
        throw new BadRequestException({ codigo: 'CERT_INVALIDO', message: e.message });
      }
      throw e;
    }

    const config = await this.obterConfig();
    if (config.cnpj && lido.cnpjTitular && soDigitos(config.cnpj) !== lido.cnpjTitular) {
      throw new BadRequestException({
        codigo: 'CERT_CNPJ_DIVERGENTE',
        message: `O CNPJ do certificado (${lido.cnpjTitular}) nao confere com o do emitente (${soDigitos(config.cnpj)}).`,
      });
    }

    // Guarda o PFX cru cifrado no MinIO. Nunca vai em claro para lugar nenhum.
    const chave = this.storage.montarChave('fiscal/certificados', 'certificado.pfx.enc');
    const cifradoPfx = Buffer.from(cifrarBinario(pfx), 'utf8');
    await this.storage.upload(chave, cifradoPfx, 'application/octet-stream');

    // Um certificado ativo por vez: aposenta os anteriores.
    await this.prisma.fiscalCertificado.updateMany({
      where: { situacao: 'ativo' },
      data: { situacao: 'inativo' },
    });

    const cert = await this.prisma.fiscalCertificado.create({
      data: {
        nome: dto.nome ?? lido.commonName ?? 'Certificado A1',
        cnpjTitular: lido.cnpjTitular ?? soDigitos(config.cnpj),
        pfxObjectKey: chave,
        senhaCifrada: cifrar(dto.senha),
        validoDe: lido.validoDe,
        validoAte: lido.validoAte,
        situacao: 'ativo',
      },
    });
    this.logger.log(`Certificado cadastrado (id=${cert.id}, validoAte=${cert.validoAte.toISOString()})`);
    return this.statusFiscal();
  }

  /**
   * Material do certificado ativo em PEM (chave privada + certificado), para
   * assinar XML / abrir mTLS. Uso interno do emissor de NFC-e.
   */
  async materialCertificadoAtivo(): Promise<{ privateKeyPem: string; certificatePem: string }> {
    const cert = await this.prisma.fiscalCertificado.findFirst({
      where: { situacao: 'ativo' },
      orderBy: { criadoEm: 'desc' },
    });
    if (!cert) throw new NotFoundException({ codigo: 'SEM_CERTIFICADO', message: 'Nenhum certificado A1 ativo.' });
    const agora = new Date();
    if (cert.validoAte <= agora || cert.validoDe > agora) {
      throw new BadRequestException({ codigo: 'CERT_VENCIDO', message: 'Certificado fora da validade.' });
    }
    const { decifrar, decifrarBinario } = await import('./cripto');
    const cifradoPfx = (await this.storage.baixar(cert.pfxObjectKey)).toString('utf8');
    const pfx = decifrarBinario(cifradoPfx);
    const senha = decifrar(cert.senhaCifrada);
    return lerPkcs12(pfx, senha);
  }
}
