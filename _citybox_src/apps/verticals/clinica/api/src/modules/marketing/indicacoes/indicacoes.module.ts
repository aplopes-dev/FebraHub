import { Module } from '@nestjs/common';
import { GetIndicacoesKpisUseCase } from './application/use-cases/get-indicacoes-kpis/get-indicacoes-kpis.use-case';
import { ListIndicacoesReferredPatientsUseCase } from './application/use-cases/list-indicacoes-referred-patients/list-indicacoes-referred-patients.use-case';
import { ListIndicacoesReferrersUseCase } from './application/use-cases/list-indicacoes-referrers/list-indicacoes-referrers.use-case';
import { IndicacoesRepository } from './domain/repositories/indicacoes.repository';
import { PrismaIndicacoesRepository } from './infrastructure/database/prisma-indicacoes.repository';
import { IndicacoesRoute } from './infrastructure/http/routes/indicacoes.route';

@Module({
  controllers: [IndicacoesRoute],
  providers: [
    { provide: IndicacoesRepository, useClass: PrismaIndicacoesRepository },
    GetIndicacoesKpisUseCase,
    ListIndicacoesReferredPatientsUseCase,
    ListIndicacoesReferrersUseCase,
  ],
})
export class IndicacoesModule {}
