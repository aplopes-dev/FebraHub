/**
 * Memória institucional (GBrain).
 *
 * A API é o único cliente do gbrain: o navegador nunca recebe token, e o
 * container do gbrain não publica porta no host. O que decide o alcance de
 * cada pessoa é a credencial OAuth provisionada para ela — as permissões
 * abaixo decidem só o que ela pode FAZER.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { BrainDadosService } from './brain-dados.service';
import { BrainMidiaService } from './brain-midia.service';
import { BrainService } from './brain.service';
import { SinteseService } from './sintese.service';

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

class ConsultaDto {
  @Transform(aparar)
  @IsString()
  @MinLength(2)
  @MaxLength(400)
  consulta!: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limite?: number;
}

class PerguntaDto {
  @Transform(aparar)
  @IsString()
  @MinLength(5)
  @MaxLength(600)
  pergunta!: string;
}

/** Modelos aceitos. Lista curta de propósito: cada um foi escolhido por
 *  custo-benefício, e campo livre convidaria a digitar id inexistente. */
export const MODELOS_SINTESE = ['gpt-5.6-luna', 'gpt-4o-mini', 'gpt-5.2'] as const;

class ConfiguracaoDto {
  /**
   * A chave em si. `null` remove e devolve a síntese ao modelo local.
   * Ausente = não mexe (a tela salva só o modelo sem reenviar a chave).
   */
  @IsOptional()
  @Transform(({ value }) => (value === null ? null : typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  chaveOpenai?: string | null;

  @IsOptional()
  @IsIn(MODELOS_SINTESE)
  modelo?: (typeof MODELOS_SINTESE)[number];
}

class PaginaDto {
  @Transform(aparar)
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  titulo!: string;

  /**
   * 400 mil caracteres ≈ um PDF de umas 150 páginas. O teto não é o do
   * gbrain (ele fatia o texto em chunks sozinho) — é o da nossa requisição:
   * acima disso o upload passa a valer mais como arquivo no MinIO do que
   * como página de conhecimento.
   */
  @Transform(aparar)
  @IsString()
  @MinLength(10)
  @MaxLength(400_000)
  conteudo!: string;

  /** Nome do arquivo de origem, quando a página veio de um documento. */
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(200)
  origem?: string;
}

class ConsolidacaoDto {
  @IsOptional()
  @IsBoolean()
  ativa?: boolean;

  /** HH:MM no fuso gravado (padrão America/Bahia). */
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,2}:\d{2}$/, { message: 'Use HH:MM' })
  hora?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  fuso?: string;
}

@ApiTags('brain')
@Controller('brain')
export class BrainController {
  constructor(
    private readonly brain: BrainService,
    private readonly dados: BrainDadosService,
    private readonly sintese: SinteseService,
    private readonly midias: BrainMidiaService,
  ) {}

  @Get('fontes')
  @ExigePermissao('brain.ver')
  @ApiOperation({ summary: 'As fontes que a sessão alcança, e onde ela escreve' })
  @ApiOkResponse({ description: '{ leitura, escrita }' })
  fontes(@Usuario() u: UsuarioLogado) {
    return { leitura: this.brain.fontesDe(u), escrita: this.brain.fonteDeEscritaDe(u) };
  }

  @Get('buscar')
  @ExigePermissao('brain.ver')
  @ApiOperation({ summary: 'Busca híbrida na memória, só nas fontes da pessoa' })
  buscar(@Usuario() u: UsuarioLogado, @Query() q: ConsultaDto) {
    return this.brain.buscar(u, q.consulta, q.limite);
  }

  @Post('perguntar')
  @ExigePermissao('brain.ver')
  @ApiOperation({ summary: 'Resposta sintetizada com citações' })
  perguntar(@Usuario() u: UsuarioLogado, @Body() dto: PerguntaDto) {
    return this.brain.perguntar(u, dto.pergunta);
  }

  @Get('pagina')
  @ExigePermissao('brain.ver')
  @ApiOperation({
    summary: 'Lê o conteúdo completo de um registro da memória (por slug)',
    description: 'Só devolve páginas das fontes que a sessão alcança.',
  })
  async lerPagina(
    @Usuario() u: UsuarioLogado,
    @Query('slug') slug: string,
  ) {
    const limpo = (slug ?? '').trim();
    if (limpo.length < 3 || limpo.length > 200 || limpo.includes('..')) {
      throw new BadRequestException({
        codigo: 'SLUG_INVALIDO',
        message: 'Identificador do registro inválido.',
      });
    }
    const pagina = await this.brain.lerPagina(u, limpo);
    if (!pagina) {
      throw new NotFoundException({
        codigo: 'PAGINA_NAO_ENCONTRADA',
        message: 'Registro não encontrado na memória (ou fora do seu alcance).',
      });
    }
    return {
      slug: pagina.slug,
      titulo: pagina.titulo,
      fonte: pagina.fonte,
      conteudo: pagina.trecho,
    };
  }

