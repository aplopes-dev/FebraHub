import 'package:citybox_pdv/core/http/pdv_api_client.dart';

/// Mensagem amigável para falha de cancelamento no PDV.
///
/// Prefere `error.message` da API (já é `externalMessage`). Só inventa texto
/// quando o envelope veio genérico ou sem código conhecido.
String cancelSaleErrorMessage(PdvApiException error) {
  final String message = error.message.trim();
  final String? code = error.code;

  if (code == 'PosSaleReceivablesInUseError') {
    return message.isNotEmpty
        ? message
        : 'Esta venda tem recebíveis conciliados e não pode ser cancelada. '
            'Desfaça a conciliação no ERP primeiro.';
  }
  if (code == 'PosSaleSupervisorRequiredError') {
    return message.isNotEmpty
        ? message
        : 'Este cancelamento exige autorização de supervisor.';
  }
  if (code == 'PosSaleCashSessionRequiredError') {
    return message.isNotEmpty
        ? message
        : 'Abra o caixa neste terminal antes de cancelar a venda.';
  }
  if (code == 'PosSaleCancelForbiddenError') {
    return message.isNotEmpty
        ? message
        : 'Você não tem permissão para cancelar esta venda.';
  }
  if (message.isNotEmpty && message.toLowerCase() != 'erro') {
    return message;
  }
  return 'Não foi possível cancelar a venda. Tente de novo ou fale com o suporte.';
}
