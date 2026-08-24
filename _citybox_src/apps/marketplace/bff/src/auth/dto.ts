import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'camila@email.com', description: 'E-mail da conta' })
  @IsString()
  @IsNotEmpty()
  account!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ description: 'Vincula o onboarding pré-login à conta' })
  @IsOptional()
  @IsBoolean()
  hasSeenOnboarding?: boolean;
}

export class RegisterDto {
  @ApiProperty({ example: 'Camila Souza' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'camila@email.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+5511987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ description: 'Vincula o onboarding pré-login à conta' })
  @IsOptional()
  @IsBoolean()
  hasSeenOnboarding?: boolean;
}

export class GoogleLoginDto {
  @ApiPropertyOptional({ description: 'Google ID token' })
  @IsOptional()
  @IsString()
  idToken?: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'camila@email.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recebido por e-mail' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ minLength: 4 })
  @IsString()
  @MinLength(4)
  password!: string;

  @ApiPropertyOptional({ description: 'Confirmação da senha (validada se enviada)' })
  @IsOptional()
  @IsString()
  confirmPassword?: string;
}

export class OnboardingDto {
  @ApiPropertyOptional({ description: 'Identificador do device (pré-login)' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasSeenOnboarding?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  seen?: boolean;
}

export class MeOnboardingDto {
  @ApiProperty()
  @IsBoolean()
  hasSeenOnboarding!: boolean;
}
