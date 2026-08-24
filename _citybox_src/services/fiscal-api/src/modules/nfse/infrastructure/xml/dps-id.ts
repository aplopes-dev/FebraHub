/// Monta o `Id` (atributo `TSIdDPS`, 45 caracteres) exigido pelo schema
/// oficial: "DPS" + Cód.Mun IBGE (7) + Tipo de Inscrição Federal (1) +
/// Inscrição Federal (14, CPF completa com zeros à esquerda) + Série (5) +
/// Número (15).
///
/// ⚠️ O dígito "Tipo de Inscrição Federal" (1=CPF, 2=CNPJ, 3=NIF) não está
/// explicitado nos arquivos XSD em si (só a regra de formação, sem a tabela
/// de valores) — a convenção 1=CPF/2=CNPJ é a mesma usada em outros
/// documentos fiscais nacionais e a mais consistente com a documentação
/// pública da NFS-e Nacional, mas não foi cross-checked contra o Manual de
/// Orientação ao Contribuinte (não disponível neste ambiente). Confirmar
/// antes do primeiro teste real em homologação.
export function buildDpsId(input: {
  cityCodeIbge: string;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  series: string;
  number: string;
}): string {
  const tipoInscricaoFederal = input.documentType === 'CPF' ? '1' : '2';
  const inscricaoFederal = input.document.replace(/\D/g, '').padStart(14, '0');
  const serie = input.series.padStart(5, '0');
  const numero = input.number.padStart(15, '0');

  return `DPS${input.cityCodeIbge}${tipoInscricaoFederal}${inscricaoFederal}${serie}${numero}`;
}
