import { Injectable } from '@nestjs/common';
import {
  getClinicStrandDefinition,
  resolveClinicStrand,
} from '@citybox/messaging/clinic-strand';
import { OrganizationRepository } from '../../../tenancy/domain/repositories/tenancy.repositories';
import { ProfessionalCouncilRequiredError } from '../../domain/errors/professional-council-required.error';
import {
  parseProfessionalCouncilInput,
  toProfessionalCouncilSnapshot,
  type ProfessionalCouncilInput,
  type ProfessionalCouncilSnapshot,
} from '../../domain/professional-council';
import { MemberRepository } from '../../domain/repositories/member.repository';

/**
 * Resolve o snapshot de conselho na emissão de receituário/atestado:
 * - se o Member já tem os 3 campos → usa (ignora body);
 * - se não tem → body obrigatório; grava no Member só se ainda vazio.
 * - tipos permitidos vêm do `clinicStrand` da loja (odonto: CRM/CRO; fisio: CREFITO; nutrição: CRN).
 */
@Injectable()
export class ResolveProfessionalCouncilService {
  constructor(
    private readonly members: MemberRepository,
    private readonly organizations: OrganizationRepository,
  ) {}

  async execute(params: {
    context: string;
    professionalId: string;
    storeId: string;
    input?: ProfessionalCouncilInput | null;
  }): Promise<ProfessionalCouncilSnapshot> {
    const allowedTypes = await this.resolveAllowedCouncilTypes(params.storeId);

    const member = await this.members.findById(params.professionalId);
    const existing = member
      ? toProfessionalCouncilSnapshot({
          councilType: member.councilType,
          councilNumber: member.councilNumber,
          councilUf: member.councilUf,
        })
      : null;

    if (existing) {
      if (!allowedTypes.includes(existing.councilType)) {
        throw new ProfessionalCouncilRequiredError(params.context);
      }
      return existing;
    }

    const fromBody = parseProfessionalCouncilInput(params.input, { allowedTypes });
    if (!fromBody) {
      throw new ProfessionalCouncilRequiredError(params.context);
    }

    if (member) {
      await this.members.setProfessionalCouncilIfEmpty(member.id, fromBody);
    }

    return fromBody;
  }

  private async resolveAllowedCouncilTypes(storeId: string): Promise<readonly string[]> {
    const organization = await this.organizations.findByStoreId(storeId);
    const strand = resolveClinicStrand(organization?.clinicStrand);
    return getClinicStrandDefinition(strand).features.councilTypes;
  }
}
