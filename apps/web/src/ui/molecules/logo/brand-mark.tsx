import Image from "next/image";

export type BrandMarkProps = {
  /** Largura em px. Default: 44 (medida do rail no design). */
  width?: number;
  /** Altura em px. Default: 64 — a altura do header do rail. */
  height?: number;
  /** Texto acessível; sem ele a marca é decorativa (`aria-hidden`). */
  title?: string;
  className?: string;
};

/** Arquivo da marca — quadrado, fundo transparente, serve claro e escuro. */
const BRAND_MARK_SRC = "/logo-febracis.webp";

/**
 * Símbolo da marca (Febracis).
 *
 * A caixa mantém as medidas do design (44×64 no rail) e a marca é **contida**
 * nela: o arquivo é quadrado, então esticar para a caixa deformaria. Quem
 * chama continua passando `width`/`height` da caixa, não da imagem.
 */
export function BrandMark({
  width = 44,
  height = 64,
  title,
  className,
}: BrandMarkProps) {
  const side = Math.min(width, height);

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width,
        height,
        flexShrink: 0,
      }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <Image
        src={BRAND_MARK_SRC}
        alt=""
        width={side}
        height={side}
        priority
        style={{ width: side, height: side, objectFit: "contain" }}
      />
    </span>
  );
}
