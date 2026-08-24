import { IsOptional, IsString } from 'class-validator';

export class CheckoutCustomerDto {
  @IsString()
  name!: string;

  @IsString()
  cpfCnpj!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
