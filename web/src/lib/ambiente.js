// Um único lugar para saber em que ambiente o front está rodando.
// Produção não define VITE_APP_ENV (ou define "producao") — homologação
// define VITE_APP_ENV=homologacao no Netlify do site de homolog.
export const AMBIENTE = import.meta.env.VITE_APP_ENV || "producao";
export const isHomologacao = AMBIENTE === "homologacao";
