import { Injectable, Logger } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { normalizeDocument } from '../../../../../shared/core/utils/document';
import { ProvisionOrganizationDataUseCase } from '../../../../store-setup/application/use-cases/provision-organization-data/provision-organization-data.use-case';
import { Organization } from '../../../domain/entities/organization.entity';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository.interface';
import { OrganizationDocumentTakenError } from '../../../domain/errors/organization-document-taken.error';
import type {
  CreateOrganizationDto,
  CreateOrganizationResult,
} from '../../dtos/organization.dto';

/**
 * Cria a empresa contratante e já dá ao criador o papel de responsável.
 *
 * Roda sem contexto de tenant — a organização é o tenant, então não há
 * `organizationId` para recortar ainda.
 */
@Injectable()
export class CreateOrganizationUseCase implements IUseCase<
  CreateOrganizationDto,
  CreateOrganizationResult
> {
  private readonly logger = new Logger(CreateOrganizationUseCase.name);

  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly provisionOrganizationData: ProvisionOrganizationDataUseCase,
  ) {}

  async execute(
    input: CreateOrganizationDto,
  ): Promise<CreateOrganizationResult> {
    const document = normalizeDocument(input.document);
    const existing = await this.organizationRepository.findByDocument(document);
    if (existing) throw new OrganizationDocumentTakenError(document);

    const organization = Organization.create({
      personType: input.personType,
      document,
      legalName: input.legalName,
      tradeName: input.tradeName ?? null,
      email: input.email,
      phone: input.phone ?? null,
      responsibleName: input.responsibleName,
      responsibleDocument: input.responsibleDocument ?? null,
      responsibleEmail: input.responsibleEmail ?? null,
      responsiblePhone: input.responsiblePhone ?? null,
    });

    const created = await this.organizationRepository.createWithOwner(
      organization,
      input.actorUserId,
    );

    await this.provisionSystemData(created.organization.id);

    return {
      organization: created.organization,
      ownerMembershipId: created.membership.id,
    };
  }

  /**
   * Best-effort: a organização já foi gravada quando isto roda, então relançar faria o
   * cliente ver um erro sobre um cadastro que existe. Quem ficou sem os dados de sistema
   * é recuperado pelo reprovisionamento em lote (`provision:orgs`).
   */
  private async provisionSystemData(organizationId: string): Promise<void> {
    try {
      await this.provisionOrganizationData.execute({ organizationId });
    } catch (err) {
      this.logger.error(
        `Provisionamento de dados de sistema falhou para a organização ${organizationId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
