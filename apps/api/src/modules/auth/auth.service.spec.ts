/**
 * A parte do auth que quebrava em produção, testada com relógio controlado
 * (jest fake timers + setSystemTime): rotação, corrida benigna, reuso,
 * deslizamento com teto absoluto e unidades de TTL. Nenhum teste espera
 * expiração real — o tempo anda por setSystemTime.
 */
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ttlMs } from '../../config/configuracao';
import { PERMISSOES } from '../permissoes/catalogo';

const SEG_ACESSO = 'segredo-de-acesso-com-32-caracteres!';
const SEG_REFRESH = 'segredo-de-refresh-com-32-caracteres';

const CFG = {
  jwt: {
    acessoSegredo: SEG_ACESSO,
    refreshSegredo: SEG_REFRESH,
    acessoTtl: '15m',
    refreshTtl: '30d',
    sessaoTetoTtl: '90d',
  },
  cookie: { segredo: 'x'.repeat(32), seguro: true, sameSite: 'lax' },
} as never;

const PERFIL = {
  id: 'u-1',
  email: 'a@b.c',
  nome: 'Teste',
  papel: 'admin' as const,
  setor: 'geral',
  setores: ['geral'],
  // Admin recebe o catálogo inteiro (ver permissoesEfetivas); aqui basta a
  // forma do campo — estes testes são de rotação de sessão, não de acesso.
  permissoes: [...PERMISSOES],
  perfilAcesso: null,
};

const USUARIO_BANCO = { ...PERFIL, ativo: true, setores: [{ setor: 'geral' }] };

function fabricar() {
  const prisma = {
    sessao: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    usuario: { findUnique: jest.fn().mockResolvedValue(USUARIO_BANCO), update: jest.fn() },
    tentativaLogin: { count: jest.fn().mockResolvedValue(0), create: jest.fn(), deleteMany: jest.fn() },
    auditoriaAcesso: { create: jest.fn().mockResolvedValue({}) },
  };
  const config = { get: () => CFG } as never;
  const service = new AuthService(prisma as never, new JwtService({}), config);
  return { prisma, service };
}

/** A sessão como emitirTokens grava: reconstrói a partir do create mockado. */
function sessaoGravada(prisma: ReturnType<typeof fabricar>['prisma']) {
  const chamada = prisma.sessao.create.mock.calls.at(-1)?.[0] as { data: Record<string, unknown> };
  return chamada.data;
}

