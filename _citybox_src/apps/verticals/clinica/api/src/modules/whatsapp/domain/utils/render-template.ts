export type TemplateVars = {
  nome_paciente?: string;
  nome_clinica?: string;
  data?: string;
  hora?: string;
  dia_semana?: string;
  telefone_clinica?: string;
};

const VAR_PATTERN = /\{([a-z_]+)\}/g;

export function renderWhatsappTemplate(
  body: string,
  vars: TemplateVars,
): string {
  return body.replace(VAR_PATTERN, (_match, key: string) => {
    const value = vars[key as keyof TemplateVars];
    return value ?? '';
  });
}
