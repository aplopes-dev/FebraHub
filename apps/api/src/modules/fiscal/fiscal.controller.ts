import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { FiscalConfigService } from './fiscal-config.service';
import { FiscalService } from './fiscal.service';
import { FiscalNfceService } from './fiscal-nfce.service';
import {
  AtualizarFiscalConfigDto,
  CancelarCupomDto,
  DefinirCscDto,
  EmitirCupomDto,
  UploadCertificadoDto,
} from './fiscal.dto';

@ApiTags('fiscal')
@Controller('fiscal')
@ExigePermissao('fiscal.emitir', 'fiscal.gerenciar')
export class FiscalController {
  constructor(
    private readonly fiscal: FiscalService,
    private readonly config: FiscalConfigService,
    private readonly nfce: FiscalNfceService,
  ) {}

  // -------------------- CONFIGURACAO (exige gerenciar) --------------------

  @Get('config')
  status() {
    return this.config.statusFiscal();
  }

  @Put('config')
  @ExigePermissao('fiscal.gerenciar')
  atualizar(@Body() dto: AtualizarFiscalConfigDto) {
    return this.config.atualizarConfig(dto);
  }

  @Post('config/csc')
  @ExigePermissao('fiscal.gerenciar')
  csc(@Body() dto: DefinirCscDto) {
    return this.config.definirCsc(dto);
  }

  @Post('config/certificado')
  @ExigePermissao('fiscal.gerenciar')
  async certificado(@Req() req: FastifyRequest) {
    const parte = await (
      req as unknown as { file: () => Promise<MultipartFile | undefined> }
    ).file();
    if (!parte) {
      throw new BadRequestException({ codigo: 'SEM_ARQUIVO', message: 'Envie o arquivo .pfx do certificado.' });
    }
    const pfx = await parte.toBuffer();
    const campos = parte.fields ?? {};
    const dto: UploadCertificadoDto = {
      senha: valorDe(campos.senha) ?? '',
      nome: valorDe(campos.nome),
    };
    if (!dto.senha) {
      throw new BadRequestException({ codigo: 'SEM_SENHA', message: 'Informe a senha do certificado.' });
    }
    return this.config.uploadCertificado(pfx, dto);
  }

  // -------------------- EMISSAO (exige emitir) --------------------

  @Post('emitir')
  @ExigePermissao('fiscal.emitir')
  async emitir(@Body() dto: EmitirCupomDto, @Usuario() u: UsuarioLogado) {
    if (dto.tipo === 'nao_fiscal') {
      const r = await this.fiscal.emitirNaoFiscal(dto.vendaId, u);
      return { documentoId: r.documentoId, tipo: 'nao_fiscal' };
    }
    // cupom fiscal (NFC-e)
    return this.nfce.emitir(dto.vendaId, u);
  }

  @Post('documentos/:id/cancelar')
  @ExigePermissao('fiscal.gerenciar')
  cancelar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelarCupomDto, @Usuario() u: UsuarioLogado) {
    return this.nfce.cancelar(id, dto.justificativa, u);
  }

  // -------------------- HISTORICO / IMPRESSAO --------------------

  @Get('documentos')
  @ExigePermissao('fiscal.emitir')
  listar(@Query('tipo') tipo?: string, @Query('situacao') situacao?: string) {
    return this.fiscal.listar(tipo, situacao);
  }

  @Get('documentos/:id')
  @ExigePermissao('fiscal.emitir')
  obter(@Param('id', ParseUUIDPipe) id: string) {
    return this.fiscal.obter(id);
  }

  /** HTML do cupom para impressao (bobina por padrao). */
  @Get('documentos/:id/comprovante')
  @ExigePermissao('fiscal.emitir')
  async comprovante(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('formato') formato: string | undefined,
    @Res() res: FastifyReply,
  ) {
    const fmt = formato === 'a4' ? 'a4' : 'bobina';
    const html = await this.fiscal.reimprimir(id, fmt);
    void res.header('Content-Type', 'text/html; charset=utf-8').send(html);
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
