import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { AvaliacaoDto, MaestroAnotacaoDto, RetencaoDto } from './dto/pedagogico.dto';

@Injectable()
export class PedagogicoService {
  constructor(private readonly prisma: PrismaService) {}

  async salvarAvaliacao(dto: AvaliacaoDto, u: UsuarioLogado) {
    const criado = await this.prisma.fatoAvaliacao.create({
      data: {
        fonte: dto.fonte,
        curso: dto.curso,
        treinador: dto.treinador,
        dataCurso: new Date(dto.data_curso),
        turma: dto.turma ?? null,
        respondentes: dto.respondentes,
        qConteudo: dto.q_conteudo ?? null,
        qClareza: dto.q_clareza ?? null,
        qMaterial: dto.q_material ?? null,
        qAplicacao: dto.q_aplicacao ?? null,
        qDominio: dto.q_dominio ?? null,
        qPontualidade: dto.q_pontualidade ?? null,
        qDuvidas: dto.q_duvidas ?? null,
        nps: dto.nps ?? null,
        notaTreinador: dto.nota_treinador ?? null,
        comentario: dto.comentario ?? null,
      },
    });
    await this.auditar(u.id, 'avaliacao_criada', `fato_avaliacao:${criado.id}`);
    return { id: Number(criado.id) };
  }

  async salvarMaestroAnotacao(dto: MaestroAnotacaoDto, u: UsuarioLogado) {
    const dados = {
      comoGostaSerChamado: dto.como_gosta_ser_chamado ?? null,
      cargo: dto.cargo ?? null,
      empresa: dto.empresa ?? null,
      faturamento: dto.faturamento ?? null,
      observacoes: dto.observacoes ?? null,
      atualizadoEm: new Date(),
    };
    await this.prisma.maestroAnotacao.upsert({
      where: { alunoId: dto.aluno_id },
      create: { alunoId: dto.aluno_id, ...dados },
      update: dados,
    });
    await this.auditar(u.id, 'maestro_anotado', `maestro_anotacao:${dto.aluno_id}`);
    return { aluno_id: dto.aluno_id };
  }

  async salvarRetencao(dto: RetencaoDto, u: UsuarioLogado) {
    const dados = {
      nomeCliente: dto.nome_cliente,
      curso: dto.curso,
      motivoCancelamento: dto.motivo_cancelamento ?? null,
      dataLigacao: dto.data_ligacao ? new Date(dto.data_ligacao) : null,
      desfecho: dto.desfecho ?? 'pendente',
      observacoes: dto.observacoes ?? null,
    };

    // Sem id insere; com id atualiza (é assim que "pendente" vira "retido"
    // depois da ligação). O registrado_por só é gravado na criação: quem
    // atualiza o desfecho depois não substitui quem abriu o caso.
    if (dto.id != null) {
      const r = await this.prisma.fatoRetencao.update({
        where: { id: BigInt(dto.id) },
        data: dados,
      });
      await this.auditar(u.id, 'retencao_atualizada', `fato_retencao:${r.id}`);
      return { id: Number(r.id) };
    }

    const r = await this.prisma.fatoRetencao.create({
      data: { ...dados, registradoPor: u.email },
    });
    await this.auditar(u.id, 'retencao_criada', `fato_retencao:${r.id}`);
    return { id: Number(r.id) };
  }

  private async auditar(usuarioId: string, acao: string, recurso: string) {
    await this.prisma.auditoriaAcesso
      .create({ data: { usuarioId, acao, recurso } })
      .catch(() => undefined);
  }
}
