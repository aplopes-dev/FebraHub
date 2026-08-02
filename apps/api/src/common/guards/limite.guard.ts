import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FastifyRequest } from 'fastify';
import { UsuarioLogado } from '../decorators/usuario.decorator';

/**
 * Rate limit por USUÁRIO quando há sessão, por IP quando não há.
 *
 * Por que não só por IP: o FebraHub é usado de dentro do escritório da
 * Febracis, onde todo mundo sai pelo mesmo IP com NAT. Contando por IP, as
 * seis pessoas dividem uma única cota — e como cada hub carrega de 9 a 16
 * views de uma vez, duas pessoas trocando de aba ao mesmo tempo já derrubavam
 * a cota e o painel voltava 429 com a tela meio carregada.
 *
 * Com a sessão como chave, a cota é de cada pessoa e o vizinho de mesa não
 * consome a sua. Quem não tem sessão continua contado por IP — é lá que mora
 * a força bruta de login, e essa contagem tem que ser por origem mesmo.
 */
@Injectable()
export class LimiteGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const r = req as unknown as FastifyRequest & { usuario?: UsuarioLogado };

    // O SessaoGuard roda depois deste, então `req.usuario` ainda não existe:
    // usamos o cookie de acesso como identidade estável da sessão. Não
    // precisa ser válido — só precisa ser o MESMO entre requisições da mesma
    // pessoa, e um token forjado só serviria para o dono dele se limitar.
    const cookies = (r as unknown as { cookies?: Record<string, string> }).cookies;
    const sessao = cookies?.fh_acesso;
    if (sessao) return `s:${sessao.slice(-32)}`;

    const encaminhado = r.headers?.['x-forwarded-for'];
    const ip =
      typeof encaminhado === 'string' && encaminhado
        ? encaminhado.split(',')[0].trim()
        : (r.ip ?? 'desconhecido');
    return `ip:${ip}`;
  }
}
