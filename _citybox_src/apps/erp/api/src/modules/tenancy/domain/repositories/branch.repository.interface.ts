import type { Branch } from '../entities/branch.entity';

export type BranchListCriteria = {
  search?: string;
  activeOnly?: boolean;
  includeDeleted?: boolean;
  /** Recorte extra por acesso do membro — `null` significa "todas". */
  allowedBranchIds?: string[] | null;
  skip?: number;
  take?: number;
};

export abstract class BranchRepository {
  abstract findById(organizationId: string, id: string): Promise<Branch | null>;
  abstract findByCode(
    organizationId: string,
    code: string,
  ): Promise<Branch | null>;
  abstract findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Branch | null>;
  abstract findHeadquarters(organizationId: string): Promise<Branch | null>;
  abstract findAll(
    organizationId: string,
    criteria?: BranchListCriteria,
  ): Promise<Branch[]>;
  abstract count(
    organizationId: string,
    criteria?: BranchListCriteria,
  ): Promise<number>;
  abstract save(branch: Branch): Promise<Branch>;
}
