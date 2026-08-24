/// Códigos de rejeição do Sistema Nacional da NFS-e, extraídos do Anexo I
/// (ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe-v1.01-20260209.xlsx, abas
/// "RN_RECEPCAO_DPS" e "RN DPS_NFS-e") — 441 códigos.
///
/// A decisão de research.md §4 é NÃO replicar as 655 regras de negócio
/// localmente: replicar o validador do governo cria uma segunda fonte de
/// verdade que envelhece a cada nota técnica publicada, e o pior caso é
/// recusar localmente algo que o ambiente nacional aceitaria. Em troca, é
/// preciso traduzir a rejeição em algo acionável — sem isso o operador
/// recebe "E1313" e não sabe se corrige cadastro, corrige o pedido, ou liga
/// para a prefeitura.
///
/// `official` é a mensagem literal do Anexo I (texto autoritativo — não
/// reescrever). `category` deriva dela e determina a orientação ao operador.
///
/// ⚠️ Gerado a partir da planilha oficial. Ao adotar uma versão nova do
/// leiaute, reextrair em vez de editar à mão.

export type NationalErrorCategory =
  | 'CERTIFICATE'
  | 'PAYLOAD'
  | 'REGISTRATION'
  | 'MUNICIPAL'
  | 'DEADLINE'
  | 'LIFECYCLE'
  | 'REQUEST';

export type NationalErrorEntry = {
  category: NationalErrorCategory;
  /// Mensagem literal publicada no Anexo I.
  official: string;
};

/// Orientação ao operador por categoria — o "o que fazer agora".
export const NATIONAL_ERROR_HINTS: Record<NationalErrorCategory, string> = {
  CERTIFICATE:
    'Verifique o certificado digital do emitente: vigência, cadeia ICP-Brasil e correspondência com o CNPJ.',
  PAYLOAD:
    'Falha na montagem ou codificação do documento — defeito da integração, não do preenchimento. Reportar ao time técnico.',
  REGISTRATION:
    'Corrija o cadastro do emitente ou do tomador antes de reenviar.',
  MUNICIPAL:
    'Depende de parametrização ou convênio do município. Se o cadastro estiver correto, contate a prefeitura.',
  DEADLINE:
    'Fora do prazo permitido. Verifique as datas do pedido ou o prazo parametrizado pelo município.',
  LIFECYCLE:
    'Operação incompatível com o estado atual do documento. Consulte os eventos da nota antes de repetir.',
  REQUEST: 'Corrija os dados do pedido de emissão e reenvie.',
};

