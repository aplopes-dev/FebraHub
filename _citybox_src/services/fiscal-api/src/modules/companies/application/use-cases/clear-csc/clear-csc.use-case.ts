import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../domain/repositories/company.repository.interface';
import { Company } from '../../../domain/entities/company.entity';
import { CompanyNotFoundError } from '../../../domain/errors/company-not-found.error';
import { CompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';

export type ClearCscDto = {
  companyId: string;
  /// Mesmo motivo do `SetCscUseCase`: sem o solicitante autenticado, a
  /// permissão `fiscal.companies.manage` bastaria para remover o CSC de um
  /// Emitente alheio.
  user: AuthenticatedUser;
};

/**
 * Remove o CSC do Emitente (spec erp/024, Parte B) — volta a
 * `cscConfigured: false`. Molde exato de `SetCscUseCase`: mesma checagem de
 * posse, mesmo 404 em vez de 403 (não confirmar existência a quem não é dono).
 *
 * **Idempotente**: se o Emitente já não tem CSC, ainda assim executa e
 * devolve sucesso — evita um erro artificial num duplo clique/retry do
 * cliente antes do primeiro round-trip voltar.
 *
 * O bloqueio "não remover enquanto o PDV estiver em Modelo 65" (FR-009) **não
 * mora aqui** — mora no proxy `erp-web`, que é quem enxerga tanto a
 * fiscal-api quanto a erp-api. Esta use case nunca aprende sobre
 * `pos_fiscal_settings` (ver `services/fiscal-api/AGENTS.md`, FR-014/FR-015).
 */
@Injectable()
export class ClearCscUseCase implements IUseCase<ClearCscDto, Company> {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async execute(dto: ClearCscDto): Promise<Company> {
    if (!(await this.companyAccessPolicy.canActFor(dto.companyId, dto.user))) {
      throw new CompanyNotFoundError(ClearCscUseCase.name, dto.companyId);
    }

    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) {
      throw new CompanyNotFoundError(ClearCscUseCase.name, dto.companyId);
    }

    company.clearCsc();

    return this.companyRepository.save(company);
  }
}
