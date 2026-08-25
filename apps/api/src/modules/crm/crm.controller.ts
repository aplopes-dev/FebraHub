/**
 * Rotas do CRM (Setores → CRM). Classe inteira atrás de @ExigeSetor('crm'):
 * quem é do setor usa; admin/geral vê tudo, como nos demais módulos.
 * O achatamento de permissões da origem está documentado em
 * docs/INTEGRACAO_HUB_CRM.md — papéis granulares viraram a regra da casa.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ExigeSetor } from '../../common/guards/setor.guard';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { CrmService } from './crm.service';

/* ------------------------------- DTOs ------------------------------- */

class ClienteDto {
  @IsString() @MinLength(2) @MaxLength(160) nome!: string;
  @IsOptional() @IsIn(['pj', 'pf']) tipoPessoa?: string;
  @IsOptional() @IsIn(['lead', 'oportunidade', 'cliente_ativo', 'inativo', 'perdido']) estagio?: string;
  @IsOptional() @IsString() @MaxLength(30) documento?: string;
  @IsOptional() @IsString() @MaxLength(80) segmento?: string;
  @IsOptional() @IsString() @MaxLength(80) origem?: string;
  @IsOptional() @IsString() @MaxLength(40) telefone?: string;
  @IsOptional() @IsString() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MaxLength(200) site?: string;
  @IsOptional() @IsString() @MaxLength(80) instagram?: string;
  @IsOptional() @IsString() @MaxLength(120) cidade?: string;
  @IsOptional() @IsString() @MaxLength(2000) observacao?: string;
  @IsOptional() @IsUUID() responsavelId?: string;
}

class ClienteParcialDto extends ClienteDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) declare nome: string;
}

class ContatoDto {
  @IsString() @MinLength(2) @MaxLength(160) nome!: string;
  @IsOptional() @IsString() @MaxLength(80) cargo?: string;
  @IsOptional() @IsString() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MaxLength(40) telefone?: string;
  @IsOptional() @IsBoolean() principal?: boolean;
}

class AtividadeDto {
  @IsString() @MinLength(1) @MaxLength(2000) texto!: string;
  @IsOptional() @IsIn(['nota', 'ligacao', 'email', 'whatsapp']) tipo?: string;
}

class NegocioDto {
  @IsString() @MinLength(2) @MaxLength(180) titulo!: string;
  @IsUUID() clienteId!: string;
  @IsOptional() @IsUUID() funilId?: string;
  @IsOptional() @IsUUID() etapaId?: string;
  @IsOptional() @IsUUID() contatoId?: string;
  @IsOptional() @IsUUID() responsavelId?: string;
  @IsOptional() @IsInt() @Min(0) valorCentavos?: number;
}

class NegocioParcialDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) titulo?: string;
  @IsOptional() @IsInt() @Min(0) valorCentavos?: number;
  @IsOptional() @IsUUID() responsavelId?: string;
  @IsOptional() @IsUUID() contatoId?: string;
}

class MoverDto {
  @IsUUID() etapaId!: string;
  @IsOptional() @IsString() @MaxLength(300) motivoPerda?: string;
}

class TarefaDto {
  @IsString() @MinLength(2) @MaxLength(200) titulo!: string;
  @IsOptional() @IsIn(['ligacao', 'reuniao', 'follow_up']) tipo?: string;
  @IsOptional() @IsIn(['alta', 'media', 'baixa']) prioridade?: string;
  @IsOptional() @IsISO8601() venceEm?: string;
  @IsOptional() @IsUUID() negocioId?: string;
  @IsOptional() @IsUUID() clienteId?: string;
  @IsOptional() @IsUUID() responsavelId?: string;
}

class TarefaParcialDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) titulo?: string;
  @IsOptional() @IsIn(['ligacao', 'reuniao', 'follow_up']) tipo?: string;
  @IsOptional() @IsIn(['alta', 'media', 'baixa']) prioridade?: string;
  @IsOptional() @IsISO8601() venceEm?: string;
  @IsOptional() @IsUUID() responsavelId?: string;
}

class ConcluirDto {
  @IsOptional() @IsString() @MaxLength(500) resultado?: string;
}

