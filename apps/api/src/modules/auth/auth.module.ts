import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Global porque o SessaoGuard é um guard de aplicação: ele é instanciado no
 * escopo do AppModule e precisa do JwtService lá, não aqui dentro.
 *
 * O JwtModule sobe sem segredo de propósito — cada chamada passa o seu, já que
 * o token de acesso e o de refresh são assinados com chaves diferentes. Uma
 * chave só faria um valer como o outro.
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