export const NATIONAL_ERROR_CODES: Record<string, NationalErrorEntry> = {
  E0001: {
    category: 'PAYLOAD',
    official: 'O prazo de aceitação da versão do leiaute da DPS expirou.',
  },
  E0004: {
    category: 'REQUEST',
    official:
      'Conteúdo do identificador informado na DPS difere da concatenação dos campos correspondentes.',
  },
  E0006: {
    category: 'REGISTRATION',
    official:
      'Ambiente informado diverge do ambiente de recebimento para o qual o emitente enviou a DPS.',
  },
  E0008: {
    category: 'DEADLINE',
    official:
      'A data e hora de emissão da DPS deve ser anterior ou igual à data do seu processamento (dhProc) pelo Sistema Nacional NFS-e.',
  },
  E0010: {
    category: 'REQUEST',
    official:
      'A série informada na DPS não pertence à faixa definida para o tipo de emissor utilizado para a sua emissão.',
  },
  E0014: {
    category: 'REGISTRATION',
    official:
      'Conjunto de Série, Número, Código do Município Emissor e CNPJ/CPF informado nesta DPS já existe em uma NFS-e gerada a partir de uma DPS enviada anteriormente.',
  },
  E0015: {
    category: 'DEADLINE',
    official:
      'A data de competência informada na DPS não pode ser posterior à data de emissão (dhEmi) da DPS.',
  },
  E0016: {
    category: 'REGISTRATION',
    official:
      'A data de competência deve ser igual ou posterior à data de ativação do convênio do município emissor informado na DPS, exceto quando o emitente for MEI na data de competëncia informada.',
  },
  E0018: {
    category: 'REGISTRATION',
    official:
      'A data de competência informada na DPS deve ser igual ou posterior à data de inscrição do CNPJ do emitente no cadastro CNPJ.',
  },
  E0020: {
    category: 'REGISTRATION',
    official:
      'A data de competência informada na DPS deve ser igual ou posterior à data de inscrição do CPF do emitente no cadastro CPF.',
  },
  E0023: {
    category: 'MUNICIPAL',
    official:
      'A data de competência informada na DPS deve ser igual ou posterior à data do indicador municipal, registrada no CNC do município correspondente ao município emissor da DPS (cLocEmi).',
  },
  E0025: {
    category: 'MUNICIPAL',
    official:
      'A data de competência informada na DPS deve ser igual ou posterior à data autorizasção de uso do emissores, registrada no CNC do município correspondente ao município emissor da DPS (cLocEmi) para o contribuinte.',
  },
  E0029: {
    category: 'REGISTRATION',
    official:
      'O motivo da emissão não pode ser preenchido se o emitente for o prestador de serviço.',
  },
  E0031: {
    category: 'REGISTRATION',
    official:
      'Não pode haver retenção do ISSQN pelo tomador quando o município de incidência não for o do tomador.',
  },
  E0032: {
    category: 'REGISTRATION',
    official:
      'Não pode haver retenção do ISSQN pelo intermediário quando o município de incidência não for o do intermediário.',
  },
  E0034: {
    category: 'REGISTRATION',
    official:
      'Somente é permitido o preenchimento do campo de chave de acesso de NFS-e rejeitada se o tipo de emitente for Tomador ou Intermediário e o motivo da emissao for por rejeição de NFS-e emitida pelo prestador.',
  },
  E0035: {
    category: 'REGISTRATION',
    official:
      'A chave de acesso de NFS-e informada nesta DPS não possui a ela vinculada o evento de manifestação de rejeição emitido pelo mesmo emitente desta DPS.',
  },
  E0037: {
    category: 'REGISTRATION',
    official:
      'O código do município emissor informado na DPS é inexistente no cadastro de convênio municipal do sistema nacional.',
  },
  E0038: {
    category: 'REGISTRATION',
    official:
      'A situação do convênio do município emissor informado na DPS deve ser "ATIVO" no cadastro de convênio municipal do sistema nacional.',
  },
  E0039: {
    category: 'MUNICIPAL',
    official:
      'O município emissor informado na DPS deve estar parametrizado para utilizar os emissores públicos nacionais, conforme parametrização do município no Sistema Nacional NFS-e.',
  },
  E0041: {
    category: 'REGISTRATION',
    official:
      'O município emissor não corresponde ao município do emitente MEI no CNPJ.',
  },
  E0042: {
    category: 'REQUEST',
    official: 'Chave de NFS-e a ser substituída é inválida.',
  },
  E0044: {
    category: 'REQUEST',
    official:
      'NFS-e não existe na base de dados do autorizador de NFS-e nacional. Informe uma chave de NFS-e existente.',
  },
  E0046: {
    category: 'LIFECYCLE',
    official:
      'Uma NFS-e cancelada não pode ser substituída. Informe uma chave de NFS-e não cancelada anteriormente.',
  },
  E0050: {
    category: 'MUNICIPAL',
    official:
      'Uma NFS-e não pode ser substituída fora do prazo estabelecido pelo município emissor da NFS-e.',
  },
  E0056: {
    category: 'REGISTRATION',
    official:
      'NFS-e não pode ser substituída pois não possui identificação do tomador.',
  },
  E0058: {
    category: 'REGISTRATION',
    official:
      'Não poderá ocorrer a substituição de NFS-e com alteração da identificação do não emitente, conforme parametrização do município emissor da NFS-e.',
  },
  E0060: {
    category: 'DEADLINE',
    official:
      'Os campos data de competência, subitem da lista nacional de serviços, código complementar municipal e local da prestação não podem ser alterados quando a opção do simples nacional for Não Optante (opSimpNac = 1).',
  },
  E0061: {
    category: 'REGISTRATION',
    official:
      'Os campos identificação do Tomador (se identificado na DPS), data de competência (dCompet), e valor do serviço (vServ), não podem ser alterados quando a opção do simples nacional for MEI (opSimpNac = 2) ou ME/EPP (opSimpNac = 3).',
  },
  E0065: {
    category: 'LIFECYCLE',
    official:
      'Não é possível substituição da NFS-e que tenha sido gerada em ambientes geradores diferentes.',
  },
  E0068: {
    category: 'MUNICIPAL',
    official:
      'Não é possível a substituição desta NFS-e pois a mesma possui registro de Evento de Solicitação de Análise Fiscal para Cancelamento de NFS-e aguardando resposta. Para mais informações, consultar a Administração Tributária Municipal do município emissor da NFS-e.',
  },
  E0070: {
    category: 'MUNICIPAL',
    official:
      'Não é possível a substituição desta NFS-e pois já ocorreu uma manifestação de confirmação de serviço. Para mais informações, consultar a Administração Tributária Municipal do município emissor da NFS-e.',
  },
  E0072: {
    category: 'MUNICIPAL',
    official:
      'Não é possível a substituição desta NFS-e pois já ocorreu uma manifestação tácita da NFS-e. Para mais informações, consultar a Administração Tributária Municipal do município emissor da NFS-e.',
  },
  E0074: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido realizar a substituição para NFS-e que possua Evento de Tributos Recolhidos vinculado, conforme parametrização do município de incidência do ISSQN. Para mais informações, consultar a Administração Tributária Municipal do município emissor da NFS-e.',
  },
  E0076: {
    category: 'LIFECYCLE',
    official:
      'Não é permitido realizar a substituição para NFS-e que possua Evento de Bloqueio de Ofício para o Evento de Cancelamento de NFS-e por Substituição vigente.',
  },
  E0078: {
    category: 'REQUEST',
    official:
      'Quando o campo cMotivo = 99, o campo xMotivo deve informado obrigatoriamente.',
  },
  E0080: {
    category: 'REGISTRATION',
    official: 'CNPJ do prestador informado na DPS é inválido.',
  },
  E0082: {
    category: 'REGISTRATION',
    official:
      'CNPJ do emitente prestador não encontrado no cadastro CNPJ na data de competência.',
  },
  E0084: {
    category: 'REGISTRATION',
    official:
      'CNPJ do emitente prestador não possui estabelecimento ou domicílio em um município correspondente ao município emissor, na data de competência informada na DPS, conforme cadastros CNPJ e CNC NFS-e.',
  },
  E0096: {
    category: 'REGISTRATION',
    official: 'CPF do prestador informado na DPS é inválido.',
  },
  E0098: {
    category: 'REGISTRATION',
    official:
      'CPF do emitente prestador não encontrado no cadastro CPF na data de competência.',
  },
  E0099: {
    category: 'REGISTRATION',
    official:
      'CPF do emitente prestador não possui estabelecimento ou domicílio em um município correspondente ao município emissor, na data de competência informada na DPS, conforme cadastro nacional complementar NFS-e (cLocEmi + CPF + IM informados na DPS para o prestador devem existir no CNC NFS-e).',
  },
  E0112: {
    category: 'REGISTRATION',
    official:
      'O prestador de serviço, quando emitente da DPS, não pode ser identificado pelo NIF.',
  },
  E0113: {
    category: 'REGISTRATION',
    official:
      'O NIF ou cNaoNIF do prestador deve ser informado quando o grupo de informações de endereço no exterior do prestador de serviços foi informado.',
  },
  E0114: {
    category: 'REGISTRATION',
    official:
      'O prestador de serviço, quando emitente da DPS, somente pode ser identificado pelo CNPJ ou CPF.',
  },
  E0115: {
    category: 'REGISTRATION',
    official:
      'Valor 0 para o motivo da não informação do NIF do prestador não é permitido na Sefin do Sistema Nacional NFS-e.',
  },
  E0116: {
    category: 'REGISTRATION',
    official:
      'A IM deve ser informada para o emitente prestador do serviço na DPS, conforme informações complementares registradas no CNC NFS-e do município emissor informado na DPS.',
  },
  E0119: {
    category: 'REGISTRATION',
    official:
      'IM do emitente prestador não está autorizado a emitir NFS-e, conforme informações complementares registradas no CNC NFS-e do município emissor informado na DPS.',
  },
  E0120: {
    category: 'REGISTRATION',
    official:
      'IM do prestador não deve ser informado, pois não existem informações complementares registradas no CNC NFS-e do município emissor informado na DPS.',
  },
  E0121: {
    category: 'REGISTRATION',
    official:
      'O nome ou razão social do prestador não deve ser informado quando o emitente da DPS for o próprio prestador.',
  },
  E0122: {
    category: 'REGISTRATION',
    official:
      'O nome ou razão social do prestador deve ser informado quando o emitente da DPS não for o próprio prestador.',
  },
  E0123: {
    category: 'REGISTRATION',
    official:
      'O preenchimento do nome empresarial é obrigatório quando o prestador for identificado com NIF.',
  },
  E0124: {
    category: 'MUNICIPAL',
    official:
      'O IM informado está inativo no CNC NFS-e do município emissor para a data de competência informada na DPS.',
  },
  E0125: {
    category: 'REGISTRATION',
    official:
      'O endereço nacional do prestador do serviço deve ser informado na DPS quando for identificado pelo CNPJ ou CPF e o emitente da DPS for o tomador ou intermediário.',
  },
  E0128: {
    category: 'REGISTRATION',
    official:
      'O endereço do prestador do serviço não deve ser informado na DPS quando o próprio prestador for o emitente da DPS.',
  },
  E0129: {
    category: 'REGISTRATION',
    official:
      'O endereço do prestador deve ser informado na DPS quando o prestador não for o emitente da DPS.',
  },
  E0130: {
    category: 'REGISTRATION',
    official:
      'O código do município para o endereço do prestador do serviço não existe conforme tabela de município do IBGE.',
  },
  E0132: {
    category: 'REGISTRATION',
    official:
      'O código do município informado na DPS para o endereço do prestador do serviço, identificado pelo CNPJ, não corresponde ao município registrado em seus cadastros na data de competência informada na DPS.',
  },
  E0134: {
    category: 'REGISTRATION',
    official:
      'O código do município informado na DPS para o endereço do prestador do serviço, identificado pelo CPF, não corresponde ao município registrado em seus cadastros na data de competência informada na DPS.',
  },
  E0138: {
    category: 'REGISTRATION',
    official:
      'O CEP informado para o endereço nacional do prestador do serviço não existente ou não pertence ao município informado na DPS. Informe um CEP existente e que pertença ao município informado para o endereço do prestador do serviço na DPS.',
  },
  E0142: {
    category: 'REGISTRATION',
    official:
      'O grupo de informações de endereço no exterior deve ser informado obrigatoriamente quando o prestador for identificado pelo NIF e o emitente por CNPJ.',
  },
  E0146: {
    category: 'REGISTRATION',
    official:
      'O código de país informado para o endereço no exterior do prestador do serviço não existe ou é igual ao código do Brasil. Informe um código de país existente e diferente do codigo do Brasil (BR) para o endereço no exterior do prestador do serviço, conforme tabela de país do ANEXO_A-MUNICIPIO_IBGE-PAISES_ISO2-SNNFSe-ESPEC.',
  },
  E0148: { category: 'REQUEST', official: 'Email inválido.' },
  E0160: {
    category: 'REGISTRATION',
    official:
      'No mês de competência da NFS-e, a opção de situação perante o Simples Nacional, do prestador, informada na DPS não está de acordo com o cadastro Simples Nacional.',
  },
  E0161: {
    category: 'REGISTRATION',
    official:
      'NFS-e cujo emitente for MEI somente poderá ser compartilhada pelo município com o ADN se a data de competência, informada na NFS-e, for menor ou igual a 31/08/2023.',
  },
  E0162: {
    category: 'REQUEST',
    official:
      'Não é permitido ao não optante do Simples Nacional e o MEI preencherem o campo de indicação do regime de apuração dos tributos apurados.',
  },
  E0166: {
    category: 'REQUEST',
    official:
      'É obrigatorio o preenchimento do campo de regime de apuração dos tributos do SN para o optante do Simples Nacional ME/EPP.',
  },
  E0172: {
    category: 'MUNICIPAL',
    official:
      'O Regime Especial de Tributação deve ser "Nenhum" (regEspTrib = 0) quando o serviço prestado for diferente de Tributável (tribISSQN = 1), ou seja, tribISSQN = 2, 3 ou 4.',
  },
  E0174: {
    category: 'REGISTRATION',
    official:
      'Quando o prestador da NFS-e é MEI (opSimpNac = 2) o regime especial de tributação deve ser "Nenhum" (regEspTrib = 0).',
  },
  E0175: {
    category: 'REGISTRATION',
    official:
      'Quando o prestador optante pelo Simples Nacional tiver o regime de apuração dos tributos ocorrendo também pelo Simples Nacional, o regime especial de tributação do ISSQN deve ser "Nenhum" (regEspTrib = 0).',
  },
  E0176: {
    category: 'REGISTRATION',
    official:
      'É permitido informar Profissional Autônomo na DPS somente se o prestador de serviço estiver parametrizado como Profissional Autônomo, na data de competência informada na DPS, em pelo menos um dos municípios, emissor ou de incidência do ISSQN (cLocIncid ou cLocEmi) ou se estiver admitido sem verificação (parâmetro "Informado na DPS pelo Emitente - Sem verificação"), conforme parametrização do município de incidência do ISSQN na data de competência informada na DPS.',
  },
  E0177: {
    category: 'MUNICIPAL',
    official:
      'Regime especial de tributação informado na DPS não é admitido na parametrização do município de incidência do ISSQN.',
  },
  E0178: {
    category: 'REGISTRATION',
    official:
      'Regime especial de tributação não permitido para o prestador do serviço com código de tributação na data de competência, informados na DPS, conforme parametrização do município de incidência do ISSQN.',
  },
  E0187: {
    category: 'REGISTRATION',
    official:
      'O grupo de informações relativas ao tomador/adquirente do serviço é obrigatório para o indicador de operação informado.',
  },
  E0188: {
    category: 'REGISTRATION',
    official: 'CNPJ do tomador informado na DPS é inválido.',
  },
  E0190: {
    category: 'REGISTRATION',
    official: 'CNPJ do tomador não encontrado no cadastro CNPJ.',
  },
  E0194: {
    category: 'REGISTRATION',
    official:
      'CNPJ do emitente tomador não possui estabelecimento ou domicílio em um município correspondente ao município emissor, na data de competência informada na DPS, conforme cadastros CNPJ e CNC NFS-e.',
  },
  E0202: {
    category: 'REGISTRATION',
    official:
      'Na emissão da NFS-e não é permitido que o prestador do serviço seja igual ao tomador do serviço.',
  },
  E0204: {
    category: 'REGISTRATION',
    official:
      'CNPJ ou CPF do tomador não foi informado, mas existe uma indicação para retenção do ISSQN na DPS no campo de tipo de "Retenção do ISSQN".',
  },
  E0206: {
    category: 'REGISTRATION',
    official: 'CPF do tomador informado na DPS é inválido.',
  },
  E0207: {
    category: 'REGISTRATION',
    official: 'CPF do tomador não encontrado no cadastro CPF.',
  },
  E0212: {
    category: 'REGISTRATION',
    official:
      'CPF do emitente tomador não possui estabelecimento ou domicílio em um município correspondente ao município emissor, na data de competência informada na DPS, conforme cadastros CPF e CNC NFS-e.',
  },
  E0222: {
    category: 'REGISTRATION',
    official:
      'O tomador de serviço, quando emitente da DPS, não pode ser identificado pelo NIF.',
  },
  E0223: {
    category: 'REGISTRATION',
    official:
      'O NIF ou cNaoNIF do tomador deve ser informado quando o grupo de informações de endereço no exterior do tomador de serviços foi informado.',
  },
  E0224: {
    category: 'REGISTRATION',
    official:
      'O tomador de serviço, quando emitente da DPS, somente pode ser identificado pelo CNPJ ou CPF.',
  },
  E0226: {
    category: 'REGISTRATION',
    official:
      'Valor 0 para o motivo da não informação do NIF do tomador não é permitido na Sefin do Sistema Nacional NFS-e.',
  },
  E0228: {
    category: 'REGISTRATION',
    official:
      'A IM deve ser informada para o emitente tomador do serviço na DPS, conforme informações complementares registradas no CNC NFS-e do município emissor informado na DPS.',
  },
  E0229: {
    category: 'MUNICIPAL',
    official:
      'O IM informado está inativo no CNC NFS-e do município emissor para a data de competência informada na DPS.',
  },
  E0231: {
    category: 'REGISTRATION',
    official:
      'IM do emitente tomador não está autorizado a emitir NFS-e, conforme informações complementares registradas no CNC NFS-e do município emissor informado na DPS.',
  },
  E0232: {
    category: 'REGISTRATION',
    official:
      'IM do tomador não deve ser informado, pois não existem informações complementares registradas no CNC NFS-e do município emissor informado na DPS.',
  },
  E0233: {
    category: 'REGISTRATION',
    official:
      'O nome tomador deve ser preenchido obrigatoriamente quando o NIF do tomador for preenchido.',
  },
  E0234: {
    category: 'REGISTRATION',
    official:
      'O endereço do tomador é obrigatório para o indicador de operação informado ou quando a incidência do ISSQN definida para o serviço prestado ocorrer no local do estabelecimento/domicílio do tomador.',
  },
  E0235: {
    category: 'REGISTRATION',
    official:
      'O endereço nacional do tomador do serviço deve ser informado na DPS quando o tomador for identificado pelo CNPJ.',
  },
  E0236: {
    category: 'REGISTRATION',
    official:
      'O endereço nacional do tomador do serviço não deve ser informado na DPS quando o próprio tomador do serviço for o emitente da DPS.',
  },
  E0237: {
    category: 'REGISTRATION',
    official:
      'O endereço nacional do tomador do serviço deve ser informado na DPS quando o valor do ISSQN for retido pelo tomador, exceto se o emitente da DPS é o próprio tomador do serviço.',
  },
  E0238: {
    category: 'REGISTRATION',
    official:
      'O código do município informado na DPS para o endereço do tomador do serviço não existe conforme tabela de município do IBGE.',
  },
  E0240: {
    category: 'REGISTRATION',
    official:
      'O CEP informado para o endereço nacional do tomador do serviço não existe ou não pertence ao município do endereço do tomador.',
  },
  E0242: {
    category: 'REGISTRATION',
    official:
      'O grupo de informações de endereço no exterior deve ser informado obrigatoriamente quando o tomador for identificado pelo NIF e o emitente por CNPJ.',
  },
  E0246: {
    category: 'REGISTRATION',
    official:
      'O código de país informado para o endereço no exterior do tomador do serviço não existe ou é igual ao código do Brasil. Informe um código de país existente e diferente do codigo do Brasil (BR) para o endereço no exterior do tomador do serviço, conforme tabela de país do ANEXO_A-MUNICIPIO_IBGE-PAISES_ISO2-SNNFSe-ESPEC.',
  },
  E0247: { category: 'REQUEST', official: 'Email inválido.' },
  E0248: {
    category: 'REGISTRATION',
    official: 'CNPJ do intermediário informado na DPS é inválido.',
  },
  E0250: {
    category: 'REGISTRATION',
    official: 'CNPJ do intermediário não encontrado no cadastro CNPJ.',
  },
  E0254: {
    category: 'REGISTRATION',
    official:
      'CNPJ do emitente intermediário não possui estabelecimento ou domicílio em um município correspondente ao município emissor, na data de competência informada na DPS, conforme cadastros CNPJ e CNC NFS-e.',
  },
  E0262: {
    category: 'REGISTRATION',
    official:
      'Na emissão da NFS-e não é permitido que o prestador do serviço seja igual ao intermediário do serviço.',
  },
  E0264: {
    category: 'REGISTRATION',
    official:
      'CNPJ ou CPF do intermediário não foi informado, mas existe uma indicação para retenção do ISSQN na DPS no campo de tipo de "Retenção do ISSQN".',
  },
  E0266: {
    category: 'REGISTRATION',
    official: 'CPF do intermediário informado na DPS é inválido.',
  },
  E0268: {
    category: 'REGISTRATION',
    official: 'CPF do intermediário não encontrado no cadastro CPF.',
  },
  E0272: {
    category: 'REGISTRATION',
    official:
      'CPF do emitente intermediário não possui estabelecimento ou domicílio em um município correspondente ao município emissor, na data de competência informada na DPS, conforme cadastros CPF e CNC NFS-e.',
  },
  E0280: {
    category: 'REGISTRATION',
    official:
      'O intermediário de serviço, quando emitente da DPS, não pode ser identificado pelo NIF.',
  },
  E0281: {
    category: 'REGISTRATION',
    official:
      'O NIF ou cNaoNIF do intermediário deve ser informado quando o grupo de informações de endereço no exterior do intermediário de serviços foi informado.',
  },
  E0284: {
    category: 'REGISTRATION',
    official:
      'O intermediário de serviço, quando emitente da DPS, somente pode ser identificado pelo CNPJ ou CPF.',
  },
  E0286: {
    category: 'REGISTRATION',
    official:
      'Valor 0 para o motivo da não informação do NIF do intermediário não é permitido na Sefin do Sistema Nacional NFS-e.',
  },
  E0287: {
    category: 'REGISTRATION',
    official:
      'A IM não foi informada para o emitente intermediário do serviço na DPS.',
  },
  E0288: {
    category: 'MUNICIPAL',
    official:
      'O IM informado está inativo no CNC NFS-e do município emissor para a data de competência informada na DPS.',
  },
  E0289: {
    category: 'REGISTRATION',
    official:
      'IM do emitente intermediário não está autorizado a emitir NFS-e, conforme informações complementares registradas no CNC NFS-e do município emissor informado na DPS.',
  },
  E0290: {
    category: 'REGISTRATION',
    official:
      'IM do intermediário não deve ser informado, pois não existem informações complementares registradas no CNC NFS-e do município emissor informado na DPS.',
  },
  E0291: {
    category: 'REGISTRATION',
    official:
      'O endereço nacional do intermediário do serviço não deve ser informado na DPS quando o próprio tomador do serviço for o emitente da DPS.',
  },
  E0292: {
    category: 'REGISTRATION',
    official:
      'O nome intermediário deve ser preenchido obrigatoriamente quando o NIF do intermediário for preenchido.',
  },
  E0293: {
    category: 'REGISTRATION',
    official:
      'O endereço nacional do intermediário do serviço deve ser informado na DPS quando o valor do ISSQN for retido pelo intermediário, exceto se o emitente da DPS é o intermediário do serviço.',
  },
  E0294: {
    category: 'REGISTRATION',
    official:
      'O código do município informado na DPS para o endereço do intermediário do serviço não existe conforme tabela de município do IBGE.',
  },
  E0296: {
    category: 'REGISTRATION',
    official:
      'O CEP informado para o endereço nacional do intermediário do serviço não existe ou não pertence ao município do endereço do intermediário.',
  },
  E0298: {
    category: 'REGISTRATION',
    official:
      'O grupo de informações de endereço no exterior deve ser informado obrigatoriamente quando o intermediário for identificado pelo NIF e o emitente por CNPJ.',
  },
  E0299: {
    category: 'REGISTRATION',
    official:
      'O código de país informado para o endereço no exterior do intermediário do serviço não existe ou é igual ao código do Brasil. Informe um código de país existente e diferente do codigo do Brasil (BR) para o endereço no exterior do intermediário do serviço, conforme tabela de país do ANEXO_A-MUNICIPIO_IBGE-PAISES_ISO2-SNNFSe-ESPEC.',
  },
  E0300: { category: 'REQUEST', official: 'Email inválido.' },
  E0302: {
    category: 'MUNICIPAL',
    official:
      'O código do local da prestação do serviço não existe conforme a tabela de municípios IBGE disponibilizada no ANEXO_A-MUNICIPIO_IBGE-PAISES_ISO2-SNNFSe.',
  },
  E0304: {
    category: 'MUNICIPAL',
    official:
      'Informe um código de país existente e diferente de Brasil (BR), conforme tabela de país do ANEXO_A-MUNICIPIO_IBGE-PAISES_ISO2-SNNFSe-ESPEC.',
  },
  E0310: {
    category: 'REQUEST',
    official:
      'O código de tributação nacional informado não existe conforme a lista de serviços nacional do Sistema Nacional NFS-e.',
  },
  E0312: {
    category: 'MUNICIPAL',
    official:
      'O código de tributação nacional informado não está administrado pelo município de incidência do ISSQN na data de competência informada na DPS, conforme a lista de serviços nacional do Sistema Nacional NFS-e.',
  },
  E0314: {
    category: 'MUNICIPAL',
    official:
      'O código de tributação municipal informado não existe ou não está administrado pelo município de incidência do ISSQN na data de competência informada na DPS,',
  },
  E0315: {
    category: 'REQUEST',
    official:
      'Não é permitido informar 000 para o codigo de tributação municipal na DPS.',
  },
  E0316: {
    category: 'REQUEST',
    official:
      'Código da lista NBS informado inexistente tabela de NBS do sistema.',
  },
  E0318: {
    category: 'REQUEST',
    official:
      'É obrigatório informar na DPS um item da NBS para casos de exportação de serviço.',
  },
  E0320: {
    category: 'REQUEST',
    official:
      'É obrigatório informar na DPS um item da NBS para casos de importação de serviço.',
  },
  E0322: {
    category: 'REQUEST',
    official:
      'É obrigatório informar na DPS um item da NBS se for declarada qualquer informação de IBS/CBS.',
  },
  E0330: {
    category: 'REQUEST',
    official:
      'É obrigatório prestar informações de comércio exterior para as situações de exportação de serviços.',
  },
  E0331: {
    category: 'REQUEST',
    official:
      'É obrigatório prestar informações de comércio exterior para as situações de importação de serviços.',
  },
  E0333: {
    category: 'REQUEST',
    official:
      'Valor 0 para o modo de prestação não é permitido na Sefin do Sistema Nacional NFS-e.',
  },
  E0341: {
    category: 'REGISTRATION',
    official:
      'Valor 0 para o Mecanismo de apoio/fomento ao Comércio Exterior utilizado pelo prestador do serviço não é permitido na Sefin do Sistema Nacional NFS-e.',
  },
  E0343: {
    category: 'REGISTRATION',
    official:
      'Valor 0 para o Mecanismo de apoio/fomento ao Comércio Exterior utilizado pelo tomador do serviço não é permitido na Sefin do Sistema Nacional NFS-e.',
  },
  E0345: {
    category: 'REQUEST',
    official:
      'Valor 0 para o Vínculo da Operação à Movimentação Temporária de Bens não é permitido na Sefin do Sistema Nacional NFS-e.',
  },
  E0352: {
    category: 'REQUEST',
    official:
      'O preenchimento do campo nDI (Número da Declaração de Importação) é obrigatório quando o campo (movTempBens) Vínculo da Operação à Movimentação Temporária de Bens for igual a 2.',
  },
  E0354: {
    category: 'REQUEST',
    official:
      'O preenchimento dos campos nDI (Número da Declaração de Importação) ou do nRE (úmero do Registro de Exportação) não é permitido quando o campo (movTempBens) Vínculo da Operação à Movimentação Temporária de Bens for igual a 1.',
  },
  E0356: {
    category: 'REQUEST',
    official:
      'O preenchimento do campo nRE (úmero do Registro de Exportação) é obrigatório quando o campo (movTempBens) Vínculo da Operação à Movimentação Temporária de Bens for igual a 3.',
  },
  E0370: {
    category: 'REQUEST',
    official:
      'O grupo de informações de obra é obrigatório quando o código de tributação nacional pertencer a um dos subitens 07.02.01, 07.02.02, 07.04.01, 07.05,01, 07.05.02, 07.06.01, 07.06.02, 07.07.01, 07.08.01, 07.17.01, 07.19.01, 1414.03 e 14.14.04 da lista de serviços.',
  },
  E0372: {
    category: 'REQUEST',
    official:
      'O grupo de informações de obra não é permitido quando o código de tributação nacional não pertencer a algum dos subitens 07.02.01, 07.02.02, 07.04.01, 07.05,01, 07.05.02, 07.06.01, 07.06.02, 07.07.01, 07.08.01, 07.17.01, 07.19.01, 1414.03 e 14.14.04 da lista de serviços, com exceção do código 99.01.01.',
  },
  E0373: { category: 'REQUEST', official: 'Código CIB inválido.' },
  E0380: {
    category: 'MUNICIPAL',
    official:
      'Informe um CEP correspondente ao município do local da prestação do serviço informado nesta DPS para indicar corretamente o endereço da obra.',
  },
  E0382: {
    category: 'REQUEST',
    official:
      'O CEP não deve ser informado quando o endereço da obra ocorrer no exterior do país.',
  },
  E0384: {
    category: 'REQUEST',
    official:
      'O grupo de informações de endereço da atividade de obra ocorrido no exterior deve ser informado quando o país do local da prestação for informado na DPS.',
  },
  E0386: {
    category: 'MUNICIPAL',
    official:
      'O grupo de informações de endereço da atividade de obra ocorrido no exterior não deve ser informado quando o município do local da prestação for informado na DPS.',
  },
  E0390: {
    category: 'LIFECYCLE',
    official:
      'O grupo de informações de Atividade/Evento é obrigatório quando o código de tributação nacional pertencer ao item 12 da lista de serviços.',
  },
  E0392: {
    category: 'LIFECYCLE',
    official:
      'O grupo de informações de Atividade/Evento não é permitido quando o código de tributação nacional não pertencer ao item 12 da lista de serviços, com exceção do código 99.01.01.',
  },
  E0398: {
    category: 'MUNICIPAL',
    official:
      'Informe um CEP correspondente ao município do local da prestação do serviço informado nesta DPS para indicar corretamente o endereço da atividade ou evento.',
  },
  E0400: {
    category: 'LIFECYCLE',
    official:
      'O CEP não deve ser informado quando o endereço da atividade de evento ocorrer no exterior do país.',
  },
  E0402: {
    category: 'LIFECYCLE',
    official:
      'O grupo de informações de endereço da atividade de evento ocorrido no exterior deve ser informado quando o país do local da prestação for informado na DPS.',
  },
  E0404: {
    category: 'MUNICIPAL',
    official:
      'O grupo de informações de endereço da atividade de evento ocorrido no exterior não deve ser informado quando o município do local da prestação for informado na DPS.',
  },
  E0420: {
    category: 'REGISTRATION',
    official:
      'O documento de referência deve ser obrigatoriamente informado quando o emitente da DPS for o tomador ou intermediário do serviço.',
  },
  E0423: {
    category: 'REGISTRATION',
    official:
      'O valor recebido deve ser informado na DPS quando o intermediário do serviço for o emitente da DPS.',
  },
  E0424: {
    category: 'REGISTRATION',
    official:
      'O valor recebido não deve ser informado na DPS quando o prestador ou tomador do serviço for o emitente da DPS.',
  },
  E0425: {
    category: 'REQUEST',
    official:
      'O valor recebido não pode ser menor que o valor do serviço informado na DPS.',
  },
  E0427: {
    category: 'REQUEST',
    official:
      'O valor do serviço deve ser maior ou igual ao somatório dos valores informados para Desconto Incondicionado, Deduções/Reduções e Benefício Municipal.',
  },
  E0428: {
    category: 'MUNICIPAL',
    official:
      'O valor do serviço deve ser maior ou igual ao somatório dos valores informados para Desconto Incondicionado, Desconto Condicionado, Deduções/Reduções, Benefício Municipal, valores de tributos devidos CP, IRRF, CSLL e ISSQN se o valor deste tributo for retido.',
  },
  E0429: {
    category: 'MUNICIPAL',
    official:
      'O ISSQN não pode ser objeto de redução de base de cálculo que resulte em carga tributária menor que a decorrente da aplicação da alíquota mínima de 2,0% do valor do serviço, exceto para os serviços a que se referem aos subitens 042201, 042301, 050901, 070201, 070202, 070501 , 070502, 090201, 090202, 100101, 100102, 100103, 100104, 100105, 100201, 100202, 100301, 100401, 100402, 100403, 100501, 100502, 100601, 100701, 100801, 100901, 101001, 150101, 150102, 150103, 150104, 150105, 151001, 151002, 151003, 151004, 151005, 160101, 160102, 160103, 160104, 160201, 170501, 170601, 171001, 171002, 171101, 171102, 171201, 210101, 250301, da lista de serviços nacional do Sistema Nacional NFS-e.',
  },
  E0431: {
    category: 'REQUEST',
    official:
      'O valor do desconto incondicionado informado na DPS deve ser menor que o valor do serviço e maior que zero.',
  },
  E0432: {
    category: 'REQUEST',
    official:
      'O valor do desconto condicionado informado na DPS deve ser menor que o valor do serviço e maior que zero.',
  },
  E0435: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido o preenchimento dos campos do grupo de informações relativas à Dedução/Redução do ISSQN quando ocorrer Imunidade, Exportação do serviço ou Não incidência.',
  },
  E0436: {
    category: 'REGISTRATION',
    official:
      'Não é permitido o preenchimento dos campos do grupo de informações relativas à Dedução/Redução do ISSQN quando o prestador de serviço é MEI.',
  },
  E0438: {
    category: 'REGISTRATION',
    official:
      'Não é permitido o preenchimento dos campos do grupo de informações relativas à Dedução/Redução do ISSQN, quando o prestador de serviço tiver algum regime especial de tributação.',
  },
  E0439: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido o preenchimento dos campos do grupo de informações relativas à Dedução/Redução do ISSQN, quando o benefício municipal informado na DPS for do tipo "Isenção".',
  },
  E0440: {
    category: 'MUNICIPAL',
    official:
      'O tipo de dedução/redução informado na DPS não é permitida pelo município de incidência do ISSQN, conforme parametrizações do código de serviço do município de incidência.',
  },
  E0441: {
    category: 'REGISTRATION',
    official:
      'Não é permitido o preenchimento de informações relativas à Dedução/Redução para o prestador de serviço ME/EPP, apurando pelo SN conforme parametrização do código de serviço admnistrado pelo municipio de incidência do ISSQN.',
  },
  E0442: {
    category: 'REGISTRATION',
    official:
      'O tipo de dedução/redução informado na DPS não é permitida para o prestador de serviço ME/EPP, apurando pelo SN.',
  },
  E0444: {
    category: 'MUNICIPAL',
    official:
      'O valor percentual de dedução/redução informado na DPS não pode reduzir o valor da BC de forma que resulte no valor do ISSQN a uma alíquota efetiva menor que 2%, exceto para os códigos relativos aos subitens 042201, 042301, 050901, 070201, 070202, 070501 , 070502, 090201, 090202, 100101, 100102, 100103, 100104, 100105, 100201, 100202, 100301, 100401, 100402, 100403, 100501, 100502, 100601, 100701, 100801, 100901, 101001, 150101, 150102, 150103, 150104, 150105, 151001, 151002, 151003, 151004, 151005, 160101, 160102, 160103, 160104, 160201, 170501, 170601, 171001, 171002, 171101, 171102, 171201, 210101, 250301, da lista de serviços nacional do Sistema Nacional NFS-e.',
  },
  E0446: {
    category: 'MUNICIPAL',
    official:
      'Código de serviço informado na DPS não permite dedução/redução na base de cálculo do ISSQN por valor monetário.',
  },
  E0447: {
    category: 'MUNICIPAL',
    official:
      'O valor de dedução/redução informado na DPS não pode reduzir o valor da BC de forma que resulte no valor do ISSQN a uma alíquota efetiva menor que 2%, exceto para os códigos relativos aos subitens 042201, 042301, 050901, 070201, 070202, 070501 , 070502, 090201, 090202, 100101, 100102, 100103, 100104, 100105, 100201, 100202, 100301, 100401, 100402, 100403, 100501, 100502, 100601, 100701, 100801, 100901, 101001, 150101, 150102, 150103, 150104, 150105, 151001, 151002, 151003, 151004, 151005, 160101, 160102, 160103, 160104, 160201, 170501, 170601, 171001, 171002, 171101, 171102, 171201, 210101, 250301, da lista de serviços nacional do Sistema Nacional NFS-e.',
  },
  E0449: {
    category: 'MUNICIPAL',
    official:
      'Código de serviço informado na DPS não permite dedução/redução na base de cálculo do ISSQN por documento informado.',
  },
  E0453: {
    category: 'REQUEST',
    official:
      'O valor percentual para dedução/redução deve ser maior que 0 e menor ou igual a 100%.',
  },
  E0454: {
    category: 'MUNICIPAL',
    official:
      'Código de serviço informado na DPS não permite dedução/redução na base de cálculo do ISSQN por percentual.',
  },
  E0455: {
    category: 'REQUEST',
    official: 'Informe uma chave de NFS-e válida.',
  },
  E0456: {
    category: 'REQUEST',
    official:
      'NFS-e não existe na base de dados do autorizador de NFS-e nacional. Informe uma chave de NFS-e existente.',
  },
  E0458: {
    category: 'LIFECYCLE',
    official:
      'Uma NFS-e cancelada não pode ser informada para dedução/redução.',
  },
  E0460: { category: 'REQUEST', official: 'Informe uma chave de NF-e válida.' },
  E0462: {
    category: 'REQUEST',
    official:
      'NF-e não existe na base de dados do autorizador de NF-e nacional. Informe uma chave de NF-e existente.',
  },
  E0464: {
    category: 'LIFECYCLE',
    official: 'Uma NF-e cancelada não pode ser informada para dedução/redução.',
  },
  E0466: {
    category: 'MUNICIPAL',
    official:
      'Informe um código de município existente para o documento de nota, conforme tabela de municípios do IBGE.',
  },
  E0468: {
    category: 'REQUEST',
    official:
      'Informar, obrigatoriamente, o campo de descrição no caso ideDedRed igual a 99 – Outras deduções.',
  },
  E0470: {
    category: 'REQUEST',
    official:
      'Não informar o campo de descrição no caso ideDedRed diferente a 99 – Outras deduções.',
  },
  E0472: {
    category: 'DEADLINE',
    official:
      'A data de emissão do documento informado na DPS não pode ser posterior à data de competência da DPS.',
  },
  E0474: {
    category: 'REQUEST',
    official:
      'O valor de dedução/redução não pode ser superior ao valor dedutível/redutível.',
  },
  E0476: {
    category: 'REQUEST',
    official:
      'O valor de dedução/redução informado na DPS não pode ser superior ao valor do serviço.',
  },
  E0477: {
    category: 'REQUEST',
    official:
      'O grupo de informações para o fornecedor deve ser informado obrigatoriamente para o tipo de documento de dedução/redução informado na DPS.',
  },
  E0478: {
    category: 'REGISTRATION',
    official: 'CNPJ do fornecedor informado na DPS é inválido.',
  },
  E0482: {
    category: 'REGISTRATION',
    official:
      'CNPJ do fornecedor informado na DPS não encontrado no cadastro CNPJ.',
  },
  E0484: {
    category: 'REGISTRATION',
    official: 'CPF do fornecedor informado na DPS é inválido.',
  },
  E0488: {
    category: 'REGISTRATION',
    official:
      'CPF do fornecedor informado na DPS não encontrado no cadastro CPF.',
  },
  E0490: {
    category: 'REQUEST',
    official:
      'Valor 0 para o motivo da não informação do NIF do fornecedor não é permitido na Sefin do Sistema Nacional NFS-e.',
  },
  E0492: {
    category: 'REGISTRATION',
    official:
      'O grupo de informações de endereço nacional deve ser informado obrigatoriamente quando o fornecedor for identificado pelo CPF ou CNPJ.',
  },
  E0494: {
    category: 'MUNICIPAL',
    official:
      'O código do município informado na DPS para o endereço do fornecedor do serviço não existe conforme tabela de município do IBGE.',
  },
  E0496: {
    category: 'MUNICIPAL',
    official:
      'O CEP informado para o endereço nacional do fornecedor não existe ou não pertence ao município do endereço do fornecedor.',
  },
  E0498: {
    category: 'REQUEST',
    official:
      'O grupo de informações de endereço no exterior deve ser informado obrigatoriamente quando o fornecedor for identificado pelo NIF.',
  },
  E0499: {
    category: 'MUNICIPAL',
    official:
      'O código de país informado para o endereço no exterior do fornecedor não existe ou é igual ao código do Brasil. Informe um código de país existente e diferente do codigo do Brasil (BR) para o endereço no exterior do fornecedor, conforme tabela de país do ANEXO_A-MUNICIPIO_IBGE-PAISES_ISO2-SNNFSe-ESPEC.',
  },
  E0529: {
    category: 'REGISTRATION',
    official:
      'O sistema considera este cenário para a prestação de serviço informada na DPS uma operação tributável. Não é permitido ao emitente da DPS informar que a prestação de serviço se trata de uma exportação de serviço.',
  },
  E0530: {
    category: 'REGISTRATION',
    official:
      'O sistema considera este cenário para a prestação de serviço informada na DPS uma exportação de serviço. Não é permitido ao emitente da DPS informar que a prestação de serviço se trata de uma operação tributável.',
  },
  E0532: {
    category: 'MUNICIPAL',
    official:
      'O campo que informa sobre a tributação do ISSQN deve ser "4 - Não Incidência", quando houver o serviço prestado for 99.01.01 - Serviços sem a incidência de ISSQN e ICMS.',
  },
  E0533: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido informar Benefício Municipal (BM deve ser nulo) quando o serviço prestado diferente de Tributável (tribISSQN = 1), ou seja, tribISSQN = 2, 3 ou 4.',
  },
  E0534: {
    category: 'REGISTRATION',
    official:
      'Não é permitido o preenchimento de informações relativas à benefício municipal para o prestador de serviço MEI.',
  },
  E0535: {
    category: 'REGISTRATION',
    official:
      'Não é permitido informar benefício municipal quando o prestador de serviço tiver um regime especial de tributação, ou seja, o campo que indica o regime especial de tributação é diferente de 0, (regEspTrib = 1, 2, 3, 4, 5, 6 ou 9).',
  },
  E0536: {
    category: 'REGISTRATION',
    official:
      'Não é permitido o preenchimento de informações relativas à benefício municipal para o prestador de serviço ME/EPP, apurando pelo SN, conforme parametrização do código de serviço admnistrado pelo municipio de incidência do ISSQN.',
  },
  E0537: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido informar benefício municipal (BM deve ser nulo) quando o município de incidência do ISSQN não está "Ativo" no Sistema Nacional NFS-e.',
  },
  E0539: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido informar não incidência do ISSQN = 4 (Não Incidência) para qualquer subitem da lista nacional de serviço informado na DPS, se o subitem for incidente, conforme a parametrização do município de incidência do ISSQN.',
  },
  E0540: {
    category: 'MUNICIPAL',
    official:
      'Não há incidência do ISSQN (tribISSQN = 4) pois a parametrização do muncípio de incidência do ISSQN indica que o código de serviço prestado, informado na DPS, não é incidente neste município.',
  },
  E0541: {
    category: 'MUNICIPAL',
    official:
      'Não existe o código de identificação do benefício municipal informado na DPS para o municipío de incidência do ISSQN.',
  },
  E0544: {
    category: 'MUNICIPAL',
    official:
      'Período de vigência expirado para o código de identificação do Benefício Municipal no municipío de incidência do ISSQN para a data de competência informada na DPS.',
  },
  E0548: {
    category: 'REGISTRATION',
    official:
      'O Benefício Municipal informado na DPS não permite benefício para prestadores de serviço que não estejam estabelecidos no município de incidência do ISSQN.',
  },
  E0550: {
    category: 'REGISTRATION',
    official:
      'O código de identificação de Benefício Municipal, informada na DPS, não permite benefício para o código de tributação e/ou prestador (CPF ou CNPJ) informado na DPS, conforme parametrização do município de incidência do ISSQN.',
  },
  E0565: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido informar um valor monetário de redução de base de cálculo do ISSQN por benefício municipal, se o código de identificação do Benefício Municipal não corresponder ao tipo de redução por valor monetário.',
  },
  E0567: {
    category: 'REQUEST',
    official:
      'É obrigatório informar vRedBCBM quando o código de identificação do Benefício Municipal (nBM) for um benefício do tipo Redução de Base de Cálculo por Valor Monetário.',
  },
  E0574: {
    category: 'REQUEST',
    official:
      'O valor monetário do benefício municipal informado na DPS não pode ser superior ao valor do serviço.',
  },
  E0575: {
    category: 'MUNICIPAL',
    official:
      'O valor monetário do benefício municipal informado na DPS não pode reduzir o valor da BC de forma que resulte no valor do ISSQN a uma alíquota efetiva menor que 2%, exceto para os códigos relativos aos subitens 042201, 042301, 050901, 070201, 070202, 070501 , 070502, 090201, 090202, 100101, 100102, 100103, 100104, 100105, 100201, 100202, 100301, 100401, 100402, 100403, 100501, 100502, 100601, 100701, 100801, 100901, 101001, 150101, 150102, 150103, 150104, 150105, 151001, 151002, 151003, 151004, 151005, 160101, 160102, 160103, 160104, 160201, 170501, 170601, 171001, 171002, 171101, 171102, 171201, 210101, 250301, da lista de serviços nacional do Sistema Nacional NFS-e.',
  },
  E0577: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido informar um valor percentual de redução de base de cálculo do ISSQN por benefício municipal, se o código de identificação do Benefício Municipal não corresponder ao tipo de redução por valor percentual.',
  },
  E0579: {
    category: 'REQUEST',
    official:
      'É obrigatório informar pRedBCBM quando o código de identificação do Benefício Municipal (nBM) for um benefício do tipo Redução de Base de Cálculo por percentual.',
  },
  E0580: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido haver retenção quando o campo referente à tributação do ISSQN indicar imunidade, exportação ou não incidência.',
  },
  E0583: {
    category: 'REGISTRATION',
    official:
      'Não é permitido retenção do ISSQN para o prestador do serviço que seja MEI na data de competência informada na DPS.',
  },
  E0585: {
    category: 'MUNICIPAL',
    official:
      'Somente é permitido informar suspensão de exigibilidade quando a opção da tributação do ISSQN for uma operação tributável (tribISSQN = 1).',
  },
  E0586: {
    category: 'MUNICIPAL',
    official:
      'O valor percentual para redução da base de cálculo deve ser maior que 0 e menor ou igual ao percentual parametrizado pelo município de incidência do ISSQN.',
  },
  E0587: {
    category: 'MUNICIPAL',
    official:
      'O valor percentual do benefício municipal informado na DPS não pode reduzir o valor da BC de forma que resulte no valor do ISSQN a uma alíquota efetiva menor que 2%, exceto para os códigos relativos aos subitens 042201, 042301, 050901, 070201, 070202, 070501 , 070502, 090201, 090202, 100101, 100102, 100103, 100104, 100105, 100201, 100202, 100301, 100401, 100402, 100403, 100501, 100502, 100601, 100701, 100801, 100901, 101001, 150101, 150102, 150103, 150104, 150105, 151001, 151002, 151003, 151004, 151005, 160101, 160102, 160103, 160104, 160201, 170501, 170601, 171001, 171002, 171101, 171102, 171201, 210101, 250301, da lista de serviços nacional do Sistema Nacional NFS-e.',
  },
  E0588: {
    category: 'REGISTRATION',
    official:
      'Não é permitido retenção do ISSQN para o prestador do serviço que tenha algum regime especial de tributação na data de competência informada na DPS.',
  },
  E0590: {
    category: 'REQUEST',
    official:
      'É obrigatório informar o código do país onde ocorreu o resultado do serviço prestado para os cenários 2, 30, 58, 62, 72, 76, conforme a planilha "EXPORTACAO_EMISSÃO_NFS-e".',
  },
  E0591: {
    category: 'REQUEST',
    official:
      'Não é permitido informar o código do país onde ocorreu o resultado do serviço prestado para os cenários diferentes de 2, 30, 58, 62, 72, 76 conforme a planilha "EXPORTACAO_EMISSÃO_NFS-e".',
  },
  E0592: {
    category: 'MUNICIPAL',
    official:
      'O tipo de imunidade é obrigatório e deve ser informado somente quando o campo referente à tributação do ISSQN for igual a "2 - Imunidade".',
  },
  E0593: {
    category: 'REQUEST',
    official:
      'Não permitido o valor "0 - Imunidade (tipo não informado na nota de origem)" na DPS quando utilizado os Emissores Públicos Nacionais para emissao de NFS-e.',
  },
  E0594: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido retenção do ISSQN quando houver Benefício Municipal do tipo Isenção.',
  },
  E0595: {
    category: 'MUNICIPAL',
    official: 'Não é permitido informar alíquota superior a 5%.',
  },
  E0596: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido retenção do ISSQN quando o serviço prestado corresponder ao subitem 220101 - Serviço de exploração de rodovia da lista de serviços do Sistema Nacional NFS-e.',
  },
  E0600: {
    category: 'REGISTRATION',
    official:
      'Não é permitido informar a alíquota para prestador de serviço optante do simples nacional do tipo MEI.',
  },
  E0602: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido informar alíquota quando o campo referente à tributação do ISSQN indicar imunidade, exportação ou não incidência.',
  },
  E0604: {
    category: 'REGISTRATION',
    official:
      'Não é permitido informar alíquota quando o prestador de serviço possui algum regime especial de tributação.',
  },
  E0612: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido informar alíquota quando o benefício municipal informado na DPS for do tipo "Isenção" ou "Alíquota Diferenciada".',
  },
  E0617: {
    category: 'REGISTRATION',
    official:
      'Não é permitido informar alíquota quando o prestador de serviço não é optante do simples nacional (opSimpNac = 1) na data de competência informada na DPS, com o município de incidência do ISSQN com situação "ATIVO" no Sistema Nacional NFS-e.',
  },
  E0619: {
    category: 'REGISTRATION',
    official:
      'É obrigatório informar alíquota quando o prestador de serviço não é optante do simples nacional (opSimpNac = 1) na data de competência informada na DPS, o município de incidência do ISSQN não está com situação "ATIVO" no Sistema Nacional NFS-e e não haja algum regime especial de tributaçao para o prestador.',
  },
  E0621: {
    category: 'REGISTRATION',
    official:
      'É obrigatório informar alíquota quando há indicação de retenção do ISSQN (tpRetISSQN = 2 ou 3) para o prestador de serviço ME/EPP (opSimpNac = 3) na data de competência informada na DPS, com apuração do ISSQN pelo simples nacional (regApTribISSQN = 1), sem benefício municipal ou, se houver, seja diferente de isenção ou alíquota diferenciada, cujo município de incidência esteja Ativo no Sistema Nacional NFS-e. Obs: neste cenário, o percentual da alíquota mínima informada permitida é 1,8%.',
  },
  E0625: {
    category: 'REGISTRATION',
    official:
      'Não é permitido informar alíquota quando não há indicação de retenção do ISSQN (tpRetISSQN = 1) para o prestador de serviço ME/EPP (opSimpNac = 3) na data de competência informada na DPS, com apuração do ISSQN pelo simples nacional (regApTribISSQN = 1), sem benefício municipal ou, se houver, seja diferente de isenção ou alíquota diferenciada, cujo município de incidência esteja Ativo no Sistema Nacional NFS-e.',
  },
  E0628: {
    category: 'REGISTRATION',
    official:
      'É obrigatório informar alíquota quando o município de incidência do ISSQN não está Ativo no Sistema Nacional NFS-e, para o prestador de serviço ME/EPP (opSimpNac = 3) na data de competência informada na DPS, com apuração do ISSQN pelo simples nacional (regApTribISSQN = 1), com retenção do ISSQN (tpRetISSQN = 2 ou 3). Obs: neste cenário, o percentual da alíquota mínima informada permitida é 1,8%.',
  },
  E0631: {
    category: 'REGISTRATION',
    official:
      'Não é permitido informar alíquota quando o município de incidência do ISSQN não está Ativo no Sistema Nacional NFS-e, para o prestador de serviço ME/EPP (opSimpNac = 3) na data de competência informada na DPS, com apuração do ISSQN pelo simples nacional (regApTribISSQN = 1) sem retenção do ISSQN (tpRetISSQN = 1).',
  },
  E0635: {
    category: 'REGISTRATION',
    official:
      'Não é permitido informar alíquota quando o convênio do município de incidência do ISSQN está ativo na data de competência informada na DPS, para o prestador de serviço ME/EPP (opSimpNac = 3) com a apuração do ISSQN fora do Simples Nacional, ou seja, pela alíquota do município para o serviço prestado (regApTribSN = 2 ou 3).',
  },
  E0640: {
    category: 'REGISTRATION',
    official:
      'É obrigatório informar alíquota quando o prestador de serviço ME/EPP (opSimpNac = 3) na data de competência informada na DPS, com apuração do ISSQN fora do Simples Nacional (regApTribISSQN = 2 ou 3), ou seja, pela alíquota do município para o serviço prestado, cujo município de incidência não esteja "Ativo" no Sistema Nacional NFS-e.',
  },
  E0650: {
    category: 'REGISTRATION',
    official:
      'Em caso de importação de serviço pelo tomador, o ISSQN deve ser retido pelo tomador.',
  },
  E0652: {
    category: 'REGISTRATION',
    official:
      'Em caso de importação de serviço pelo intermediário, o ISSQN deve ser retido pelo intermediário.',
  },
  E0667: {
    category: 'REGISTRATION',
    official:
      'Município da incidência do ISSQN não autoriza que o CPF do tomador informado na DPS seja indicado para retenção deste imposto.',
  },
  E0670: {
    category: 'REGISTRATION',
    official:
      'Município da incidência do ISSQN não autoriza que o CPF do intermediário informado na DPS seja indicado para retenção deste imposto.',
  },
  E0672: {
    category: 'REGISTRATION',
    official:
      'Não pode haver retenção do ISSQN se e o tomador for o emitente da DPS e estiver estabelecido em município diferente do município de incidência do ISSQN.',
  },
  E0673: {
    category: 'REGISTRATION',
    official:
      'Não pode haver retenção do ISSQN se e o intermediário for o emitente da DPS e estiver estabelecido em município diferente do município de incidência do ISSQN.',
  },
  E0675: {
    category: 'REGISTRATION',
    official:
      'Não é permitido a prestação de informações relativas aos tributos federais quando o emitente da DPS for identificado por um pessoa física (CPF).',
  },
  E0676: {
    category: 'REGISTRATION',
    official:
      'Não é permitido o preenchimento das informações relativas aos tributos federais quando o emitente for identificado como MEI na data de competência informada na DPS.',
  },
  E0677: {
    category: 'REQUEST',
    official:
      'O valor da BC para Pis/Cofins deve ser menor ou igual ao valor do serviço informado na DPS.',
  },
  E0686: {
    category: 'MUNICIPAL',
    official:
      'A alíquota do Pis deve ser igual ou maior que 0 e menor ou igual a 100%.',
  },
  E0692: {
    category: 'MUNICIPAL',
    official:
      'A alíquota do Cofins deve ser igual ou maior que 0 e menor ou igual a 100%.',
  },
  E0694: {
    category: 'MUNICIPAL',
    official:
      'O valor do Pis informado não corresponde ao resultado da BC Pis/Cofins x Alíquota Pis, que foram informados na DPS.',
  },
  E0696: {
    category: 'MUNICIPAL',
    official:
      'O valor do Cofins informado não corresponde ao resultado da BC Pis/Cofins x Alíquota Cofins, que foram informados na DPS.',
  },
  E0699: {
    category: 'REQUEST',
    official:
      'O valor do tributo CP deve ser maior que zero e menor que o valor do serviço informado na DPS.',
  },
  E0700: {
    category: 'REQUEST',
    official:
      'O valor do tributo IRRF deve ser maior que zero e menor que o valor do serviço informado na DPS.',
  },
  E0701: {
    category: 'REQUEST',
    official:
      'O valor do tributo CSLL deve ser maior que zero e menor que o valor do serviço informado na DPS.',
  },
  E0702: {
    category: 'REQUEST',
    official:
      'Se o valor for informado, então deve ser igual ou maior que 0 e menor ou igual o valor do serviço.',
  },
  E0703: {
    category: 'REQUEST',
    official:
      'Se o valor for informado, então deve ser igual ou maior que 0 e menor ou igual o valor do serviço.',
  },
  E0704: {
    category: 'REQUEST',
    official:
      'Se o valor for informado, então deve ser igual ou maior que 0 e menor ou igual o valor do serviço.',
  },
  E0706: {
    category: 'MUNICIPAL',
    official:
      'Se a alíquota for informada, então deve ser igual ou maior que 0 e menor ou igual a 100%.',
  },
  E0707: {
    category: 'MUNICIPAL',
    official:
      'Se a alíquota for informada, então deve ser igual ou maior que 0 e menor ou igual a 100%.',
  },
  E0708: {
    category: 'MUNICIPAL',
    official:
      'Se a alíquota for informada, então deve ser igual ou maior que 0 e menor ou igual a 100%.',
  },
  E0710: {
    category: 'REQUEST',
    official: 'Para MEI pTotTribSN nunca poderá ser informado.',
  },
  E0712: {
    category: 'REQUEST',
    official: 'Para ME/EPP indTotTrib nunca poderá ser informado.',
  },
  E0713: {
    category: 'MUNICIPAL',
    official:
      'Para Não Optante do SN os campos, indicador de informação de valor total de tributos e percentual aproximado do total dos tributos da alíquota do Simples Nacional (%), não podem ser informado.',
  },
  E0714: {
    category: 'CERTIFICATE',
    official: 'Arquivo enviado com erro na assinatura.',
  },
  E0715: {
    category: 'CERTIFICATE',
    official: 'Certificado Digital da assinatura inválido.',
  },
  E0716: {
    category: 'CERTIFICATE',
    official: 'Certificado Digital fora do padrão estabelecido.',
  },
  E0717: {
    category: 'CERTIFICATE',
    official:
      'A assinatura é obrigatória quando for enviado para o Web Service.',
  },
  E0718: {
    category: 'CERTIFICATE',
    official:
      'A assinatura deve ser feita com o certificado digital do emitente da DPS.',
  },
  E0720: {
    category: 'REQUEST',
    official:
      'Se o tipo de retenção do PIS/COFINS for igual a "0 - PIS/COFINS/CSLL Não Retidos", então não é permitido informar o campo vRetCSLL.',
  },
  E0724: {
    category: 'REQUEST',
    official:
      'Se o tipo de retenção do PIS/COFINS for diferente de "0 - PIS/COFINS/CSLL Não Retidos" ou de "2 - PIS/COFINS Não Retido", então é obrigatório informar o campo vRetCSLL.',
  },
  E0850: {
    category: 'DEADLINE',
    official:
      'É permitido declarar informações de IBS/CBS somente a partir da data de competência 01/01/2026.',
  },
  E0854: {
    category: 'PAYLOAD',
    official:
      'Somente é permitio declarar informações de IBS/CBS a partir da versão 1,01 da DPS.',
  },
  E0901: {
    category: 'REQUEST',
    official: 'Código indicador da operação inexistente.',
  },
  E0903: {
    category: 'REQUEST',
    official:
      'Código do tipo de Operação (tpOper) deve ser informado quando se tratar de uma compra governamental ou um dos serviços da LC 116/2003 listados: 25.05; 15.09; 17.12; 10.05.',
  },
  E0904: {
    category: 'REQUEST',
    official:
      'Código do tipo de Operação (tpOper) não pode ser informado quando não se tratar de uma compra governamental ou um dos serviços da LC 116/2003 listados: 25.05; 15.09; 17.12; 10.05.',
  },
  E0905: {
    category: 'REQUEST',
    official:
      'O grupo de documentos referenciados deve ser informado para o tipo de operação (tpOper).',
  },
  E0906: {
    category: 'REQUEST',
    official:
      'O grupo de documentos referenciados não pode ser informado para o tipo de operação (tpOper).',
  },
  E0907: { category: 'REQUEST', official: 'NFS-e referenciada é inválida.' },
  E0910: {
    category: 'REQUEST',
    official:
      'O destinatário não deve ser identificado para o código indicador indDest informado.',
  },
  E0911: {
    category: 'REGISTRATION',
    official: 'CNPJ do destinatário informado na DPS é inválido.',
  },
  E0912: {
    category: 'REGISTRATION',
    official:
      'CNPJ do destinatário não encontrado no cadastro CNPJ na data de competência.',
  },
  E0913: {
    category: 'REGISTRATION',
    official: 'CPF do destinatário informado na DPS é inválido.',
  },
  E0914: {
    category: 'REGISTRATION',
    official:
      'CPF do destinatário não encontrado no cadastro CPF na data de competência.',
  },
  E0920: {
    category: 'MUNICIPAL',
    official:
      'O código do município para o endereço do destinatário do serviço não existe conforme tabela de município do IBGE.',
  },
  E0921: {
    category: 'REGISTRATION',
    official:
      'O código do município informado na DPS para o endereço do destinatário do serviço, identificado pelo CNPJ, não corresponde ao município registrado em seus cadastros na data de competência informada na DPS.',
  },
  E0922: {
    category: 'REGISTRATION',
    official:
      'O código do município informado na DPS para o endereço do destinatário do serviço, identificado pelo CPF, não corresponde ao município registrado em seus cadastros na data de competência informada na DPS.',
  },
  E0928: {
    category: 'REQUEST',
    official:
      'Não é permitido o grupo de informações relativo a imóvel quando o código de tributação nacional (cTribNac) não pertencer a algum dos subitens 07.02.01, 07.02.02, 07.04.01, 07.05,01, 07.05.02, 07.06.01, 07.06.02, 07.07.01, 07.08.01, 07.17.01 e 07.19.01 da lista de serviços e, o código indicador da operação (cIndOp) não for relativo a operações com imóveis (020101, 020201 ou 020301), conforme a tabela IndOp do ANEXO_C-INDOP_IBSCBS-SNNFSe-ESPEC.',
  },
  E0930: { category: 'REQUEST', official: 'E-mail inválido.' },
  E0931: {
    category: 'REQUEST',
    official:
      'Não é permitido o grupo de informações relativo a imóvel quando o código de tributação nacional, relativo à construção civil, for infomado na DPS.',
  },
  E0932: {
    category: 'REQUEST',
    official:
      'É obrigatório o grupo de informações relativo ao imóvel na DPS quando o código indicador da operação informado for relacionado à imóvel conforme a tabela IndOp do ANEXO_C-INDOP_IBSCBS-SNNFSe-ESPEC.',
  },
  E0933: { category: 'REQUEST', official: 'Código CIB inválido.' },
  E0934: {
    category: 'REQUEST',
    official:
      'O grupo de informações de endereço da atividade sobre bem imóvel ocorrido no exterior deve ser informado quando o país do local da prestação for informado na DPS.',
  },
  E0935: {
    category: 'MUNICIPAL',
    official:
      'O grupo de informações de endereço da atividade sobre bem imóvel ocorrido no exterior não deve ser informado quando o município do local da prestação for informado na DPS.',
  },
  E0940: { category: 'REQUEST', official: 'Chave DF-e incorreta.' },
  E0942: {
    category: 'DEADLINE',
    official:
      'Outros documentos ficais fiscais não podem ser informados quando a data de competência for posterior a 31 de dezembro de 2025.',
  },
  E0943: {
    category: 'MUNICIPAL',
    official:
      'O código do município emissor do documento fiscal para fins de reembolso, repasse e ressarcimento que não está no repositório nacional está incorreto.',
  },
  E0945: {
    category: 'REGISTRATION',
    official:
      'CNPJ do fornecedor de reembolso, repasse e ressarcimento informado na DPS é inválido.',
  },
  E0946: {
    category: 'REGISTRATION',
    official:
      'CNPJ do fornecedor de reembolso, repasse e ressarcimento informado não encontrado no cadastro CNPJ na data de competência.',
  },
  E0947: {
    category: 'REGISTRATION',
    official:
      'CPF do fornecedor de reembolso, repasse e ressarcimento informado informado na DPS é inválido.',
  },
  E0948: {
    category: 'REGISTRATION',
    official:
      'CPF do fornecedor de reembolso, repasse e ressarcimento informado não encontrado no cadastro CPF na data de competência.',
  },
  E0950: {
    category: 'DEADLINE',
    official:
      'Data de emissão do documento tem que ser igual ou posterior à data de competência (dtCompDoc)',
  },
  E0951: {
    category: 'DEADLINE',
    official:
      'Data de competência do documento tem que ser igual ou anterior à data de emissão (dtEmiDoc)',
  },
  E0952: {
    category: 'REQUEST',
    official:
      'A descrição do tipo de reembolso, repasse e ressarcimento não deve ser preenchida.',
  },
  E0953: {
    category: 'REQUEST',
    official:
      'O valor reembolso, repasse e ressarcimento deve ser menor ou igual ao valor do serviço prestado.',
  },
  E0958: {
    category: 'REQUEST',
    official:
      'cClassTrib para IBS/CBS incorreto para operação de prestação de serviços.',
  },
  E0959: {
    category: 'REQUEST',
    official: 'cClassTrib não pertence ao grupo CST indicado.',
  },
  E0964: {
    category: 'REQUEST',
    official: 'Grupo de tributação regular não deve ser informado.',
  },
  E0965: {
    category: 'REQUEST',
    official: 'Grupo de tributação regular deve ser informado.',
  },
  E0969: {
    category: 'REQUEST',
    official:
      'cClassTribReg para IBS/CBS incorreto para operação de prestação de serviços.',
  },
  E0970: {
    category: 'REQUEST',
    official: 'cClassTribReg não pertence ao grupo CST indicado em CSTReg.',
  },
  E0971: {
    category: 'REQUEST',
    official: 'Grupo de diferimento para IBS/CBS não deve ser informado.',
  },
  E0972: {
    category: 'REQUEST',
    official: 'Grupo de diferimento para IBS/CBS deve ser informado.',
  },
  E1200: {
    category: 'CERTIFICATE',
    official: 'Certificado de Transmissão Inválido',
  },
  E1203: {
    category: 'CERTIFICATE',
    official: 'Certificado de Transmissão expirado',
  },
  E1205: {
    category: 'CERTIFICATE',
    official: 'Certificado de Transmissão - Erro Cadeira de Certificação',
  },
  E1206: {
    category: 'CERTIFICATE',
    official: 'Certificado de Transmissão - Erro de acesso a LCR',
  },
  E1207: {
    category: 'CERTIFICATE',
    official: 'Certificado de Transmissão revogado',
  },
  E1208: {
    category: 'CERTIFICATE',
    official: 'Certificado de Transmissão difere da ICP - Brasil',
  },
  E1209: {
    category: 'CERTIFICATE',
    official: 'Certificado de Transmissão sem CNPJ ou CPF.',
  },
  E1225: {
    category: 'PAYLOAD',
    official: 'Falha na decodificação da base 64 da área de dados',
  },
  E1226: {
    category: 'PAYLOAD',
    official: 'Estrutura descompactada mal formada.',
  },
  E1228: {
    category: 'PAYLOAD',
    official:
      'Uso de prefixo de namespace não permitido na área de dados descompactada.',
  },
  E1229: {
    category: 'PAYLOAD',
    official: 'XML não está utilizando codificação UTF8.',
  },
  E1235: { category: 'PAYLOAD', official: 'Falha no esquema XML do DF-e.' },
  E1242: {
    category: 'REQUEST',
    official: 'Tipo DF-e não tratado pelo Sistema Nacional NFS-e.',
  },
  E1260: {
    category: 'PAYLOAD',
    official: 'O prazo de aceitação da versão do leiaute da NFS-e expirou.',
  },
  E1263: {
    category: 'REQUEST',
    official:
      'Conteúdo informado no identificador da NFS-e difere da concatenação dos campos correspondentes que formam o identificador.',
  },
  E1268: {
    category: 'REQUEST',
    official:
      'Chave de acesso informada para a NFS-e já foi compartilhada com o ADN.',
  },
  E1270: {
    category: 'MUNICIPAL',
    official:
      'A data de competência deve ser igual ou posterior à data de ativação do convênio do município emissor informado na DPS.',
  },
  E1272: {
    category: 'MUNICIPAL',
    official:
      'O código do município informado não existe ou não está ativo no convênio municipal na data de processamento de compartilhamento com o ADN.',
  },
  E1274: {
    category: 'MUNICIPAL',
    official:
      'O ambiente gerador da NFS-e não está de acordo com a definição 1 (Sistema Próprio do Município) ou 2 (Sefin Nacional).',
  },
  E1276: {
    category: 'MUNICIPAL',
    official:
      'A informação do processo de emissão de NFS-e é exclusiva para notas emitidas pela Sefin Nacional NFS-e. O município não deve informar este campo nas NFS-e compartilhadas com o ADN NFS-e.',
  },
  E1278: {
    category: 'DEADLINE',
    official:
      'A data e hora do processamento (geração) da NFS-e deve ser anterior ou igual à data da recepção pelo Sistema Nacional NFS-e.',
  },
  E1280: {
    category: 'REGISTRATION',
    official:
      'CNPJ informado para o emitente da NFS-e é inválido (verificar DV).',
  },
  E1282: {
    category: 'REGISTRATION',
    official:
      'O CNPJ do emitente não corresponde ao CNPJ do informado conforme o tipo de emitente informado na DPS.',
  },
  E1284: {
    category: 'REGISTRATION',
    official:
      'CPF informado para o emitente da NFS-e é inválido (verificar DV).',
  },
  E1285: {
    category: 'REGISTRATION',
    official:
      'O CPF do emitente não corresponde ao CPF do informado conforme o tipo de emitente informado na DPS.',
  },
  E1286: {
    category: 'REGISTRATION',
    official:
      'O código do município do emitente da NFS-e difere do código do municipio emissor informado na NFS-e.',
  },
  E1287: {
    category: 'MUNICIPAL',
    official:
      'O valor calculado de dedução/redução não corresponde aos valores de (valor do serviço x percentual de dedução/redução), quando pDR é informado na DPS ou ao somatório dos valores do campo vDeducaoReducao, quando um ou mais documentos são informados para dedução/redução da base de cálculo do ISSQN.',
  },
  E1288: {
    category: 'REQUEST',
    official:
      'O valor calculado do percentual de reduçãõ da base de cálculo por Benefício Municipal não corresponde aos valores de (valor do serviço x percentual de benefício municipal), quando pRedBCBM é informado na DPS.',
  },
  E1289: {
    category: 'MUNICIPAL',
    official:
      'O produto do valor da base de cálculo pela alíquota aplicada, ambos informados na NFS-e compartilhada, não está de acordo com o resultado cálculado pelo sistema (vBC x pAliAplic).',
  },
  E1294: {
    category: 'DEADLINE',
    official: 'Prazo para entrega da DF-e excedido.',
  },
  E1295: {
    category: 'REQUEST',
    official:
      'O valor da base cálculo deve ser igual ao valor do serviço menos desconto incondicionado e, valores monetários de dedução/redução e benefício municipal e valores relativos ao fornecimento próprio de bens materiais ou relacionados a operações de terceiros, objeto de reembolso, repasse ou ressarcimento pelo recebedor, informados na NFS-e.',
  },
  E1297: {
    category: 'MUNICIPAL',
    official:
      'O valor BC calculado não pode estar reduzida de forma que resulte para valor do ISSQN a uma alíquota efetiva menor que 2%, exceto para os códigos relativos aos subitens 042201, 042301, 050901, 070201, 070202, 070501 , 070502, 090201, 090202, 100101, 100102, 100103, 100104, 100105, 100201, 100202, 100301, 100401, 100402, 100403, 100501, 100502, 100601, 100701, 100801, 100901, 101001, 150101, 150102, 150103, 150104, 150105, 151001, 151002, 151003, 151004, 151005, 160101, 160102, 160103, 160104, 160201, 170501, 170601, 171001, 171002, 171101, 171102, 171201, 210101, 250301, da lista de serviços nacional do Sistema Nacional NFS-e.',
  },
  E1300: {
    category: 'MUNICIPAL',
    official: 'Não é permitido informar alíquota aplicada superior a 5%.',
  },
  E1301: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido informar o código do local de incidência quando o campo referente à tributação do ISSQN indicar imunidade, exportação ou não incidência.',
  },
  E1302: {
    category: 'REGISTRATION',
    official:
      'Exceto para o campo vLiq, não é permitido informar os demais campos do grupo valores para prestador de serviço optante do simples nacional do tipo MEI.',
  },
  E1303: {
    category: 'MUNICIPAL',
    official:
      'Exceto para o campo vLiq, não é permitido informar os demais campos do grupo valores quando o campo referente à tributação do ISSQN indicar imunidade, exportação ou não incidência.',
  },
  E1304: {
    category: 'MUNICIPAL',
    official:
      'O código do município emissor da NFS-e não existe conforme tabela do IBGE ou difere do código do municipio que está compartilhando o documento com o ADN do Sistema Nacional NFS-e.',
  },
  E1305: {
    category: 'MUNICIPAL',
    official:
      'É obrigatório informar o código do local de incidência quando o campo referente à tributação do ISSQN indicar Operação Tributável.',
  },
  E1307: {
    category: 'REGISTRATION',
    official:
      'Exceto para o campo vLiq, não é permitido informar os demais campos do grupo valores quando o prestador de serviço possui algum regime especial de tributação.',
  },
  E1308: {
    category: 'LIFECYCLE',
    official:
      'NFS-e a ser substituída não possui um evento de Cancelamento por substituição compartilhado com o ADN e por isso não pode ser substituída.',
  },
  E1309: {
    category: 'MUNICIPAL',
    official:
      'O código do local de incidência do ISSQN não existe conforme a tabela de municípios IBGE ou tabela de concessões de rodovia ou tabela de localidade geral no ANEXO_A-MUNICIPIO_IBGE-PAISES_ISO2-SNNFSe.',
  },
  E1310: {
    category: 'LIFECYCLE',
    official:
      'O identificador desta NFS-e substituta não está referenciado no evento de Cancelamento por substituição da NFS-e substituída.',
  },
  E1311: {
    category: 'MUNICIPAL',
    official:
      'Exceto para o campo vLiq, não é permitido informar os demais campos do grupo valores quando a exigibilidade da tributação do ISSQN estiver suspensa por decisão judicial ou administrativa.',
  },
  E1313: {
    category: 'REGISTRATION',
    official:
      'A localidade de incidência para o ISSQN deve corresponder ao município do estabelecimento/domicílio do prestador do serviço, quando não for informado o código de tributação nacional (cTribNac) 200101, da lista nacional de serviços do Sistema Nacional NFS-e, e a localidade de prestação do serviço corresponder a "Águas Marítimas" (0000000).',
  },
  E1317: {
    category: 'MUNICIPAL',
    official:
      'O local de incidência do ISSQN deve ser igual ao município da prestação do serviço (NFSe/infNFSe/DPS/infDPS/serv/locPrest/cLocPrestacao) do serviço informado na NFS-e compartilhada pelo município, quando informado qualquer código de tributação nacional cuja regra de incidência indique o local da prestação, conforme a tabela MUN.INCID_INFO.SERV. do ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe.',
  },
  E1321: {
    category: 'REGISTRATION',
    official:
      'O local de incidência do ISSQN deve ser igual ao município do endereço do tomador do serviço informado na NFS-e compartilhada pelo município (NFSe/infNFSe/DPS/infDPS/toma/end/endNac/cMun).',
  },
  E1325: {
    category: 'REGISTRATION',
    official:
      'O local de incidência do ISSQN deve ser igual ao município do endereço do prestador (NFSe/infNFSe/DPS/infDPS/prest/end/endNac/cMun) do serviço informado na NFS-e compartilhada pelo município, quando informado qualquer código de tributação nacional cuja regra de incidência indique o município do estabelecimento do prestador, conforme a tabela MUN.INCID_INFO.SERV. do ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe.',
  },
  E1327: {
    category: 'MUNICIPAL',
    official:
      'É obrigatório informar a descrição do local de incidência quando o código do local de incidência (cLocIncid) for informado.',
  },
  E1329: {
    category: 'MUNICIPAL',
    official:
      'Não é permitido informar a descrição do local de incidência quando o código do local de incidência (cLocIncid) não for informado.',
  },
  E1388: {
    category: 'REGISTRATION',
    official:
      'O endereço nacional do intermediário do serviço deve ser informado na DPS quando o intermediário for identificado pelo CNPJ.',
  },
  E1402: {
    category: 'REQUEST',
    official:
      'Quando é informado o subitem 200101 para o código de tributação nacional (cTribNac), não é permitido informar 0000000, que representa "Águas Marítimas", para o local de prestação do serviço (cLocPrestacao).',
  },
  E1506: {
    category: 'REQUEST',
    official:
      'O valor total de tributos retidos da NFS-e não pode ser inferior a zero.',
  },
  E1508: {
    category: 'REQUEST',
    official: 'O valor líquido da NFS-e não pode ser inferior a zero.',
  },
  E1515: {
    category: 'REQUEST',
    official:
      'É obrigatório informar o grupo de informações de IBS/CBS da NFS-e quando o grupo de informações de IBS/CBS da DPS for informado.',
  },
  E1517: {
    category: 'REQUEST',
    official:
      'Não é permitido informar o grupo de informações de IBS/CBS da NFS-e quando o grupo de informações de IBS/CBS da DPS não for informado.',
  },
  E1521: {
    category: 'MUNICIPAL',
    official:
      'Código da localidade de incidência diverge do que deveria ser informado de acordo com a tabela de indicador da operação.',
  },
  E1522: {
    category: 'REQUEST',
    official:
      'O percentual redutor para compras governamentais (IBS/CBS) não deve ser informado.',
  },
  E1523: {
    category: 'REQUEST',
    official:
      'O percentual redutor para compras governamentais (IBS/CBS) deve ser informado.',
  },
  E1530: {
    category: 'REQUEST',
    official: 'Valor da Base de cálculo para IBS/CBS incorreto.',
  },
  E1531: {
    category: 'CERTIFICATE',
    official:
      'O valor objeto de reembolso, repasse ou ressarcimento já tributados que não integram da base de cálculo do ISSQN, do IBS e da CBS (vCalcReeRepRes) não deve ser informado.',
  },
  E1533: {
    category: 'CERTIFICATE',
    official:
      'O valor objeto de reembolso, repasse ou ressarcimento já tributados que não integram da base de cálculo do ISSQN, do IBS e da CBS (vCalcReeRepRes) deve ser informado.',
  },
  E1534: {
    category: 'CERTIFICATE',
    official:
      'O valor objeto de reembolso, repasse ou ressarcimento já tributados que não integram da base de cálculo do ISSQN, do IBS e da CBS (vCalcReeRepRes) deve ser menor que o valor do serviço prestado.',
  },
  E1535: {
    category: 'CERTIFICATE',
    official:
      'O valor objeto de reembolso, repasse ou ressarcimento já tributados que não integram da base de cálculo do ISSQN, do IBS e da CBS (vCalcReeRepRes) incorreto.',
  },
  E1538: {
    category: 'REQUEST',
    official:
      'O NIF ou cNaoNIF do fornecedor deve ser informado quando o grupo de informações de endereço no exterior do fornecedor de serviços for informado.',
  },
  E1539: {
    category: 'MUNICIPAL',
    official: 'Alíquota da UF para IBS incorreta.',
  },
  E1540: {
    category: 'MUNICIPAL',
    official:
      'O percentual redutor de alíquota para o IBS estadual não deve ser informado para o código da classificação tributária - cClassTribIBSCBS informado na DPS.',
  },
  E1541: {
    category: 'MUNICIPAL',
    official:
      'O percentual redutor de alíquota para o IBS estadual deve ser informado para o código da classificação tributária - cClassTribIBSCBS informado na DPS.',
  },
  E1543: {
    category: 'MUNICIPAL',
    official:
      'O percentual redutor de alíquota para o IBS estadual informado difere do indicado para o o código da classificação tributária - cClassTribIBSCBS informado na DPS.',
  },
  E1545: {
    category: 'MUNICIPAL',
    official:
      'O percentual redutor de alíquota para o IBS municipal não deve ser informado para o código da classificação tributária - cClassTribIBSCBS informado na DPS.',
  },
  E1546: {
    category: 'MUNICIPAL',
    official:
      'O percentual redutor de alíquota para o IBS municipal deve ser informado para o código da classificação tributária - cClassTribIBSCBS informado na DPS.',
  },
  E1547: {
    category: 'MUNICIPAL',
    official:
      'O percentual redutor de alíquota para o IBS municipal informado difere do indicado para o o código da classificação tributária - cClassTribIBSCBS informado na DPS.',
  },
  E1548: {
    category: 'MUNICIPAL',
    official: 'Percentual de redução de alíquota municipal incorreto.',
  },
  E1549: {
    category: 'MUNICIPAL',
    official: 'Alíquota efetiva do Município para IBS incorreta.',
  },
  E1550: {
    category: 'MUNICIPAL',
    official:
      'O percentual redutor de alíquota para a CBS não deve ser informado para o código da classificação tributária - cClassTribIBSCBS informado na DPS.',
  },
  E1551: {
    category: 'MUNICIPAL',
    official:
      'O percentual redutor de alíquota para a CBS deve ser informado para o código da classificação tributária - cClassTribIBSCBS informado na DPS.',
  },
  E1552: {
    category: 'MUNICIPAL',
    official:
      'O percentual redutor de alíquota para a CBS informado difere do indicado para o o código da classificação tributária - cClassTribIBSCBS informado na DPS.',
  },
  E1553: {
    category: 'MUNICIPAL',
    official: 'Percentual redutor de alíquota para a CBS incorreto.',
  },
  E1554: {
    category: 'MUNICIPAL',
    official: 'Alíquota efetiva da União para CBS incorreta.',
  },
  E1555: {
    category: 'REQUEST',
    official: 'Valor total da NFS-e está incorreto.',
  },
  E1556: { category: 'REQUEST', official: 'Valor total do IBS incorreto.' },
  E1557: {
    category: 'MUNICIPAL',
    official: 'Percentual redutor de alíquota para o IBS estadual incorreto.',
  },
  E1558: {
    category: 'MUNICIPAL',
    official: 'Alíquota da União para CBS incorreta.',
  },
  E1560: {
    category: 'REQUEST',
    official: 'Grupo crédito presumido para IBS não deve ser informado.',
  },
  E1561: {
    category: 'REQUEST',
    official: 'Grupo crédito presumido para IBS deve ser informado.',
  },
  E1565: {
    category: 'REQUEST',
    official:
      'Valor do diferimento para o IBS estadual não deve ser informado.',
  },
  E1566: {
    category: 'REQUEST',
    official: 'Valor do diferimento para o IBS estadual deve ser informado.',
  },
  E1567: {
    category: 'REQUEST',
    official: 'Valor do diferimento para o IBS estadual incorreto.',
  },
  E1568: {
    category: 'REQUEST',
    official: 'Valor total do IBS estadual incorreto.',
  },
  E1569: {
    category: 'REQUEST',
    official:
      'Valor do diferimento para o IBS municipal não deve ser informado.',
  },
  E1570: {
    category: 'REQUEST',
    official: 'Valor do diferimento para o IBS municipal deve ser informado.',
  },
  E1571: {
    category: 'REQUEST',
    official: 'Valor do diferimento para o IBS municipal incorreto.',
  },
  E1572: {
    category: 'REQUEST',
    official: 'Valor total do IBS municipal incorreto.',
  },
  E1575: {
    category: 'REQUEST',
    official: 'Grupo crédito presumido para CBS não deve ser informado.',
  },
  E1576: {
    category: 'REQUEST',
    official: 'Grupo crédito presumido para CBS deve ser informado.',
  },
  E1577: {
    category: 'MUNICIPAL',
    official: 'Alíquota efetiva da UF para IBS incorreta.',
  },
  E1578: {
    category: 'MUNICIPAL',
    official: 'Alíquota do Município para IBS incorreta.',
  },
  E1580: {
    category: 'REQUEST',
    official: 'Valor do diferimento para a CBS deve ser informado.',
  },
  E1581: {
    category: 'REQUEST',
    official: 'Valor do diferimento para a CBS incorreto.',
  },
  E1582: {
    category: 'REQUEST',
    official: 'Valor total da CBS da União incorreto.',
  },
  E1583: {
    category: 'REQUEST',
    official:
      'Grupo de tributação regular não deve ser informado para o cClassTribIBSCBS indicado.',
  },
  E1584: {
    category: 'REQUEST',
    official:
      'Grupo de tributação regular deve ser informado para o cClassTribIBSCBS indicado.',
  },
  E1585: {
    category: 'MUNICIPAL',
    official:
      'Alíquota efetiva de tributação regular do IBS estadual incorreta.',
  },
  E1586: {
    category: 'REQUEST',
    official: 'Valor da tributação regular do IBS estadual incorreto.',
  },
  E1587: {
    category: 'MUNICIPAL',
    official:
      'Alíquota efetiva de tributação regular do IBS municipal incorreta.',
  },
  E1588: {
    category: 'REQUEST',
    official: 'Valor da tributação regular do IBS municipal incorreto.',
  },
  E1589: {
    category: 'MUNICIPAL',
    official: 'Alíquota efetiva de tributação regular da CBS incorreta.',
  },
  E1590: {
    category: 'REQUEST',
    official: 'Valor da tributação regular da CBS incorreto.',
  },
  E1600: {
    category: 'REQUEST',
    official:
      'Grupo de compras governamentais não deve ser informando quando o tpEnteGov não foi informado na DPS.',
  },
  E1601: {
    category: 'REQUEST',
    official:
      'Grupo de compras governamentais deve ser informando quando o tpEnteGov não foi informado na DPS.',
  },
  E1602: {
    category: 'MUNICIPAL',
    official: 'Alíquota do IBS de competência do Estado incorreta.',
  },
  E1603: {
    category: 'REQUEST',
    official: 'Valor do Tributo do IBS da UF incorreto.',
  },
  E1604: {
    category: 'MUNICIPAL',
    official: 'Alíquota do IBS de competência do Município incorreta.',
  },
  E1605: {
    category: 'MUNICIPAL',
    official: 'Valor do Tributo do IBS do Município incorreto.',
  },
  E1606: { category: 'MUNICIPAL', official: 'Alíquota da CBS incorreta.' },
  E1607: {
    category: 'REQUEST',
    official: 'Valor do Tributo da CBS incorreto.',
  },
  E1630: {
    category: 'CERTIFICATE',
    official: 'Arquivo enviado com erro na assinatura.',
  },
  E1632: {
    category: 'CERTIFICATE',
    official: 'Certificado Digital da assinatura inválido.',
  },
  E1634: {
    category: 'CERTIFICATE',
    official: 'Certificado Digital fora do padrão estabelecido.',
  },
  E1636: {
    category: 'CERTIFICATE',
    official: 'A assinatura é obrigatória quando for enviado paraa API.',
  },
  E1638: {
    category: 'CERTIFICATE',
    official:
      'A assinatura deve ser feita com o certificado digital do municiípio emissor da NFS-e.',
  },
  E9996: {
    category: 'PAYLOAD',
    official:
      'Nesta versão da aplicação, não é permitida a emissão de NFS-e pelo tomador ou intermediário.',
  },
};

/// Traduz um código de rejeição em mensagem acionável. Código desconhecido
/// (leiaute mais novo que esta tabela) degrada para o próprio código, nunca
/// para uma mensagem inventada.
export function describeNationalError(code: string): {
  code: string;
  category: NationalErrorCategory | 'UNKNOWN';
  official: string | null;
  hint: string;
} {
  const entry = NATIONAL_ERROR_CODES[code];
  if (!entry) {
    return {
      code,
      category: 'UNKNOWN',
      official: null,
      hint: `Rejeição ${code} não catalogada nesta versão do leiaute. Consultar o Anexo I vigente.`,
    };
  }
  return {
    code,
    category: entry.category,
    official: entry.official,
    hint: NATIONAL_ERROR_HINTS[entry.category],
  };
}
