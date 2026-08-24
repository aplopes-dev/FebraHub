import type { PersonTypeValue } from '../../../../shared/core/utils/document';
import type {
  Organization,
  OrganizationStatusValue,
} from '../../domain/entities/organization.entity';
import type { OrganizationSummary } from '../../domain/repositories/organization.repository.interface';

export type CreateOrganizationDto = {
  /** Quem está criando — vira o responsável (OWNER) da organização. */
  actorUserId: string;
  personType: PersonTypeValue;
  document: string;
  legalName: string;
  tradeName?: string | null;
  email: string;
  phone?: string | null;
  responsibleName: string;
  responsibleDocument?: string | null;
  responsibleEmail?: string | null;
  responsiblePhone?: string | null;
};

export type UpdateOrganizationDto = {
  organizationId: string;
  legalName: string;
  tradeName?: string | null;
  email: string;
  phone?: string | null;
  responsibleName: string;
  responsibleDocument?: string | null;
  responsibleEmail?: string | null;
  responsiblePhone?: string | null;
  status?: OrganizationStatusValue;
};

export type CreateOrganizationResult = {
  organization: Organization;
  ownerMembershipId: string;
};

export type ListMyOrganizationsDto = { userId: string };

export type ListMyOrganizationsResult = { items: OrganizationSummary[] };
