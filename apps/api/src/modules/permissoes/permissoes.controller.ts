/**
 * Administração de acessos: o catálogo de permissões, os perfis e os
 * usuários. Duas permissões diferentes governam as duas metades —
 * `perfis.gerenciar` decide o QUE existe para conceder, `usuarios.gerenciar`
 * decide QUEM recebe. Separar as duas permite entregar o cadastro de pessoas
 * ao TI sem entregar junto o desenho dos acessos.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import {
  AtualizarPerfilDto,
  AtualizarUsuarioDto,
  CriarPerfilDto,
  CriarUsuarioDto,
} from './permissoes.dto';
import { PermissoesService } from './permissoes.service';

@ApiTags('permissoes')
@Controller()
export class PermissoesController {
  constructor(private readonly service: PermissoesService) {}

  @Get('permissoes/catalogo')
  // Quem cadastra usuário também precisa ler o catálogo para entender o que
  // cada perfil concede — daí as duas permissões aceitas.
  @ExigePermissao('perfis.gerenciar', 'usuarios.gerenciar')
  @ApiOperation({ summary: 'Permissões existentes, agrupadas para a tela' })
  @ApiOkResponse({ description: '{ grupos: GrupoPermissoes[] }' })
  catalogo() {
    return this.service.catalogo();
  }

  /* ---------------------------------- perfis --------------------------------- */

  @Get('perfis')
  @ExigePermissao('perfis.gerenciar', 'usuarios.gerenciar')
  @ApiOperation({ summary: 'Perfis de acesso, com quantos usuários cada um tem' })
  listarPerfis() {
    return this.service.listarPerfis();
  }

  @Post('perfis')
  @ExigePermissao('perfis.gerenciar')
  @ApiOperation({ summary: 'Cria um perfil de acesso' })
  criarPerfil(@Body() dto: CriarPerfilDto) {
    return this.service.criarPerfil(dto);
  }

  @Patch('perfis/:id')
  @ExigePermissao('perfis.gerenciar')
  @ApiOperation({ summary: 'Altera nome, descrição ou permissões (perfil de sistema é recusado)' })
  atualizarPerfil(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarPerfilDto) {
    return this.service.atualizarPerfil(id, dto);
  }

  @Delete('perfis/:id')
  @ExigePermissao('perfis.gerenciar')
  @ApiOperation({ summary: 'Exclui um perfil sem usuários vinculados' })
  excluirPerfil(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.excluirPerfil(id);
  }

  /* --------------------------------- usuários -------------------------------- */

  @Get('usuarios')
  @ExigePermissao('usuarios.gerenciar')
  @ApiOperation({ summary: 'Contas do hub, com perfil de acesso e setores' })
  listarUsuarios() {
    return this.service.listarUsuarios();
  }

  @Post('usuarios')
  @ExigePermissao('usuarios.gerenciar')
  @ApiOperation({ summary: 'Cria a conta e devolve a senha temporária UMA vez' })
  criarUsuario(@Body() dto: CriarUsuarioDto, @Usuario() autor: UsuarioLogado) {
    return this.service.criarUsuario(dto, autor);
  }

  @Patch('usuarios/:id')
  @ExigePermissao('usuarios.gerenciar')
  @ApiOperation({ summary: 'Altera perfil de acesso, setores, papel e situação' })
  atualizarUsuario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarUsuarioDto,
    @Usuario() autor: UsuarioLogado,
  ) {
    return this.service.atualizarUsuario(id, dto, autor);
  }

  @Post('usuarios/:id/senha-temporaria')
  @ExigePermissao('usuarios.gerenciar')
  @ApiOperation({ summary: 'Gera outra senha temporária e derruba as sessões da pessoa' })
  redefinirSenha(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.redefinirSenha(id);
  }
}
