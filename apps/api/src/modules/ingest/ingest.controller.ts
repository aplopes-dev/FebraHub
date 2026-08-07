import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IngestService } from './ingest.service';
import { UpsertDto, RemoverDto, StatusIntegracaoDto } from './dto/ingest.dto';
import { RotaEtl } from '../../common/decorators/usuario.decorator';

/**
 * Porta de entrada dos ETLs.
 *
 * Antes eles escreviam direto no PostgREST com a service_role, uma chave que
 * ignorava toda a RLS: quem a tivesse, tinha o banco. Aqui a escrita passa por
 * um token de máquina próprio, restrito às tabelas do catálogo de ingestão, e
 * o token não abre nada além destas rotas.
 *
 * Fora do Swagger público: é superfície de escrita, não API de cliente.
 */
@ApiTags('ingest')
@ApiExcludeController()
@Controller('ingest')
@RotaEtl()
export class IngestController {
  constructor(private readonly ingest: IngestService) {}

  // Rotas de caminho fixo vêm antes de ':tabela' — o Nest casa por ordem de
  // declaração e 'status' seria lido como nome de tabela.
  @Post('status/registrar')
  @ApiOperation({ summary: 'Registra a última sincronização de uma fonte' })
  async status(@Body() dto: StatusIntegracaoDto) {
    return this.ingest.registrarStatus(dto);
  }

  @Get('token/:integracao')
  @ApiOperation({ summary: 'Lê o token OAuth guardado de uma integração' })
  async token(@Param('integracao') integracao: string) {
    return this.ingest.lerToken(integracao);
  }

  @Post(':tabela/remover')
  @ApiOperation({ summary: 'Apaga, dentro de uma janela de data, o que sumiu da origem' })
  async remover(@Param('tabela') tabela: string, @Body() dto: RemoverDto) {
    return this.ingest.remover(tabela, dto);
  }

  @Post(':tabela')
  @ApiOperation({ summary: 'Upsert em lote numa tabela de carga' })
  async upsert(@Param('tabela') tabela: string, @Body() dto: UpsertDto) {
    return this.ingest.upsert(tabela, dto.linhas, dto.conflito);
  }
}
