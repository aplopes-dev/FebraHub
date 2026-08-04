/**
 * Redes sociais (Zernio).
 *
 * A API é o único cliente do Zernio: o navegador nunca recebe a chave, e o
 * que chega à tela já vem traduzido (ver social.tipos.ts).
 *
 * O RECORTE AQUI NÃO É POR SETOR — e isso é deliberado. A conta do Zernio é
 * uma só, das redes oficiais da Febracis Salvador; não existe "o Instagram do
 * financeiro". Então quem decide o acesso são as três permissões: ver,
 * publicar/responder e configurar.
 */
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { SocialConfigService } from './social-config.service';
import { SocialService } from './social.service';

const aparar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const opcional = ({ value }: { value: unknown }) =>
  value === null ? null : typeof value === 'string' ? value.trim() : value;

class DestinoDto {
  @Transform(aparar)
  @IsString()
  @MaxLength(40)
  rede!: string;

  @Transform(aparar)
  @IsString()
  @MaxLength(80)
  contaId!: string;
}

class MidiaDto {
  @Transform(aparar)
  @IsString()
  @IsIn(['image', 'video', 'gif', 'document'])
  tipo!: string;

  @Transform(aparar)
  @IsString()
  @MaxLength(2000)
  url!: string;
}

class PublicarDto {
  /**
   * 5.000 caracteres cobre a rede mais generosa com folga. O limite REAL é por
   * rede (X corta em 280) e quem o aplica é o Zernio, na hora — a tela mostra
   * o contador e o erro dele volta com o motivo.
   */
  @Transform(aparar)
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  conteudo!: string;

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(160)
  titulo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DestinoDto)
  destinos!: DestinoDto[];

  /** Ausente = publica agora. Presente = agenda. */
  @IsOptional()
  @IsISO8601()
  agendadaPara?: string;

  @IsOptional()
  @IsBoolean()
  rascunho?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MidiaDto)
  midia?: MidiaDto[];
}

class ListarPostagensDto {
  @IsOptional()
  @IsIn(['draft', 'scheduled', 'published', 'failed'])
  status?: string;

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(40)
  rede?: string;

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(120)
  busca?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  pagina?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limite?: number;
}

class AnaliseDto {
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(40)
  rede?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  de?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  ate?: string;

  @IsOptional()
  @IsIn(['date', 'engagement', 'impressions', 'reach', 'likes', 'comments', 'shares', 'views'])
  ordenarPor?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limite?: number;
}

class ConversasDto {
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(40)
  rede?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limite?: number;
}

class MensagensDto {
  @Transform(aparar)
  @IsString()
  @MaxLength(120)
  contaId!: string;
}

class ResponderDto {
  @Transform(aparar)
  @IsString()
  @MaxLength(120)
  contaId!: string;

  @Transform(aparar)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  mensagem!: string;
}

class CampanhasDto {
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(40)
  rede?: string;

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(80)
  contaAnuncio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  de?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  ate?: string;
}

class StatusCampanhaDto {
  @IsIn(['active', 'paused'])
  status!: 'active' | 'paused';

  @Transform(aparar)
  @IsString()
  @MaxLength(40)
  rede!: string;
}

class ConfiguracaoDto {
  /** `null` desliga a integração. Ausente = não mexe na chave. */
  @IsOptional()
  @Transform(opcional)
  @IsString()
  @MaxLength(200)
  chaveZernio?: string | null;

  @IsOptional()
  @Transform(opcional)
  @IsString()
  @MaxLength(120)
  perfilZernio?: string | null;

  @IsOptional()
  @Transform(opcional)
  @IsString()
  @MaxLength(80)
  contaAnuncio?: string | null;

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(60)
  fuso?: string;
}

@ApiTags('social')
@Controller('social')
export class SocialController {
  constructor(
    private readonly social: SocialService,
    private readonly config: SocialConfigService,
  ) {}

  @Get('visao-geral')
  @ExigePermissao('social.ver')
  @ApiOperation({ summary: 'Contas, audiência, publicações do mês e conversas abertas' })
  @ApiOkResponse({ description: 'O cabeçalho do painel, em uma ida só' })
  visaoGeral() {
    return this.social.visaoGeral();
  }

  @Get('contas')
  @ExigePermissao('social.ver')
  @ApiOperation({ summary: 'Contas conectadas no Zernio, publicação e anúncios' })
  contas() {
    return this.social.contas();
  }

