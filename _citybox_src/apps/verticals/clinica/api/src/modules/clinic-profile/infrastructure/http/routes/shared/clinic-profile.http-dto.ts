import { IsString, MaxLength } from 'class-validator';

export class UpsertClinicProfileDto {
  @IsString()
  clinicName!: string;

  @IsString()
  cnpj!: string;

  @IsString()
  communicationsName!: string;

  @IsString()
  responsible!: string;

  @IsString()
  openingTime!: string;

  @IsString()
  closingTime!: string;

  @IsString()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  mobile!: string;

  @IsString()
  cep!: string;

  @IsString()
  street!: string;

  @IsString()
  number!: string;

  @IsString()
  complement!: string;

  @IsString()
  neighborhood!: string;

  @IsString()
  city!: string;

  @IsString()
  @MaxLength(2)
  state!: string;
}
