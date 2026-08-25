import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UsuarioLogado } from '../../../common/decorators/usuario.decorator';
import {
  BuscarParaCredenciamentoQuery, CheckinQrDto, CredenciarAlunoDto, RegistrarPresencaDto,
} from '../dto/operacional.dto';
import { MatriculasService } from '../matriculas/matriculas.service';
import * as crypto from 'crypto';

/** Salt derivado de um segredo estável — evita expor CPF no QR */
const QR_SECRET = process.env['PEDAGOGICO_QR_SECRET'] ?? 'febracis-qr-fallback-dev';

function gerarTokenQr(matriculaId: string): string {
  return crypto.createHmac('sha256', QR_SECRET)
    .update(matriculaId)
    .digest('base64url')
    .slice(0, 32);
}

function verificarTokenQr(matriculaId: string, token: string): boolean {
  return gerarTokenQr(matriculaId) === token;
}

@Injectable()
export class CredenciamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matriculas: MatriculasService,
  ) {}

  /** Busca aluno para credenciamento por CPF, nome, UUID da matrícula ou token QR */
  async buscarParaCredenciar(q: BuscarParaCredenciamentoQuery) {
    const busca = q.q.trim();

    // Tenta localizar por UUID de matrícula
    if (/^[0-9a-f-]{36}$/i.test(busca)) {
      const m = await this.prisma.pedagogicoMatricula.findUnique({
        where: { id: busca },
        include: { turma: true, credenciamento: true },
      });
      if (m && (!q.turmaId || m.turmaId === q.turmaId)) return [this.formatarParaCredenciamento(m)];
    }

    // Tenta localizar por token QR (32 chars base64url)
    if (busca.length === 32) {
      const candidatas = await this.prisma.pedagogicoMatricula.findMany({
        where: q.turmaId ? { turmaId: q.turmaId } : {},
        include: { turma: true, credenciamento: true },
        take: 2000,
      });
      const encontrada = candidatas.find(m => verificarTokenQr(m.id, busca));
      if (encontrada) return [this.formatarParaCredenciamento(encontrada)];
    }

    // Busca por CPF (somente dígitos), email, telefone ou nome
    const soDigitos = busca.replace(/\D/g, '');
    const where: any = {
      OR: [
        { pessoaNome:     { contains: busca,      mode: 'insensitive' } },
        { pessoaEmail:    { contains: busca,      mode: 'insensitive' } },
        { pessoaCpf:      { contains: soDigitos.length >= 3 ? soDigitos : busca, mode: 'insensitive' } },
        { pessoaTelefone: { contains: soDigitos.length >= 6 ? soDigitos : busca, mode: 'insensitive' } },
      ],
    };
    if (q.turmaId) where.turmaId = q.turmaId;

    const matriculas = await this.prisma.pedagogicoMatricula.findMany({
      where,
      include: { turma: true, credenciamento: true },
      take: 20,
      orderBy: { pessoaNome: 'asc' },
    });

    return matriculas.map(m => this.formatarParaCredenciamento(m));
  }

  /** Credencia o aluno na turma — impede duplicidade */
  async credenciar(dto: CredenciarAlunoDto, turmaId: string, usuario: UsuarioLogado) {
    // Resolve a matrícula pelo identificador (UUID ou token QR)
    let matricula = await this.resolverMatricula(dto.identificador, turmaId);

    // Verificar se já credenciado
    if (matricula.credenciamento) {
      throw new ConflictException({
        codigo: 'JA_CREDENCIADO',
        message: `Aluno já foi credenciado em ${matricula.credenciamento.criadoEm.toISOString()}`,
        credenciadoEm: matricula.credenciamento.criadoEm,
      });
    }

    // Criar credenciamento
    const cred = await this.prisma.pedagogicoCredenciamento.create({
      data: {
        matriculaId: matricula.id,
        turmaId:     matricula.turmaId,
        pessoaId:    matricula.pessoaId,
        tipo:        dto.tipo ?? 'credenciamento',
        dispositivo: dto.dispositivo ?? null,
        usuarioId:   usuario.id as unknown as string,
        observacoes: dto.observacoes ?? null,
      },
    });

    // Atualizar status da matrícula
    await this.prisma.pedagogicoMatricula.update({
      where: { id: matricula.id },
      data:  { status: 'Credenciado', atualizadoEm: new Date() },
    });

    // Registrar na timeline
    await this.matriculas.registrarHistorico(
      matricula.id, 'credenciado', usuario.id,
      `Credenciado via ${dto.dispositivo ?? 'ERP'}`,
      'Matriculado', 'Credenciado', 'usuario',
    );

    return {
      credenciamentoId: cred.id,
      matriculaId:      matricula.id,
      pessoaNome:       matricula.pessoaNome,
      turmaId:          matricula.turmaId,
      criadoEm:         cred.criadoEm,
      tokenQr:          gerarTokenQr(matricula.id),
    };
  }

  /** Check-in via QR Code (dias seguintes) */
  async checkinQr(dto: CheckinQrDto, usuario: UsuarioLogado) {
    // Resolver matrícula pelo token QR
    const candidatas = await this.prisma.pedagogicoMatricula.findMany({
      where: { turmaId: dto.turmaId },
      select: { id: true, pessoaId: true, pessoaNome: true, status: true },
      take: 2000,
    });
    const matricula = candidatas.find(m => verificarTokenQr(m.id, dto.token));
    if (!matricula) throw new NotFoundException({ codigo: 'TOKEN_INVALIDO', message: 'QR Code não reconhecido' });

    // Registrar presença
    return this.registrarPresenca({
      matriculaId: matricula.id,
      turmaId:     dto.turmaId,
      diaNume:     dto.diaNume ?? 1,
      sessao:      dto.sessao ?? 'geral',
      dispositivo: dto.dispositivo ?? null,
    } as RegistrarPresencaDto, usuario);
  }

  /** Registra presença (por dia e sessão) */
  async registrarPresenca(dto: RegistrarPresencaDto, usuario: UsuarioLogado) {
    const matricula = await this.prisma.pedagogicoMatricula.findUnique({ where: { id: dto.matriculaId } });
    if (!matricula) throw new NotFoundException({ codigo: 'MATRICULA_NAO_ENCONTRADA', message: 'Matrícula não encontrada' });

    const diaNume = dto.diaNume ?? 1;
    const sessao  = dto.sessao  ?? 'geral';

    // UPSERT — se já existe, atualiza; se não, cria
    const presenca = await this.prisma.pedagogicoPresenca.upsert({
      where: { matriculaId_diaNume_sessao: { matriculaId: dto.matriculaId, diaNume, sessao } },
      create: {
        matriculaId: dto.matriculaId,
        turmaId:     dto.turmaId,
        pessoaId:    matricula.pessoaId,
        diaNume,
        sessao,
        status:      dto.status ?? 'presente',
        entradaEm:   new Date(),
        dispositivo: dto.dispositivo ?? null,
        usuarioId:   usuario.id as unknown as string,
        observacoes: dto.observacoes ?? null,
      },
      update: {
        status:      dto.status ?? 'presente',
        entradaEm:   new Date(),
        usuarioId:   usuario.id as unknown as string,
        observacoes: dto.observacoes ?? null,
      },
    });

    // Registrar na timeline
    await this.matriculas.registrarHistorico(
      dto.matriculaId, 'presenca', usuario.id,
      `Presença registrada — Dia ${diaNume} / ${sessao}`,
      null, dto.status ?? 'presente', 'usuario',
    );

    return presenca;
  }

  /** Gera o token QR de uma matrícula para exibição no crachá/app */
  async gerarQr(matriculaId: string, usuario: UsuarioLogado) {
    const m = await this.prisma.pedagogicoMatricula.findUnique({ where: { id: matriculaId } });
    if (!m) throw new NotFoundException({ codigo: 'MATRICULA_NAO_ENCONTRADA', message: 'Matrícula não encontrada' });
    return {
      matriculaId,
      token: gerarTokenQr(matriculaId),
      pessoaNome: m.pessoaNome,
      cursoNome:  m.cursoNome,
    };
  }

  private async resolverMatricula(identificador: string, turmaId: string) {
    // UUID direto
    if (/^[0-9a-f-]{36}$/i.test(identificador)) {
      const m = await this.prisma.pedagogicoMatricula.findUnique({
        where: { id: identificador },
        include: { credenciamento: true },
      });
      if (m) return m;
    }

    // Token QR
    if (identificador.length === 32) {
      const candidatas = await this.prisma.pedagogicoMatricula.findMany({
        where: { turmaId },
        include: { credenciamento: true },
        take: 2000,
      });
      const m = candidatas.find(c => verificarTokenQr(c.id, identificador));
      if (m) return m;
    }

    throw new NotFoundException({ codigo: 'ALUNO_NAO_ENCONTRADO', message: 'Aluno não identificado' });
  }

  private formatarParaCredenciamento(m: any) {
    return {
      matriculaId:   m.id,
      pessoaId:      m.pessoaId,
      pessoaNome:    m.pessoaNome,
      pessoaCpf:     m.pessoaCpf,
      pessoaEmail:   m.pessoaEmail,
      pessoaTelefone: m.pessoaTelefone,
      status:        m.status,
      cursoNome:     m.cursoNome,
      turmaId:       m.turmaId,
      turmaNome:     m.turma?.nome ?? null,
      credenciado:   !!m.credenciamento,
      credenciadoEm: m.credenciamento?.criadoEm?.toISOString() ?? null,
      tokenQr:       gerarTokenQr(m.id),
    };
  }
}
