import { DomainError } from '../../../../../shared/core/errors/domain.error';

import type { CampaignSegment, CampaignType } from '../campaign.types';

export class CampaignInvalidSegmentTypeError extends DomainError {
  constructor(
    context: string,
    segment: CampaignSegment | string,
    type: CampaignType | string,
  ) {
    super({
      internalMessage: `Invalid campaign segment/type pair: ${segment} / ${type}`,
      externalMessage: 'Segmento e tipo de campanha incompatíveis',
      context,
    });
  }
}