  @Get('postagens')
  @ExigePermissao('social.ver')
  @ApiOperation({ summary: 'Postagens por status e por rede, mais recentes primeiro' })
  postagens(@Query() q: ListarPostagensDto) {
    return this.social.postagens(q);
  }

  @Post('postagens')
  @ExigePermissao('social.publicar')
  @ApiOperation({
    summary: 'Publica agora, agenda ou salva rascunho',
    description:
      'Sem `agendadaPara` e sem `rascunho`, publica imediatamente. O limite de ' +
      'caracteres de cada rede é aplicado pelo Zernio e volta como erro com o motivo.',
  })
  publicar(@Body() dto: PublicarDto) {
    return this.social.publicar(dto);
  }

  @Delete('postagens/:id')
  @ExigePermissao('social.publicar')
  @ApiOperation({ summary: 'Apaga uma postagem (agendada ou rascunho)' })
  apagar(@Param('id') id: string) {
    return this.social.apagarPostagem(id);
  }

  @Post('postagens/:id/reenviar')
  @ExigePermissao('social.publicar')
  @ApiOperation({ summary: 'Tenta de novo uma postagem que falhou' })
  reenviar(@Param('id') id: string) {
    return this.social.reenviarPostagem(id);
  }

  @Get('analise')
  @ExigePermissao('social.ver')
  @ApiOperation({
    summary: 'Desempenho das postagens publicadas',
    description:
      'Métrica ausente volta como null, nunca zero: o Zernio só entrega ' +
      'engajamento com o add-on de analytics, e zero seria mentira sobre alcance.',
  })
  analise(@Query() q: AnaliseDto) {
    return this.social.analise(q);
  }

  @Get('conversas')
  @ExigePermissao('social.ver')
  @ApiOperation({ summary: 'Caixa de entrada unificada (DMs) das redes que a suportam' })
  conversas(@Query() q: ConversasDto) {
    return this.social.conversas(q);
  }

  @Get('conversas/:id/mensagens')
  @ExigePermissao('social.ver')
  @ApiOperation({ summary: 'Mensagens de uma conversa, da mais antiga para a mais nova' })
  mensagens(@Param('id') id: string, @Query() q: MensagensDto) {
    return this.social.mensagens(id, q.contaId);
  }

  @Post('conversas/:id/mensagens')
  @ExigePermissao('social.publicar')
  @ApiOperation({ summary: 'Responde a mensagem direta' })
  responder(@Param('id') id: string, @Body() dto: ResponderDto) {
    return this.social.responder(id, dto.contaId, dto.mensagem);
  }

  @Get('campanhas')
  @ExigePermissao('social.ver')
  @ApiOperation({
    summary: 'Campanhas pagas com métricas do período (Meta e demais)',
    description:
      'O total do período recalcula CTR, CPC, CPM e ROAS a partir dos ' +
      'somatórios — média de médias não é média.',
  })
  campanhas(@Query() q: CampanhasDto) {
    return this.social.campanhas(q);
  }

  @Put('campanhas/:id/status')
  @ExigePermissao('social.gerenciar')
  @ApiOperation({ summary: 'Pausa ou reativa uma campanha' })
  statusCampanha(@Param('id') id: string, @Body() dto: StatusCampanhaDto) {
    return this.social.statusCampanha(id, dto.rede, dto.status);
  }

  @Get('configuracao')
  @ExigePermissao('social.ver')
  @ApiOperation({
    summary: 'Estado da integração: se há chave, perfil e conta de anúncios',
    description: 'A chave NUNCA sai daqui — a resposta traz só os 4 últimos caracteres.',
  })
  configuracao() {
    return this.config.configuracao();
  }

  @Put('configuracao')
  @ExigePermissao('social.gerenciar')
  @ApiOperation({ summary: 'Grava a chave do Zernio (cifrada) e as preferências' })
  salvarConfiguracao(@Usuario() u: UsuarioLogado, @Body() dto: ConfiguracaoDto) {
    return this.config.salvar(dto, u.id);
  }

  @Post('testar')
  @ExigePermissao('social.gerenciar')
  @ApiOperation({ summary: 'Confere se a chave gravada é aceita pelo Zernio' })
  testar() {
    return this.social.testar();
  }
}
