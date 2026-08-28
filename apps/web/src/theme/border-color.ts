/**
 * Traço do sistema — **fonte única**.
 *
 * Todo contorno do projeto sai daqui: campo de formulário, borda de card e de
 * tabela, separador de seção e a linha embaixo do header. Trocar o valor nesta
 * constante troca o traço no app inteiro; nenhum componente fixa cor de borda
 * na mão.
 *
 * É uma cor **translúcida** de propósito: o traço se ajusta sozinho à
 * superfície onde cai (fundo, card, cabeçalho de tabela), em vez de exigir um
 * tom por superfície.
 */
export const BORDER_COLOR = "#17140E21";

/**
 * A contraparte no modo escuro.
 *
 * O traço claro é preto translúcido e desapareceria sobre `#121212` — no
 * escuro a mesma ideia se inverte: branco no mesmo peso.
 */
export const BORDER_COLOR_DARK = "#FFFFFF1F";
