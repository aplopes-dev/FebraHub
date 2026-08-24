import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQuestionsUseCase } from '../../../../application/use-cases/list-questions/list-questions.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListQuestionsQueryDto } from '../shared/template-body.dto';
import { QuestionListPresenter } from '../shared/question.presenter';

@ApiTags('anamnesis-questions')
@Controller('v1/anamnesis-questions')
@RequirePermission('manage', 'AnamnesisTemplate')
export class ListQuestionsRoute {
  constructor(private readonly listQuestions: ListQuestionsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar biblioteca de perguntas de anamnese' })
  async handle(
    @StoreId() storeId: string,
    @Query() query: ListQuestionsQueryDto,
  ) {
    const questions = await this.listQuestions.execute({
      storeId,
      search: query.search,
    });
    return QuestionListPresenter.toHttp(questions);
  }
}
