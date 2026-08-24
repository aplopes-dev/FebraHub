import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { SubmitPublicLeadUseCase } from '../../../../application/use-cases/submit-public-lead/submit-public-lead.use-case';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';
import { SubmitPublicLeadDto } from './submit-public-lead.dto';

@ApiTags('public')
@Controller('v1/public/stores/:storeId/agents')
@UseGuards(PublicCatalogRateLimitGuard)
export class SubmitPublicLeadRoute {
  constructor(private readonly submitPublicLead: SubmitPublicLeadUseCase) {}

  @Post(':slug/leads')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Captura pública de lead via catálogo' })
  async handle(
    @Param('storeId') storeId: string,
    @Param('slug') slug: string,
    @Body() body: SubmitPublicLeadDto,
  ) {
    const lead = await this.submitPublicLead.execute({
      storeId,
      slug,
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
      listingId: body.listingId,
    });

    return {
      data: {
        id: lead.id,
        name: lead.name,
      },
    };
  }
}
