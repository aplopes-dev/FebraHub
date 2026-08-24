import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CreateLeadUseCase } from '../../../../leads/application/use-cases/create-lead/create-lead.use-case';
import type { LeadEntity } from '../../../../leads/domain/entities/lead.entity';
import type {
  ApiLeadPurpose,
  ApiPropertyType,
} from '../../../../leads/domain/mappers/lead-enum.mapper';
import { PropertyNotFoundError } from '../../../../properties/domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import { TeamMemberRepository } from '../../../../settings/domain/repositories/team-member.repository.interface';
import { GetPublicListingUseCase } from '../get-public-listing/get-public-listing.use-case';
import { NotifyPublicLeadUseCase } from '../notify-public-lead/notify-public-lead.use-case';
import { resolveActivePublicAgent } from '../../policies/resolve-active-public-agent';

export type SubmitPublicLeadInput = {
  storeId: string;
  slug: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  listingId?: string;
};

function purposeFromListingType(listingType: 'sale' | 'rent'): ApiLeadPurpose {
  return listingType === 'rent' ? 'renting' : 'buying';
}

@Injectable()
export class SubmitPublicLeadUseCase implements IUseCase<
  SubmitPublicLeadInput,
  LeadEntity
> {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly properties: PropertyRepository,
    private readonly getPublicListing: GetPublicListingUseCase,
    private readonly createLead: CreateLeadUseCase,
    private readonly notifyPublicLead: NotifyPublicLeadUseCase,
  ) {}

  async execute(input: SubmitPublicLeadInput): Promise<LeadEntity> {
    const name = input.name.trim();
    const email = input.email?.trim() ?? '';
    const phone = input.phone?.trim() ?? '';
    const message = input.message?.trim() ?? '';

    if (!name) {
      throw new BadRequestException('Informe seu nome');
    }
    if (!email && !phone) {
      throw new BadRequestException('Informe telefone ou e-mail');
    }

    const slug = input.slug.trim();
    const agent = await resolveActivePublicAgent(
      this.members,
      input.storeId,
      slug,
      SubmitPublicLeadUseCase.name,
    );

    let interestedPropertyType: ApiPropertyType = 'apartment';
    let purpose: ApiLeadPurpose = 'buying';
    let matchedProperties: { id: string; name: string }[] | undefined;
    let propertyName: string | null = null;

    if (input.listingId?.trim()) {
      try {
        const property = await this.getPublicListing.execute({
          storeId: input.storeId,
          listingId: input.listingId.trim(),
          agentSlug: slug,
        });
        interestedPropertyType = property.type;
        purpose = purposeFromListingType(property.listingType);
        matchedProperties = [{ id: property.id, name: property.name }];
        propertyName = property.name;
      } catch (error) {
        if (error instanceof PropertyNotFoundError) {
          throw new BadRequestException('Imóvel não encontrado');
        }
        throw error;
      }
    }

    const notes =
      message || (propertyName ? `Interesse em: ${propertyName}` : '');

    const lead = await this.createLead.execute({
      storeId: input.storeId,
      name,
      email: email || undefined,
      phone: phone || undefined,
      status: 'new',
      leadSource: 'website',
      interestedPropertyType,
      purpose,
      notes,
      propertyName,
      agentId: slug,
      agentIds: [slug],
      matchedProperties,
      activities: [
        {
          type: 'system',
          message: 'Lead criado via catálogo público',
        },
      ],
    });

    await this.notifyPublicLead.execute({
      storeId: input.storeId,
      agent,
      lead,
      message,
      propertyName,
    });

    return lead;
  }
}
