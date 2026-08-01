import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

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
