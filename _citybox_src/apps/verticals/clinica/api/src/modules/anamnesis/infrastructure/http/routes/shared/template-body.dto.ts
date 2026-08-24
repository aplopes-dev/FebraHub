import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ANAMNESIS_QUESTION_TYPES } from '../../../../domain/anamnesis-question-options';

export class AnamnesisQuestionOptionBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  value!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowsOther?: boolean;
}

export class TemplateQuestionRefDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  questionId!: string;

  @ApiProperty()
  @IsBoolean()
  active!: boolean;
}

export class CustomQuestionBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;

  @ApiProperty({ enum: ANAMNESIS_QUESTION_TYPES })
  @IsIn(ANAMNESIS_QUESTION_TYPES)
  type!: (typeof ANAMNESIS_QUESTION_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  auxiliaryText?: string;

  @ApiPropertyOptional({ type: [AnamnesisQuestionOptionBodyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnamnesisQuestionOptionBodyDto)
  options?: AnamnesisQuestionOptionBodyDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  generatesAlert?: boolean;

  @ApiPropertyOptional({ enum: ['yes', 'no'] })
  @IsOptional()
  @IsIn(['yes', 'no'])
  alertWhen?: 'yes' | 'no';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  alertName?: string;
}

export class TemplateBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'] as const)
  status!: 'active' | 'inactive';

  @ApiProperty({ type: [TemplateQuestionRefDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateQuestionRefDto)
  templateQuestions!: TemplateQuestionRefDto[];

  @ApiProperty({ type: [CustomQuestionBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomQuestionBodyDto)
  customQuestions!: CustomQuestionBodyDto[];
}

export class UpdateTemplateStatusBodyDto {
  @ApiProperty({ enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'] as const)
  status!: 'active' | 'inactive';
}

export class ListQuestionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
