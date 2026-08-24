import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectService } from '../common/inject.js';
import { toApiUser, type ConsumerUserRecord } from '../users/users.service.js';
import { CurrentUser, Public } from './jwt.guard.js';
import { AuthService } from './auth.service.js';
import {
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  LogoutDto,
  MeOnboardingDto,
  OnboardingDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto.js';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(@InjectService(AuthService) private readonly auth: AuthService) {}

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login por e-mail/senha (Direct Access Grant via BFF)' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('auth/register')
  @ApiOperation({ summary: 'Registro de conta consumidora' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('auth/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login Google (ainda não disponível)' })
  loginGoogle(@Body() _dto: GoogleLoginDto) {
    return this.auth.loginGoogle();
  }

  @Public()
  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renova o access token' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Get('auth/session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sessão atual (restaura login no Splash)' })
  session(@CurrentUser() user: ConsumerUserRecord) {
    return { user: toApiUser(user), isAuthenticated: true };
  }

  @Public()
  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout (tolerante — revoga refresh token se enviado)' })
  logout(@Body() dto: LogoutDto) {
    return this.auth.logout(dto);
  }

  @Public()
  @Post('auth/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicita redefinição de senha (resposta sempre genérica)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Post('auth/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefine a senha com o token do e-mail' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Public()
  @Post('auth/onboarding')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Onboarding pré-login (estado fica no device)' })
  onboarding(@Body() dto: OnboardingDto) {
    return this.auth.onboarding(dto);
  }

  @Patch('me/onboarding')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marca o onboarding como visto na conta' })
  meOnboarding(@CurrentUser() user: ConsumerUserRecord, @Body() dto: MeOnboardingDto) {
    return this.auth.setOnboarding(user, dto.hasSeenOnboarding);
  }
}
