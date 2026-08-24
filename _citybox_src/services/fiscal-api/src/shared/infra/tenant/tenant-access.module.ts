import { Module } from '@nestjs/common';
import { CompanyAccessPolicy } from '../../domain/tenant/company-access.policy';
import { TrustedSystemCompanyAccessPolicy } from './trusted-system-company-access.policy';

/// Autorização **por Emitente** — quem pode agir em nome de qual contribuinte.
///
/// ⚠️ **Vive em `shared/`, e não em `auxiliary-documents/`, por necessidade.**
///
/// A política nasceu na spec 004 dentro do módulo de documento auxiliar, que
/// era o único consumidor. Com a spec 005 ela passou a ser usada também por
/// `IssueNfceUseCase` e por `SetCscUseCase` — e o segundo revelou o problema:
/// `CompaniesModule` importar `AuxiliaryDocumentsModule` fecharia um ciclo
/// (`companies` ← `certificates` ← `auxiliary-documents`).
///
/// O ciclo é sintoma, não causa: autorização de tenant é preocupação
/// transversal, não detalhe de impressão. O lugar dela é aqui.
/// A implementação passou de `StoreMembershipCompanyAccessPolicy` (resolvia o
/// `sub` contra `platform.members`) para `TrustedSystemCompanyAccessPolicy`, com
/// o ADR C-16 — o motivo está documentado na classe nova. Sem `PrismaModule`
/// agora: a autorização deixou de precisar atravessar a fronteira de schema de
/// outro serviço, que era o acoplamento declarado como custo na anterior.
@Module({
  providers: [
    {
      provide: CompanyAccessPolicy,
      useClass: TrustedSystemCompanyAccessPolicy,
    },
  ],
  exports: [CompanyAccessPolicy],
})
export class TenantAccessModule {}
