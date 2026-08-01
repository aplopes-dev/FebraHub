import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ArquivosService } from './arquivos.service';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';

@ApiTags('arquivos')
@Controller('arquivos')
export class ArquivosController {
  constructor(private readonly arquivos: ArquivosService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Envia um arquivo para o MinIO',
    description:
      'O conteúdo é conferido pelos bytes, não pela extensão nem pelo ' +
      'Content-Type declarado. Campos opcionais: pasta, vinculo_tipo, vinculo_id.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        arquivo: { type: 'string', format: 'binary' },
        pasta: { type: 'string', example: 'avaliacoes' },
        vinculo_tipo: { type: 'string', example: 'fato_avaliacao' },
        vinculo_id: { type: 'string', example: '42' },
      },
    },
  })
  async enviar(@Req() req: FastifyRequest, @Usuario() u: UsuarioLogado) {
    const parte = await (req as unknown as { file: () => Promise<MultipartFile | undefined> }).file();
    if (!parte) {
      throw new BadRequestException({ codigo: 'SEM_ARQUIVO', message: 'Envie um arquivo' });
    }
    const conteudo = await parte.toBuffer();
    const campos = parte.fields ?? {};
    return this.arquivos.enviar(
      {
        nomeOriginal: parte.filename,
        mimeDeclarado: parte.mimetype,
        conteudo,
      },
      {
        pasta: valorDe(campos.pasta),
        vinculoTipo: valorDe(campos.vinculo_tipo),
        vinculoId: valorDe(campos.vinculo_id),
      },
      u,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lista arquivos, com paginação' })
  @ApiQuery({ name: 'pasta', required: false })
  @ApiQuery({ name: 'vinculo_tipo', required: false })
  @ApiQuery({ name: 'vinculo_id', required: false })
  @ApiQuery({ name: 'pagina', required: false, example: 1 })
  @ApiQuery({ name: 'por_pagina', required: false, example: 50 })
  async listar(
    @Query('pasta') pasta?: string,
    @Query('vinculo_tipo') vinculoTipo?: string,
    @Query('vinculo_id') vinculoId?: string,
    @Query('pagina') pagina = '1',
    @Query('por_pagina') porPagina = '50',
  ) {
    return this.arquivos.listar({
      pasta,
      vinculoTipo,
      vinculoId,
      pagina: Math.max(1, Number(pagina) || 1),
      porPagina: Math.min(200, Math.max(1, Number(porPagina) || 50)),
    });
  }

  @Get(':id/url')
  @ApiOperation({
    summary: 'URL assinada de download',
    description: 'Vale poucos minutos. Link de download não é permissão permanente.',
  })
  async url(@Param('id') id: string, @Query('segundos') segundos = '300') {
    const url = await this.arquivos.urlAssinada(id, Number(segundos) || 300);
    return { url, expira_em_segundos: Math.min(Math.max(Number(segundos) || 300, 30), 3600) };
  }

  @Get(':id/conteudo')
  @ApiOperation({ summary: 'Baixa o arquivo pela própria API' })
  async baixar(@Param('id') id: string, @Res() res: FastifyReply) {
    const r = await this.arquivos.baixar(id);
    if (!r) throw new NotFoundException({ codigo: 'ARQUIVO_NAO_ENCONTRADO', message: 'Arquivo não encontrado' });
    void res
      .header('Content-Type', r.mime)
      .header('Content-Length', String(r.conteudo.length))
      // filename entre aspas e sem quebra: nome de arquivo é dado do usuário
      // e entra num header — é assim que se injeta cabeçalho.
      .header('Content-Disposition', `attachment; filename="${r.nome.replace(/["\\\r\n]/g, '_')}"`)
      .send(r.conteudo);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Exclui o arquivo (registro e objeto)' })
  async excluir(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    await this.arquivos.excluir(id, u);
    return { excluido: true };
  }
}

interface MultipartFile {
  filename: string;
  mimetype: string;
  fields: Record<string, unknown>;
  toBuffer: () => Promise<Buffer>;
}

function valorDe(campo: unknown): string | undefined {
  if (campo && typeof campo === 'object' && 'value' in campo) {
    const v = (campo as { value: unknown }).value;
    return typeof v === 'string' ? v : undefined;
  }
  return undefined;
}
