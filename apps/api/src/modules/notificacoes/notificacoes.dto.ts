import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const TIPOS_NOTIFICACAO = ['info', 'sucesso', 'alerta', 'erro'] as const;
export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

/** Para quem o comunicado vai. `valor` é o slug do perfil, a chave do setor
 *  ou o uuid da pessoa, conforme o tipo — e é ignorado em 'todos'. */
export const DESTINOS = ['todos', 'perfil', 'setor', 'usuario'] as const;

const aparar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ListarNotificacoesDto {
  @IsOptional()
  @IsBooleanString()
  apenasNaoLidas?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}

export class EnviarNotificacaoDto {
  @Transform(aparar)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  titulo!: string;

  @Transform(aparar)
  @IsString()
  @MinLength(3)
  @MaxLength(600)
  mensagem!: string;

  @IsOptional()
  @IsIn(TIPOS_NOTIFICACAO)
  tipo?: TipoNotificacao;

  /**
   * Rota interna, sempre começando com '/' e sem '//' na frente. A regra é
   * de segurança, não de estilo: '//evil.com' é uma URL absoluta protocol-
   * relative, e o navegador sairia do hub achando que seguiu um link nosso.
   */
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(240)
  @Matches(/^\/(?!\/)[\w\-/?=&.%#]*$/, {
    message: 'O link precisa ser uma rota interna, começando com /',
  })
  href?: string;

  @IsIn(DESTINOS)
  destino!: (typeof DESTINOS)[number];

  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(80)
  valor?: string;
}
