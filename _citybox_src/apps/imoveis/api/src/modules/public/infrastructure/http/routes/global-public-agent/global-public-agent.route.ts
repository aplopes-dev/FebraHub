import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { TeamMemberRepository } from '../../../../../settings/domain/repositories/team-member.repository.interface';
import { GetPublicAgentUseCase } from '../../../../application/use-cases/get-public-agent/get-public-agent.use-case';
import { GetPublicAgentPhotoUseCase } from '../../../../application/use-cases/get-public-agent-photo/get-public-agent-photo.use-case';
import { ListPublicAgentListingsUseCase } from '../../../../application/use-cases/list-public-agent-listings/list-public-agent-listings.use-case';
import { SubmitPublicLeadUseCase } from '../../../../application/use-cases/submit-public-lead/submit-public-lead.use-case';
import { resolvePublicAgentStoreId } from '../../../../application/policies/resolve-public-agent-store-id';
import { PublicCatalogRateLimitGuard } from '../../guards/public-catalog-rate-limit.guard';
import {
  mapPublicAgentToHttp,
  mapPublicListingSummary,
} from '../shared/public-catalog.presenter';
import { parseCsvParam } from '../list-public-agent-listings/list-public-agent-listings.query';
import { SubmitPublicLeadDto } from '../submit-public-lead/submit-public-lead.dto';

/**
 * Catálogo público multi-loja: `/agents/:slug` no web não carrega storeId.
 * Resolve a organization pelo `TeamMember.agentId` no banco.
 */
@ApiTags('public')
@Controller('v1/public/agents')
@UseGuards(PublicCatalogRateLimitGuard)
export class GlobalPublicAgentRoute {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly getPublicAgent: GetPublicAgentUseCase,
    private readonly listPublicListings: ListPublicAgentListingsUseCase,
    private readonly getPublicAgentPhoto: GetPublicAgentPhotoUseCase,
    private readonly submitPublicLead: SubmitPublicLeadUseCase,
  ) {}

  private resolveStore(slug: string): Promise<string> {
    return resolvePublicAgentStoreId(
      this.members,
      slug,
      GlobalPublicAgentRoute.name,
    );
  }

  @Get(':slug')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perfil público do corretor (resolve a loja pelo slug)',
  })
  async getAgent(@Param('slug') slug: string) {
    const storeId = await this.resolveStore(slug);
    const agent = await this.getPublicAgent.execute({ storeId, slug });
    return { data: mapPublicAgentToHttp(agent) };
  }

  @Get(':slug/listings')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listagem pública de imóveis do corretor (multi-loja)',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'purpose', required: false })
  @ApiQuery({ name: 'type', required: false })
  async listListings(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('purpose') purpose?: string | string[],
    @Query('type') type?: string | string[],
  ) {
    const storeId = await this.resolveStore(slug);
    const result = await this.listPublicListings.execute({
      storeId,
      slug,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search:
        typeof search === 'string' ? search.trim() || undefined : undefined,
      purpose: parseCsvParam(purpose),
      type: parseCsvParam(type),
    });

    return {
      data: result.items.map((item) => mapPublicListingSummary(item, storeId)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':slug/photo')
  @Public()
  @ApiOperation({ summary: 'Foto pública do corretor (multi-loja)' })
  async photo(@Param('slug') slug: string, @Res() res: Response) {
    const storeId = await this.resolveStore(slug);
    const { buffer, mimeType } = await this.getPublicAgentPhoto.execute({
      storeId,
      slug,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  }

  @Post(':slug/leads')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Captura pública de lead (multi-loja)' })
  async submitLead(
    @Param('slug') slug: string,
    @Body() body: SubmitPublicLeadDto,
  ) {
    const storeId = await this.resolveStore(slug);
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