  @Post('paginas')
  @ExigePermissao('brain.enviar')
  @ApiOperation({
    summary: 'Registra uma página na fonte do próprio setor',
    description:
      'O texto chega pronto. Documento enviado pela tela é lido NO NAVEGADOR ' +
      '(pdfjs para PDF, leitura direta para md/txt/csv) e chega aqui como texto — ' +
      'a API não ganha um parser de PDF nem gasta CPU com isso.',
  })
  registrar(@Usuario() u: UsuarioLogado, @Body() dto: PaginaDto) {
    return this.brain.registrar(u, dto.titulo, dto.conteudo, dto.origem);
  }

  @Post('sincronizar-dados')
  @ExigePermissao('brain.gerenciar')
  @ApiOperation({
    summary: 'Publica os indicadores e retratos do sistema na memória',
    description:
      'Lê Hub Executivo + views de comercial/financeiro/marketing/pedagógico/' +
      'loja/eventos/CRM/diretoria e escreve páginas por setor. Também roda no cron.',
  })
  sincronizarDados(@Usuario() u: UsuarioLogado) {
    return this.dados.sincronizar(u);
  }

  @Get('consolidacao')
  @ExigePermissao('brain.gerenciar')
  @ApiOperation({ summary: 'Horário e estado da consolidação diária automática' })
  lerConsolidacao() {
    return this.dados.agendaAtual();
  }

  @Put('consolidacao')
  @ExigePermissao('brain.gerenciar')
  @ApiOperation({ summary: 'Define se/quando a memória reindexa os dados do dia' })
  salvarConsolidacao(@Usuario() u: UsuarioLogado, @Body() dto: ConsolidacaoDto) {
    return this.dados.salvarAgenda(dto, u.id);
  }

  @Post('midia')
  @ExigePermissao('brain.enviar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Envia áudio: transcreve (Whisper) e registra na memória do setor',
    description:
      'Campo `arquivo` (multipart). Requer chave OpenAI na configuração do brain. ' +
      'Documentos texto/PDF continuam sendo lidos no navegador via POST /brain/paginas.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { arquivo: { type: 'string', format: 'binary' } },
    },
  })
  async enviarMidia(@Req() req: FastifyRequest, @Usuario() u: UsuarioLogado) {
    const parte = await (
      req as unknown as { file: () => Promise<{ filename: string; mimetype: string; toBuffer: () => Promise<Buffer> } | undefined> }
    ).file();
    if (!parte) {
      throw new BadRequestException({ codigo: 'SEM_ARQUIVO', message: 'Envie um arquivo de áudio.' });
    }
    const conteudo = await parte.toBuffer();
    const extraido = await this.midias.transcrever({
      nome: parte.filename || 'audio.mp3',
      mime: parte.mimetype || 'audio/mpeg',
      conteudo,
    });
    return this.brain.registrar(u, extraido.titulo, extraido.texto, extraido.origem);
  }

  @Get('configuracao')
  @ExigePermissao('brain.gerenciar')
  @ApiOperation({
    summary: 'Motor de resposta: provedor, modelo e se há chave',
    description: 'A chave NUNCA sai daqui — a resposta diz apenas se existe uma.',
  })
  configuracao() {
    return this.sintese.configuracao();
  }

  @Put('configuracao')
  @ExigePermissao('brain.gerenciar')
  @ApiOperation({ summary: 'Grava a chave da OpenAI (cifrada) e o modelo de síntese' })
  salvarConfiguracao(@Usuario() u: UsuarioLogado, @Body() dto: ConfiguracaoDto) {
    return this.sintese.salvar(dto, u.id);
  }

  @Get('estado')
  @ExigePermissao('brain.gerenciar')
  @ApiOperation({ summary: 'Disponibilidade do serviço e volume por fonte' })
  estado() {
    return this.brain.estado();
  }

  @Post('revalidar-acessos')
  @ExigePermissao('brain.gerenciar')
  @ApiOperation({ summary: 'Reescopa as credenciais de todos contra o acesso atual' })
  revalidar() {
    return this.brain.revalidarAcessos();
  }
}
