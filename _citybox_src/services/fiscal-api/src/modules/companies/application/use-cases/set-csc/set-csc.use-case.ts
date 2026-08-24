import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CompanyRepository } from '../../../domain/repositories/company.repository.interface';
import { Company } from '../../../domain/entities/company.entity';
import { CompanyNotFoundError } from '../../../domain/errors/company-not-found.error';
import { CompanyCscNotConfiguredError } from '../../../domain/errors/company-csc-not-configured.error';
import { encryptSecret } from '../../../../../shared/infra/fiscal-signature/cert-encryption';
import { CompanyAccessPolicy } from '../../../../../shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';

export type SetCscDto = {
  companyId: string;
  /// Solicitante autenticado. ⚠️ **Obrigatório**: sem ele, `fiscal.companies.manage`
  /// bastaria para gravar CSC em Emitente alheio — ver `execute`.
  user: AuthenticatedUser;
  /// Identificador do CSC (`cIdToken`). **Não é segredo** — vai em claro dentro
  /// do próprio QR Code impresso.
  cscId: string;
  /// O segredo. Só existe em claro dentro deste objeto e do argumento de
  /// `encryptSecret`; a entidade nunca o recebe.
  cscToken: string;
};

/// FR-013 — cadastro do CSC do Emitente.
///
/// Reusa `encryptSecret`, o mesmo mecanismo da senha do PKCS#12, em vez de um
/// segundo esquema de cifra. Dois mecanismos significariam duas superfícies de
/// auditoria e duas formas de errar a rotação de chave; e `cert-encryption` já
/// se declara aplicável a "qualquer segredo curto".
///
/// ⚠️ **A cifra acontece aqui, não na entidade.** É deliberado: assim `Company`
/// nunca chega a segurar o texto claro em `props`, e como `Entity.props` é
/// público, um `logger.info({ company })` descuidado não tem o que vazar. A
/// garantia é estrutural, não disciplinar.
@Injectable()
export class SetCscUseCase implements IUseCase<SetCscDto, Company> {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly companyAccessPolicy: CompanyAccessPolicy,
  ) {}

  async execute(dto: SetCscDto): Promise<Company> {
    // ⚠️ Autorização por Emitente, ANTES de qualquer coisa.
    //
    // `@RequirePermission('fiscal.companies.manage')` diz apenas que o usuário
    // pode gerenciar *algum* Emitente — não **este**. Sem esta checagem,
    // qualquer usuário com a permissão poderia gravar CSC em empresa alheia, e
    // as duas consequências são graves: sobrescrever o CSC de outro
    // contribuinte quebra a emissão de cupom dele **em silêncio**, e gravar um
    // CSC conhecido permite forjar QR Code que a consulta pública aceita.
    //
    // `NotFound`, não `Forbidden`: um 403 confirmaria que o Emitente existe.
    if (!(await this.companyAccessPolicy.canActFor(dto.companyId, dto.user))) {
      throw new CompanyNotFoundError(SetCscUseCase.name, dto.companyId);
    }

    // Validado antes de buscar o Emitente: gravar `cscId` vazio produziria um
    // cadastro que se declara apto a emitir cupom e gera QR Code inconferível.
    if (!dto.cscId.trim() || !dto.cscToken.trim()) {
      throw new CompanyCscNotConfiguredError(SetCscUseCase.name);
    }

    const company = await this.companyRepository.findById(dto.companyId);
    if (!company) {
      throw new CompanyNotFoundError(SetCscUseCase.name, dto.companyId);
    }

    company.setCsc({
      cscId: dto.cscId.trim(),
      cscTokenEncrypted: encryptSecret(dto.cscToken),
    });

    return this.companyRepository.save(company);
  }
}
