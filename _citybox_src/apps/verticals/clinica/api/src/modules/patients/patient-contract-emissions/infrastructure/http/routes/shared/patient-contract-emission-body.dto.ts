import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertPatientContractEmissionBodyDto {
  @ApiPropertyOptional({
    description: 'Orçamento aprovado vinculado (um contrato por orçamento)',
  })
  @IsOptional()
  @IsUUID()
  budgetId?: string;

  @ApiProperty()
  @IsString()
  templateId!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty()
  @IsString()
  responsibleName!: string;

  @ApiProperty()
  @IsString()
  contractorName!: string;

  @ApiProperty()
  @IsString()
  contractorBirthDate!: string;

  @ApiProperty()
  @IsString()
  contractorCpf!: string;

  @ApiProperty()
  @IsString()
  contractorZip!: string;

  @ApiProperty()
  @IsString()
  contractorStreet!: string;

  @ApiProperty()
  @IsString()
  contractorNeighborhood!: string;

  @ApiProperty()
  @IsString()
  contractorCity!: string;

  @ApiProperty()
  @IsString()
  contractorState!: string;

  @ApiProperty()
  @IsString()
  contractedName!: string;

  @ApiProperty()
  @IsString()
  contractedDocument!: string;

  @ApiProperty()
  @IsString()
  contractedCity!: string;

  @ApiProperty()
  @IsString()
  contractValue!: string;

  @ApiProperty()
  @IsString()
  treatmentsDescription!: string;

  @ApiProperty()
  @IsString()
  contractDate!: string;
}
