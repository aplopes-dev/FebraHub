import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { FornecedorDto } from './fornecedores.dto';

const operador = (u: UsuarioLogado) =>
  u.papel === 'admin' || u.permissoes.includes('compras.operar');

const soDigitos = (v?: string | null) => (v ? v.replace(/\D/g, '') : undefined) || undefined;
const limpo = (v?: string | null) => {
  const t = v?.trim();
  return t ? t : undefined;
};

/**
 * Cadastro corporativo ÚNICO de fornecedores (PRD Compras §36/§37). Referenciado
 * pelas cotações e pedidos de compra; nunca duplicado por módulo/setor.
 */
@Injectable()
export class FornecedoresService {
  constructor(private readonly prisma: PrismaService) {}

  private exigeOperador(u: UsuarioLogado) {
    if (!operador(u)) throw new ForbiddenException('Esta ação exige permissão de Compras.');
  }

  private dados(dto: FornecedorDto) {
    return {
      razaoSocial: dto.razaoSocial.trim(),
      nomeFantasia: limpo(dto.nomeFantasia),
      documento: soDigitos(dto.documento),
      inscricao: limpo(dto.inscricao),
      email: limpo(dto.email),
      telefone: limpo(dto.telefone),
      whatsapp: limpo(dto.whatsapp),
      endereco: limpo(dto.endereco),
      cidade: limpo(dto.cidade),
      uf: limpo(dto.uf)?.slice(0, 2).toUpperCase(),
      cep: soDigitos(dto.cep),
      categorias: (dto.categorias ?? [])
        .map((c) => c.trim())
        .filter(Boolean),
      banco: limpo(dto.banco),
      agencia: limpo(dto.agencia),
      conta: limpo(dto.conta),
      chavePix: limpo(dto.chavePix),
      prazoMedioDias: dto.prazoMedioDias,
      condicoesComerciais: limpo(dto.condicoesComerciais),
      situacao: dto.situacao ?? 'ativo',
      observacoes: limpo(dto.observacoes),
    };
  }

  async listar(u: UsuarioLogado, busca?: string, situacao?: string) {
    if (!operador(u) && !u.permissoes.includes('compras.ver'))
      throw new ForbiddenException();
    const termo = busca?.trim();
    return this.prisma.fornecedor.findMany({
      where: {
        ...(situacao ? { situacao } : {}),
        ...(termo
          ? {
              OR: [
                { razaoSocial: { contains: termo, mode: 'insensitive' } },
                { nomeFantasia: { contains: termo, mode: 'insensitive' } },
                { documento: { contains: termo.replace(/\D/g, '') || termo } },
                { categorias: { has: termo } },
              ],
            }
          : {}),
      },
      include: { contatos: { orderBy: { principal: 'desc' } }, _count: { select: { pedidos: true, cotacoes: true } } },
      orderBy: [{ situacao: 'asc' }, { razaoSocial: 'asc' }],
      take: 300,
    });
  }

  /** Lista enxuta para o seletor no formulário de cotação (só ativos). */
  async picker(busca?: string) {
    const termo = busca?.trim();
    return this.prisma.fornecedor.findMany({
      where: {
        situacao: { in: ['ativo', 'em_homologacao'] },
        ...(termo
          ? {
              OR: [
                { razaoSocial: { contains: termo, mode: 'insensitive' } },
                { nomeFantasia: { contains: termo, mode: 'insensitive' } },
                { documento: { contains: termo.replace(/\D/g, '') || termo } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        razaoSocial: true,
        nomeFantasia: true,
        documento: true,
        email: true,
        telefone: true,
        whatsapp: true,
        condicoesComerciais: true,
        prazoMedioDias: true,
      },
      orderBy: { razaoSocial: 'asc' },
      take: 30,
    });
  }

  async obter(id: string) {
    const f = await this.prisma.fornecedor.findUnique({
      where: { id },
      include: {
        contatos: { orderBy: { principal: 'desc' } },
        pedidos: {
          select: {
            id: true,
            numero: true,
            valorTotal: true,
            previsaoEntrega: true,
            enviadoEm: true,
            criadoEm: true,
            solicitacaoId: true,
          },
          orderBy: { criadoEm: 'desc' },
          take: 50,
        },
        cotacoes: {
          select: {
            id: true,
            valorTotal: true,
            escolhida: true,
            criadaEm: true,
            solicitacaoId: true,
          },
          orderBy: { criadaEm: 'desc' },
          take: 50,
        },
      },
    });
    if (!f) throw new NotFoundException('Fornecedor não encontrado.');
    // Consolidação simples do histórico (§37): totais e prazo médio real.
    const totalComprado = f.pedidos.reduce((s, p) => s + Number(p.valorTotal), 0);
    return {
      ...f,
      resumo: {
        pedidos: f.pedidos.length,
        cotacoes: f.cotacoes.length,
        cotacoesGanhas: f.cotacoes.filter((c) => c.escolhida).length,
        totalComprado,
      },
    };
  }

  async criar(dto: FornecedorDto, u: UsuarioLogado) {
    this.exigeOperador(u);
    const dados = this.dados(dto);
    if (dados.documento) await this.exigeDocumentoLivre(dados.documento);
    return this.prisma.fornecedor.create({
      data: {
        ...dados,
        criadoPor: u.id,
        contatos: dto.contatos?.length
          ? {
              create: dto.contatos.map((c) => ({
                nome: c.nome.trim(),
                cargo: limpo(c.cargo),
                email: limpo(c.email),
                telefone: limpo(c.telefone),
                principal: c.principal ?? false,
              })),
            }
          : undefined,
      },
      include: { contatos: true },
    });
  }

  async atualizar(id: string, dto: FornecedorDto, u: UsuarioLogado) {
    this.exigeOperador(u);
    const atual = await this.prisma.fornecedor.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Fornecedor não encontrado.');
    const dados = this.dados(dto);
    if (dados.documento && dados.documento !== atual.documento)
      await this.exigeDocumentoLivre(dados.documento);
    return this.prisma.$transaction(async (tx) => {
      const f = await tx.fornecedor.update({ where: { id }, data: dados });
      if (dto.contatos) {
        await tx.fornecedorContato.deleteMany({ where: { fornecedorId: id } });
        if (dto.contatos.length)
          await tx.fornecedorContato.createMany({
            data: dto.contatos.map((c) => ({
              fornecedorId: id,
              nome: c.nome.trim(),
              cargo: limpo(c.cargo),
              email: limpo(c.email),
              telefone: limpo(c.telefone),
              principal: c.principal ?? false,
            })),
          });
      }
      return tx.fornecedor.findUnique({ where: { id: f.id }, include: { contatos: true } });
    });
  }

  /** Alterna situação (ativar/inativar/bloquear) sem apagar o cadastro. */
  async situacao(id: string, situacao: string, u: UsuarioLogado) {
    this.exigeOperador(u);
    if (!['ativo', 'inativo', 'bloqueado', 'em_homologacao'].includes(situacao))
      throw new BadRequestException('Situação inválida.');
    const atual = await this.prisma.fornecedor.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Fornecedor não encontrado.');
    return this.prisma.fornecedor.update({ where: { id }, data: { situacao } });
  }

  private async exigeDocumentoLivre(documento: string) {
    const existe = await this.prisma.fornecedor.findFirst({
      where: { documento },
      select: { id: true, razaoSocial: true },
    });
    if (existe)
      throw new BadRequestException(
        `Já existe um fornecedor com este CPF/CNPJ: ${existe.razaoSocial}.`,
      );
  }
}