describe('AuthService — emissão e rotação com relógio controlado', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    jest.setSystemTime(new Date('2026-08-02T12:00:00Z'));
  });
  afterEach(() => jest.useRealTimers());

  it('ttlMs converte cada unidade certa (o bug de s×ms fica impossível)', () => {
    expect(ttlMs('30s')).toBe(30_000);
    expect(ttlMs('15m')).toBe(900_000);
    expect(ttlMs('24h')).toBe(86_400_000);
    expect(ttlMs('30d')).toBe(2_592_000_000);
    expect(ttlMs('lixo')).toBe(ttlMs('30d')); // inválido cai no padrão
  });

  it('emite par com refresh deslizante e teto absoluto de 90d', async () => {
    const { prisma, service } = fabricar();
    await service.emitirTokens(PERFIL, '1.1.1.1', 'jest');
    const sessao = sessaoGravada(prisma);
    const agora = Date.now();
    expect((sessao.expiraEm as Date).getTime()).toBe(agora + ttlMs('30d'));
    expect((sessao.absolutaExpiraEm as Date).getTime()).toBe(agora + ttlMs('90d'));
  });

  it('perto do teto, o deslize é CAPADO: expiraEm nunca passa do absoluto', async () => {
    const { prisma, service } = fabricar();
    const teto = new Date(Date.now() + ttlMs('10d')); // faltam só 10 dias
    await service.emitirTokens(PERFIL, '1.1.1.1', 'jest', { teto });
    const sessao = sessaoGravada(prisma);
    expect((sessao.expiraEm as Date).getTime()).toBe(teto.getTime()); // 30d > 10d → capa
  });

  it('renovação válida ROTACIONA: CAS marca a antiga com o id da sucessora', async () => {
    const { prisma, service } = fabricar();
    const { refresh } = await service.emitirTokens(PERFIL, '1.1.1.1', 'jest');
    const gravada = sessaoGravada(prisma);

    jest.setSystemTime(Date.now() + ttlMs('15m') + 1000); // acesso venceu; refresh vale
    prisma.sessao.findUnique.mockResolvedValue({
      id: gravada.id, usuarioId: PERFIL.id, tokenHash: gravada.tokenHash,
      revogadaEm: null, expiraEm: gravada.expiraEm, absolutaExpiraEm: gravada.absolutaExpiraEm,
    });

    const r = await service.renovar(refresh, '1.1.1.1', 'jest');
    expect(r.acesso).toBeTruthy();
    const cas = prisma.sessao.updateMany.mock.calls.at(-1)?.[0] as {
      where: Record<string, unknown>; data: Record<string, unknown>;
    };
    expect(cas.where).toMatchObject({ id: gravada.id, revogadaEm: null });
    expect(cas.data.substituidaPor).toBe(sessaoGravada(prisma).id); // aponta a nova
    // a sucessora herda o teto da família (não ganha 90d novos)
    expect((sessaoGravada(prisma).absolutaExpiraEm as Date).getTime())
      .toBe((gravada.absolutaExpiraEm as Date).getTime());
  });

  it('corrida benigna (CAS count=0) REEMITE sem derrubar ninguém', async () => {
    const { prisma, service } = fabricar();
    const { refresh } = await service.emitirTokens(PERFIL, '1.1.1.1', 'jest');
    const gravada = sessaoGravada(prisma);
    prisma.sessao.findUnique.mockResolvedValue({
      id: gravada.id, usuarioId: PERFIL.id, tokenHash: gravada.tokenHash,
      revogadaEm: null, expiraEm: gravada.expiraEm, absolutaExpiraEm: gravada.absolutaExpiraEm,
    });
    prisma.sessao.updateMany.mockResolvedValue({ count: 0 }); // outra aba venceu AGORA

    const r = await service.renovar(refresh, '1.1.1.1', 'jest');
    expect(r.acesso).toBeTruthy(); // o perdedor ganha sessão nova mesmo assim
    // revogarTodas NÃO rodou: o único updateMany foi o próprio CAS
    const grandes = prisma.sessao.updateMany.mock.calls.filter(
      (c) => (c[0] as { where: { usuarioId?: string } }).where.usuarioId,
    );
    expect(grandes).toHaveLength(0);
  });

  it('reuso (revogada NA LEITURA) derruba todas as sessões e audita', async () => {
    const { prisma, service } = fabricar();
    const { refresh } = await service.emitirTokens(PERFIL, '1.1.1.1', 'jest');
    const gravada = sessaoGravada(prisma);
    prisma.sessao.findUnique.mockResolvedValue({
      id: gravada.id, usuarioId: PERFIL.id, tokenHash: gravada.tokenHash,
      revogadaEm: new Date(), // já rotacionada antes desta chamada
      expiraEm: gravada.expiraEm, absolutaExpiraEm: gravada.absolutaExpiraEm,
    });

    await expect(service.renovar(refresh, '1.1.1.1', 'jest')).rejects.toMatchObject({
      response: { codigo: 'REFRESH_REUSO' },
    });
    expect(prisma.sessao.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { usuarioId: PERFIL.id, revogadaEm: null } }),
    );
    expect(prisma.auditoriaAcesso.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ acao: 'refresh_reuso' }) }),
    );
  });

  it('refresh vencido (expiraEm no passado) responde REFRESH_EXPIRADO', async () => {
    const { prisma, service } = fabricar();
    const { refresh } = await service.emitirTokens(PERFIL, '1.1.1.1', 'jest');
    const gravada = sessaoGravada(prisma);
    jest.setSystemTime(Date.now() + ttlMs('1d'));
    prisma.sessao.findUnique.mockResolvedValue({
      id: gravada.id, usuarioId: PERFIL.id, tokenHash: gravada.tokenHash,
      revogadaEm: null,
      expiraEm: new Date(Date.now() - 1000), // banco diz vencido
      absolutaExpiraEm: gravada.absolutaExpiraEm,
    });
    await expect(service.renovar(refresh, '1.1.1.1', 'jest')).rejects.toMatchObject({
      response: { codigo: 'REFRESH_EXPIRADO' },
    });
  });

  it('teto absoluto atingido encerra a família mesmo com expiraEm válido', async () => {
    const { prisma, service } = fabricar();
    const { refresh } = await service.emitirTokens(PERFIL, '1.1.1.1', 'jest');
    const gravada = sessaoGravada(prisma);
    prisma.sessao.findUnique.mockResolvedValue({
      id: gravada.id, usuarioId: PERFIL.id, tokenHash: gravada.tokenHash,
      revogadaEm: null,
      expiraEm: new Date(Date.now() + ttlMs('5d')),
      absolutaExpiraEm: new Date(Date.now() - 1000), // teto no passado
    });
    await expect(service.renovar(refresh, '1.1.1.1', 'jest')).rejects.toMatchObject({
      response: { codigo: 'REFRESH_EXPIRADO' },
    });
  });

  it('usuário desativado não renova', async () => {
    const { prisma, service } = fabricar();
    const { refresh } = await service.emitirTokens(PERFIL, '1.1.1.1', 'jest');
    const gravada = sessaoGravada(prisma);
    prisma.sessao.findUnique.mockResolvedValue({
      id: gravada.id, usuarioId: PERFIL.id, tokenHash: gravada.tokenHash,
      revogadaEm: null, expiraEm: gravada.expiraEm, absolutaExpiraEm: gravada.absolutaExpiraEm,
    });
    prisma.usuario.findUnique.mockResolvedValue({ ...USUARIO_BANCO, ativo: false });
    await expect(service.renovar(refresh, '1.1.1.1', 'jest')).rejects.toMatchObject({
      response: { codigo: 'USUARIO_INATIVO' },
    });
  });

  it('token de ACESSO não vale como refresh (tipo confere antes do banco)', async () => {
    const { service } = fabricar();
    const jwt = new JwtService({});
    const falso = await jwt.signAsync(
      { id: PERFIL.id, jti: 'x', tipo: 'acesso' },
      { secret: SEG_REFRESH, expiresIn: 3600 },
    );
    await expect(service.renovar(falso, '1.1.1.1', 'jest')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sair revoga exatamente a sessão do jti apresentado', async () => {
    const { prisma, service } = fabricar();
    const { refresh } = await service.emitirTokens(PERFIL, '1.1.1.1', 'jest');
    const gravada = sessaoGravada(prisma);
    await service.sair(refresh);
    expect(prisma.sessao.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: gravada.id, revogadaEm: null } }),
    );
  });
});
