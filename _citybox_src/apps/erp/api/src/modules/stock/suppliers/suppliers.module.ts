import { Module } from '@nestjs/common';

import { TenancyModule } from '../../tenancy/tenancy.module';

import { SupplierRepository } from './domain/repositories/supplier.repository.interface';
import { PrismaSupplierRepository } from './infrastructure/database/prisma-supplier.repository';

import { CreateSupplierUseCase } from './application/use-cases/create-supplier/create-supplier.use-case';
import { ListSuppliersUseCase } from './application/use-cases/list-suppliers/list-suppliers.use-case';
import { FindSupplierByIdUseCase } from './application/use-cases/find-supplier-by-id/find-supplier-by-id.use-case';
import { UpdateSupplierUseCase } from './application/use-cases/update-supplier/update-supplier.use-case';
import { DeleteSupplierUseCase } from './application/use-cases/delete-supplier/delete-supplier.use-case';
import { RestoreSupplierUseCase } from './application/use-cases/restore-supplier/restore-supplier.use-case';

import { CreateSupplierRoute } from './infrastructure/http/routes/create-supplier/create-supplier.route';
import { ListSuppliersRoute } from './infrastructure/http/routes/list-suppliers/list-suppliers.route';
import { FindSupplierByIdRoute } from './infrastructure/http/routes/find-supplier-by-id/find-supplier-by-id.route';
import { UpdateSupplierRoute } from './infrastructure/http/routes/update-supplier/update-supplier.route';
import { DeleteSupplierRoute } from './infrastructure/http/routes/delete-supplier/delete-supplier.route';
import { RestoreSupplierRoute } from './infrastructure/http/routes/restore-supplier/restore-supplier.route';

/**
 * Cadastro de fornecedores da organização.
 *
 * Importa a `TenancyModule` pelo `BranchRepository`: criar e atualizar
 * conferem que cada unidade atendida é mesmo da organização ativa.
 */
@Module({
  imports: [TenancyModule],
  // Ordem importa: as rotas de caminho fixo antes de `:id`, para o Nest não
  // tratar um segmento fixo como parâmetro.
  controllers: [
    ListSuppliersRoute,
    CreateSupplierRoute,
    RestoreSupplierRoute,
    FindSupplierByIdRoute,
    UpdateSupplierRoute,
    DeleteSupplierRoute,
  ],
  providers: [
    { provide: SupplierRepository, useClass: PrismaSupplierRepository },
    CreateSupplierUseCase,
    ListSuppliersUseCase,
    FindSupplierByIdUseCase,
    UpdateSupplierUseCase,
    DeleteSupplierUseCase,
    RestoreSupplierUseCase,
  ],
  exports: [SupplierRepository],
})
export class SuppliersModule {}
