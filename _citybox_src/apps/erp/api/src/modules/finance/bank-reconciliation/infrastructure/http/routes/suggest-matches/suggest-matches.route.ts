import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuggestMatchesUseCase } from '../../../../application/use-cases/suggest-matches/suggest-matches.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { MatchSuggestionPresenter } from '../shared/match-suggestion.presenter';

@ApiTags('bank-statements')
@Controller('v1/bank-statements/:id/transactions/:transactionId/suggestions')
export class SuggestMatchesRoute {
  constructor(private readonly suggestMatches: SuggestMatchesUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Sugerir lançamentos candidatos para uma transação pendente',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) bankStatementId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    const result = await this.suggestMatches.execute({
      organizationId,
      bankStatementId,
      transactionId,
    });
    return MatchSuggestionPresenter.toHttp(result);
  }
}
