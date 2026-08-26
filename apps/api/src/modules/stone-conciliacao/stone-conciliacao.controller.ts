import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { StoneConciliacaoService } from './stone-conciliacao.service';

/**
 * Conciliação Stone — leitura das transações de cartão da maquininha,
 * importadas do arquivo de conciliação Stone. Só consulta/gestão financeira.
 */
@Controller('stone-conciliacao')
@ExigePermissao('financeiro.erp.ver')
export class StoneConciliacaoController {
  constructor(private readonly s: StoneConciliacaoService) {}

  @Get('status') status() { return this.s.status(); }

  @Get('transacoes')
  transacoes(
    @Query('de') de?: string,
    @Query('ate') ate?: string,
    @Query('serial') serial?: string,
    @Query('bandeira') bandeira?: string,
  ) {
    return this.s.listar({ de, ate, serial, bandeira });
  }

  @Get('imports') imports() { return this.s.imports(); }

  /** Dispara a importação de um dia (AAAAMMDD) manualmente. Exige gestão. */
  @Post('importar') @ExigePermissao('financeiro.gerenciar')
  importar(@Body() body: { dia?: string }) {
    const dia = (body?.dia ?? '').replace(/\D/g, '');
    if (dia.length === 8) return this.s.importarDia(dia);
    return this.s.importarOntem();
  }
}
