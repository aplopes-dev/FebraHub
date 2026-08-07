/* PostCSS entra no app junto com o Tailwind escopado do bloco /brain
   (ver tailwind.config.ts). O plugin só transforma arquivos com diretivas
   @tailwind/@apply — o CSS existente (globals.css etc.) passa intacto. */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
