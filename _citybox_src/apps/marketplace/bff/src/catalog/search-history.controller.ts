import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/jwt.guard.js';
import { badRequest } from '../common/envelope.js';
import { getConsumerClient } from '../database/consumer.js';
import type { ConsumerUserRecord } from '../users/users.service.js';

const HISTORY_LIMIT = 10;
/** Janela de leitura maior que o limite para deduplicar por termo. */
const HISTORY_SCAN = 50;

class AddSearchHistoryDto {
  /** Contrato web envia `query`; `term` aceito por compatibilidade. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  query?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  term?: string;
}

@ApiTags('search-history')
@ApiBearerAuth()
@Controller('me/search-history')
export class SearchHistoryController {
  private readonly db = getConsumerClient();

  private async queriesFor(userId: string): Promise<string[]> {
    const rows = await this.db.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_SCAN,
    });
    const seen = new Set<string>();
    const queries: string[] = [];
    for (const row of rows) {
      const key = row.term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      queries.push(row.term);
      if (queries.length >= HISTORY_LIMIT) break;
    }
    return queries;
  }

  @Get()
  @ApiOperation({ summary: 'Últimas buscas do usuário (10, distintas, mais recentes primeiro)' })
  async list(@CurrentUser() user: ConsumerUserRecord) {
    return { queries: await this.queriesFor(user.id) };
  }

  @Post()
  @ApiOperation({ summary: 'Registra um termo de busca' })
  async add(@CurrentUser() user: ConsumerUserRecord, @Body() body: AddSearchHistoryDto) {
    const term = (body.query ?? body.term)?.trim();
    if (!term) throw badRequest('Informe o termo de busca', 'query');

    await this.db.searchHistory.create({ data: { userId: user.id, term } });
    return { queries: await this.queriesFor(user.id) };
  }

  @Delete()
  @ApiOperation({ summary: 'Limpa o histórico de buscas' })
  async clear(@CurrentUser() user: ConsumerUserRecord) {
    await this.db.searchHistory.deleteMany({ where: { userId: user.id } });
  }
}
