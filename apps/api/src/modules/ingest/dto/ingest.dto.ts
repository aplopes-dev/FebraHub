import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class UpsertDto {
  @ApiProperty({ description: 'Colunas do conflito, separadas por vírgula', example: 'parcela_id' })
  @IsString()
  @MaxLength(200)
  conflito!: string;

  // 2000 por chamada: os ETLs já mandavam em lotes de 200 a 500, e o limite
  // evita que um lote gigante segure a conexão e o pool.
  @ApiProperty({ type: [Object], description: 'Registros a inserir/atualizar' })
  @IsArray()
  @ArrayMaxSize(2000)
  linhas!: Record<string, unknown>[];
}

export class StatusIntegracaoDto {
  @ApiProperty({ example: 'cispay' })
  @IsString()
  @MaxLength(60)
  fonte!: string;

  @ApiPropertyOptional({ example: 'CisPay' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nome_exibicao?: string;

  @ApiProperty({ enum: ['ok', 'erro', 'parcial'] })
  @IsIn(['ok', 'erro', 'parcial'])
  status!: 'ok' | 'erro' | 'parcial';

  @ApiPropertyOptional()
  @IsOptional()
  registros?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mensagem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  duracao_segundos?: number;
}

/**
 * Recorte de data do `remover`. Não é opcional de propósito: DELETE sem
 * cláusula de data numa tabela de fato apaga histórico inteiro, e o token
 * de ETL é a única coisa entre o chamador e essa tabela.
 */
export class JanelaDto {
  @ApiProperty({ description: 'Coluna de data que delimita o recorte', example: 'data_aprovacao' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  coluna!: string;

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  de!: string;

  @ApiProperty({ example: '2026-07-31' })
  @IsDateString()
  ate!: string;
}

/**
 * Corpo do `POST /ingest/:tabela/remover`.
 *
 * Semântica (a que a carga incremental do Salesforce precisa): dentro da
 * janela, apaga tudo cuja `chave` NÃO está em `valores`. Ou seja, `valores`
 * são as chaves que ainda existem na origem; o que sobrar no banco dentro
 * do recorte é registro que sumiu de lá e precisa sumir daqui.
 *
 * O ETL manda o que TEM em vez do que sumiu porque ele não enxerga o banco:
 * antes ele fazia um GET no PostgREST para descobrir a diferença. Fazer o
 * diff aqui dentro elimina esse round-trip e a rota de leitura genérica.
 */
export class RemoverDto {
  @ApiProperty({ description: 'Coluna de identidade da linha', example: 'pagamento_id' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  chave!: string;

  // Lista NÃO pode ser vazia: lista vazia significaria "nada sobreviveu" e
  // apagaria a janela inteira — quase sempre sintoma de arquivo quebrado.
  @ApiProperty({ type: [String], description: 'Chaves que ainda existem na origem' })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200000)
  valores!: (string | number)[];

  @ApiProperty({ type: JanelaDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => JanelaDto)
  janela!: JanelaDto;
}
