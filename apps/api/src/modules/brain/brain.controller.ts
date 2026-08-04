/**
 * Memória institucional (GBrain).
 *
 * A API é o único cliente do gbrain: o navegador nunca recebe token, e o
 * container do gbrain não publica porta no host. O que decide o alcance de
 * cada pessoa é a credencial OAuth provisionada para ela — as permissões
 * abaixo decidem só o que ela pode FAZER.
 */
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { BrainService } from './brain.service';

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

class PaginaDto {
  @Transform(aparar)
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  titulo!: string;

  @Transform(aparar)
  @IsString()
  @MinLength(10)
  @MaxLength(20_000)
  conteudo!: string;
}

@ApiTags('brain')
@Controller('brain')
export class BrainController {
  constructor(private readonly brain: BrainService) {}

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

  @Post('paginas')
  @ExigePermissao('brain.enviar')
  @ApiOperation({ summary: 'Registra uma página na fonte do próprio setor' })
  registrar(@Usuario() u: UsuarioLogado, @Body() dto: PaginaDto) {
    return this.brain.registrar(u, dto.titulo, dto.conteudo);
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
