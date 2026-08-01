import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class EntrarDto {
  @ApiProperty({ example: 'pessoa@febracis.com.br' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @MaxLength(180)
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  email!: string;

  // Sem MinLength aqui de propósito: validar tamanho no login diria "essa
  // senha nem poderia existir" antes de checar as credenciais.
  @ApiProperty({ example: 'a senha da pessoa' })
  @IsString()
  @MaxLength(200)
  senha!: string;
}

export class TrocarSenhaDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  atual!: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10, { message: 'A nova senha precisa de ao menos 10 caracteres' })
  @MaxLength(200)
  nova!: string;
}
