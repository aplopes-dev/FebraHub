import { Module } from '@nestjs/common';

// Controllers
import { PedagogicoController }      from './pedagogico.controller';       // legado (avaliações, maestros, retenção)
import { PedagogicoNovoController }  from './pedagogico-novo.controller';  // P0 novo

// Services legados
import { PedagogicoService }         from './pedagogico.service';

// Services P0
import { TurmasService }             from './turmas/turmas.service';
import { MatriculasService }         from './matriculas/matriculas.service';
import { CredenciamentoService }     from './credenciamento/credenciamento.service';
import { DashboardService }          from './dashboard/dashboard.service';
import { ConfirmacoesService }       from './confirmacoes/confirmacoes.service';
import { TransferenciasService }     from './transferencias/transferencias.service';
import { MonitoresService }          from './monitores/monitores.service';
import { SolicitacoesService }       from './solicitacoes/solicitacoes.service';
import { CsService }                 from './cs/cs.service';

@Module({
  controllers: [
    PedagogicoController,
    PedagogicoNovoController,
  ],
  providers: [
    // legado
    PedagogicoService,
    // P0
    TurmasService,
    MatriculasService,
    CredenciamentoService,
    DashboardService,
    ConfirmacoesService,
    TransferenciasService,
    MonitoresService,
    SolicitacoesService,
    CsService,
  ],
  exports: [MatriculasService, TurmasService],
})
export class PedagogicoModule {}
