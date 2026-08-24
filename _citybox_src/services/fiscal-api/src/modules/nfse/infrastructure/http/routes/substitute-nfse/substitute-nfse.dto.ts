import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { IssueNfseDto } from '../issue-nfse/issue-nfse.dto';

/// `TSCodJustSubst` — lista PRÓPRIA da substituição, de dois dígitos. Não
/// confundir com `TSCodJustCanc` (`1`/`2`/`9`) do cancelamento: são conjuntos
/// disjuntos, e trocá-los é recusado por schema pelo órgão fiscal.
const SUBSTITUTION_REASON_CODES = ['01', '02', '03', '04', '05', '99'] as const;

export class SubstituteNfseHttpDto {
  @ApiProperty({
    description:
      'Dados completos da nota nova. É uma emissão de verdade — o Padrão ' +
      'Nacional gera uma NFS-e independente, e o vínculo com a original vive ' +
      'no evento, não na nota.',
    type: IssueNfseDto,
  })
  @ValidateNested()
  @Type(() => IssueNfseDto)
  replacement!: IssueNfseDto;

  @ApiProperty({
    description:
      'Código de justificativa da substituição (`cMotivo`): 01 desenquadramento ' +
      'do Simples Nacional, 02 enquadramento, 03/04 inclusão/exclusão retroativa ' +
      'de imunidade ou isenção, 05 rejeição pelo tomador ou intermediário, 99 outros.',
    enum: SUBSTITUTION_REASON_CODES,
  })
  @IsIn(SUBSTITUTION_REASON_CODES, {
    message:
      'reasonCode deve ser um código da tabela de substituição (01–05 ou 99) — ' +
      'a tabela de cancelamento (1/2/9) não vale aqui',
  })
  reasonCode!: (typeof SUBSTITUTION_REASON_CODES)[number];

  @ApiPropertyOptional({
    description:
      'Descrição do motivo (`xMotivo`). Opcional em `e105102`; quando ' +
      'informado, o leiaute exige 15 a 255 caracteres.',
    minLength: 15,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(15, 255, {
    message: 'reasonText deve ter entre 15 e 255 caracteres quando informado',
  })
  reasonText?: string;

  @ApiPropertyOptional({
    description:
      'Nota sob bloqueio de ofício do município. Informado pelo chamador ' +
      'enquanto não há consulta automatizada ao cadastro municipal.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasOfficialBlock?: boolean;
}