class FunilDto {
  @IsString() @MinLength(2) @MaxLength(80) nome!: string;
  @IsOptional() @IsString() @MaxLength(20) cor?: string;
}
class FunilParcialDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) nome?: string;
  @IsOptional() @IsString() @MaxLength(20) cor?: string;
}
class EtapaDto {
  @IsString() @MinLength(2) @MaxLength(80) nome!: string;
  @IsOptional() @IsString() @MaxLength(20) cor?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) probabilidade?: number;
}
class EtapaParcialDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) nome?: string;
  @IsOptional() @IsString() @MaxLength(20) cor?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) probabilidade?: number;
  @IsOptional() @IsInt() @Min(0) ordem?: number;
}

class ListaClientesQuery {
  @IsOptional() @IsIn(['lead', 'oportunidade', 'cliente_ativo', 'inativo', 'perdido']) estagio?: string;
  @IsOptional() @IsString() @MaxLength(120) busca?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) pagina?: number;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(5) @Max(100) porPagina?: number;
}

/* ----------------------------- controller ----------------------------- */

@ApiTags('crm')
@Controller('crm')
@ExigeSetor('crm')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get('resumo')
  @ApiOperation({ summary: 'Visão geral: clientes por estágio, funil com valores, tarefas' })
  resumo() {
    return this.crm.resumo();
  }

  @Get('usuarios')
  @ApiOperation({ summary: 'Usuários ativos para selects de responsável' })
  usuarios() {
    return this.crm.usuarios();
  }

  @Get('funis')
  @ApiOperation({ summary: 'Funis ativos com etapas ordenadas' })
  funis() {
    return this.crm.funis();
  }

  @Post('funis')
  criarFunil(@Usuario() u: UsuarioLogado, @Body() dado: FunilDto, @Req() req: FastifyRequest) {
    return this.crm.criarFunil(u, dado, req.ip);
  }
  @Patch('funis/:id')
  atualizarFunil(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Body() dado: FunilParcialDto, @Req() req: FastifyRequest) {
    return this.crm.atualizarFunil(u, id, dado, req.ip);
  }
  @Delete('funis/:id')
  @HttpCode(204)
  removerFunil(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Req() req: FastifyRequest) {
    return this.crm.removerFunil(u, id, req.ip);
  }
  @Post('funis/:id/etapas')
  criarEtapa(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Body() dado: EtapaDto, @Req() req: FastifyRequest) {
    return this.crm.criarEtapa(u, id, dado, req.ip);
  }
  @Patch('etapas/:id')
  atualizarEtapa(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Body() dado: EtapaParcialDto, @Req() req: FastifyRequest) {
    return this.crm.atualizarEtapa(u, id, dado, req.ip);
  }
  @Delete('etapas/:id')
  @HttpCode(204)
  removerEtapa(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Req() req: FastifyRequest) {
    return this.crm.removerEtapa(u, id, req.ip);
  }

  /* clientes */

  @Get('clientes')
  @ApiOperation({ summary: 'Clientes/leads paginados (estagio + busca)' })
  clientes(@Query() q: ListaClientesQuery) {
    return this.crm.listarClientes({
      estagio: q.estagio,
      busca: q.busca,
      pagina: q.pagina ?? 1,
      porPagina: q.porPagina ?? 25,
    });
  }

  @Post('clientes')
  @ApiOperation({ summary: 'Cria cliente (nasce como lead por padrão)' })
  criarCliente(@Usuario() u: UsuarioLogado, @Req() req: FastifyRequest, @Body() dado: ClienteDto) {
    return this.crm.criarCliente(u, dado as never, req.ip);
  }

  @Get('clientes/:id')
  @ApiOperation({ summary: 'Cliente 360º: contatos, atividades, negócios, tarefas' })
  cliente(@Param('id', ParseUUIDPipe) id: string) {
    return this.crm.detalheCliente(id);
  }

  @Patch('clientes/:id')
  atualizarCliente(
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dado: ClienteParcialDto,
  ) {
    return this.crm.atualizarCliente(u, id, dado as never, req.ip);
  }

  @Delete('clientes/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove cliente sem negócios vinculados (auditado)' })
  async removerCliente(@Usuario() u: UsuarioLogado, @Req() req: FastifyRequest, @Param('id', ParseUUIDPipe) id: string) {
    await this.crm.removerCliente(u, id, req.ip);
  }

  @Post('clientes/:id/contatos')
  criarContato(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Body() dado: ContatoDto) {
    return this.crm.criarContato(u, id, dado);
  }

  @Delete('clientes/:id/contatos/:contatoId')
  @HttpCode(204)
  async removerContato(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contatoId', ParseUUIDPipe) contatoId: string,
  ) {
    await this.crm.removerContato(id, contatoId);
  }

  @Post('clientes/:id/atividades')
  criarAtividadeCliente(
    @Usuario() u: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dado: AtividadeDto,
  ) {
    return this.crm.criarAtividadeCliente(u, id, dado.texto);
  }

  /* negócios */

  @Get('negocios')
  @ApiOperation({ summary: 'Negócios (kanban usa ?abertos=1)' })
  negocios(
    @Query('funilId') funilId?: string,
    @Query('clienteId') clienteId?: string,
    @Query('abertos') abertos?: string,
  ) {
    return this.crm.listarNegocios({
      funilId: funilId || undefined,
      clienteId: clienteId || undefined,
      abertos: abertos === '1' || abertos === 'true' ? true : undefined,
    });
  }

  @Post('negocios')
  criarNegocio(@Usuario() u: UsuarioLogado, @Req() req: FastifyRequest, @Body() dado: NegocioDto) {
    return this.crm.criarNegocio(u, dado, req.ip);
  }

  @Get('negocios/:id')
  negocio(@Param('id', ParseUUIDPipe) id: string) {
    return this.crm.detalheNegocio(id);
  }

  @Patch('negocios/:id')
  atualizarNegocio(
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dado: NegocioParcialDto,
  ) {
    return this.crm.atualizarNegocio(u, id, dado, req.ip);
  }

  @Post('negocios/:id/mover')
  @ApiOperation({ summary: 'Move de etapa; ganha/perdida fecha (perder exige motivo)' })
  mover(
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dado: MoverDto,
  ) {
    return this.crm.moverNegocio(u, id, dado.etapaId, dado.motivoPerda, req.ip);
  }

  @Delete('negocios/:id')
  @HttpCode(204)
  async removerNegocio(@Usuario() u: UsuarioLogado, @Req() req: FastifyRequest, @Param('id', ParseUUIDPipe) id: string) {
    await this.crm.removerNegocio(u, id, req.ip);
  }

  @Post('negocios/:id/atividades')
  criarAtividadeNegocio(
    @Usuario() u: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dado: AtividadeDto,
  ) {
    return this.crm.criarAtividadeNegocio(u, id, dado.tipo ?? 'nota', dado.texto);
  }

  /* tarefas */

  @Get('tarefas')
  tarefas(@Query('abertas') abertas?: string, @Query('responsavelId') responsavelId?: string) {
    return this.crm.listarTarefas({
      abertas: abertas === '1' ? true : abertas === '0' ? false : undefined,
      responsavelId: responsavelId || undefined,
    });
  }

  @Post('tarefas')
  criarTarefa(@Usuario() u: UsuarioLogado, @Req() req: FastifyRequest, @Body() dado: TarefaDto) {
    return this.crm.criarTarefa(u, dado, req.ip);
  }

  @Post('tarefas/:id/concluir')
  concluir(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Body() dado: ConcluirDto) {
    return this.crm.concluirTarefa(u, id, dado.resultado);
  }

  @Post('tarefas/:id/reabrir')
  reabrir(@Param('id', ParseUUIDPipe) id: string) {
    return this.crm.reabrirTarefa(id);
  }

  @Patch('tarefas/:id')
  atualizarTarefa(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Body() dado: TarefaParcialDto, @Req() req: FastifyRequest) {
    return this.crm.atualizarTarefa(u, id, dado, req.ip);
  }

  @Delete('tarefas/:id')
  @HttpCode(204)
  removerTarefa(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Req() req: FastifyRequest) {
    return this.crm.removerTarefa(u, id, req.ip);
  }
}
