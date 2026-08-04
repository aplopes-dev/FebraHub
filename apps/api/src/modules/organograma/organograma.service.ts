import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AtualizarMembroDto, CriarMembroDto } from './organograma.dto';

/**
 * CRUD raso sobre org_membros — o grafo em si é montado no front, que
 * conhece o desenho (anéis, cores por setor). Aqui só garantimos ordem
 * estável: setor → ordem → nome, a mesma em toda listagem.
 */
@Injectable()
export class OrganogramaService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.orgMembro.findMany({
      where: { ativo: true },
      orderBy: [{ setor: 'asc' }, { ordem: 'asc' }, { nome: 'asc' }],
    });
  }

  criar(dto: CriarMembroDto) {
    return this.prisma.orgMembro.create({
      data: {
        tipo: dto.tipo,
        nome: dto.nome,
        funcao: dto.funcao,
        setor: dto.setor,
        ordem: dto.ordem ?? 0,
      },
    });
  }

  async atualizar(id: string, dto: AtualizarMembroDto) {
    const existente = await this.prisma.orgMembro.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Membro não encontrado.');
    return this.prisma.orgMembro.update({
      where: { id },
      data: { ...dto, atualizadoEm: new Date() },
    });
  }

  /** Exclusão real (não soft): o organograma é cadastro vivo, sem histórico
   *  a preservar — quem saiu, saiu. `ativo` existe para rascunho/pausa. */
  async excluir(id: string) {
    const existente = await this.prisma.orgMembro.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Membro não encontrado.');
    await this.prisma.orgMembro.delete({ where: { id } });
    return { ok: true };
  }
}
