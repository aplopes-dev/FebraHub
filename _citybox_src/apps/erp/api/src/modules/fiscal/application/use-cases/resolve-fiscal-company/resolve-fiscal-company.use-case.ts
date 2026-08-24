import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from '../../../../tenancy/domain/repositories/organization.repository.interface';
import { FiscalApiProvider } from '../../../domain/providers/fiscal-api.provider';

export type ResolveFiscalCompanyInput = {
  organizationId: string;
};

/**
 * Resolve o Emitente **a partir da organização ativa** — nunca de um id vindo
 * do cliente.
 *
 * É aqui que a autorização por Emitente acontece de fato. A `fiscal-api` confia
 * em quem chama (`TrustedSystemCompanyAccessPolicy`) e não tem como validar o
 * vínculo: ela não conhece `erp.memberships`. Se este use case aceitasse um
 * `companyId` por parâmetro, o lojista poderia ler documentos de outro
 * contribuinte — o buraco que a arquitetura anterior tinha pelo `X-Company-Id`
 * escolhido no browser.
 *
 * O `organizationId` chega do `TenantContextGuard`, que já verificou o
 * `Membership` do usuário. O CNPJ é imutável na organização (`document`), então
 * o Emitente derivado dele é estável.
 */
@Injectable()
export class ResolveFiscalCompanyUseCase {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly fiscalApi: FiscalApiProvider,
  ) {}

  async execute(input: ResolveFiscalCompanyInput): Promise<string> {
    const organization = await this.organizations.findById(
      input.organizationId,
    );
    if (!organization) {
      throw new NotFoundException('Organização não encontrada');
    }

    const company = await this.fiscalApi.findCompanyByCnpj(
      organization.document,
    );
    if (!company) {
      // Estado legítimo, não erro de sistema: a empresa existe no ERP mas ainda
      // não tem cadastro de Emitente. A tela mostra "emitente fiscal não
      // configurado" em vez de uma lista vazia, que pareceria "sem notas".
      throw new NotFoundException(
        'Emitente fiscal não configurado para o CNPJ desta organização.',
      );
    }

    return company.id;
  }
}
