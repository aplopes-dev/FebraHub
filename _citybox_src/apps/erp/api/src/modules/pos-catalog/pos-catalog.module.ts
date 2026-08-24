import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { PosTerminalsModule } from '../pos-terminals/pos-terminals.module';
import { StockModule } from '../stock/stock.module';
import { GetTerminalCatalogUseCase } from './application/use-cases/get-terminal-catalog/get-terminal-catalog.use-case';
import { CurrentTerminalCatalogRoute } from './infrastructure/http/routes/current-terminal-catalog/current-terminal-catalog.route';

@Module({
  // Catalog exporta os repositórios; Stock o depósito/saldo; PosTerminals o DeviceAuthGuard.
  imports: [CatalogModule, StockModule, PosTerminalsModule],
  controllers: [CurrentTerminalCatalogRoute],
  providers: [GetTerminalCatalogUseCase],
})
export class PosCatalogModule {}
