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

  /** Backfill de um intervalo (de/ate em AAAAMMDD). Pula dias já importados. */
  @Post('importar-periodo') @ExigePermissao('financeiro.gerenciar')
  importarPeriodo(@Body() body: { de?: string; ate?: string; forcar?: boolean }) {
    const de = (body?.de ?? '').replace(/\D/g, '');
    const ate = (body?.ate ?? '').replace(/\D/g, '');
    if (de.length !== 8 || ate.length !== 8) {
      return { de, ate, dias: 0, transacoes: 0, jaImportados: 0, erros: 0, message: 'Informe de/ate no formato AAAAMMDD.' };
    }
    return this.s.importarPeriodo(de, ate, !!body?.forcar);
  }
}
