import type { MetadataRoute } from "next";

/* Sistema interno: nenhuma página deve ser indexada. O acesso já exige
   sessão, mas o robots.txt evita que a tela de login apareça em busca. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
