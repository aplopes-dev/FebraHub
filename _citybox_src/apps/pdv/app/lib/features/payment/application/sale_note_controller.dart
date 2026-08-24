import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Observação da venda — o que o operador anota para sair no cupom.
///
/// Vazio = sem observação. O texto é aparado ao entrar: um campo com só
/// espaços é indistinguível de vazio para quem lê a tela, e deixá-lo passar
/// faria a faixa da observação aparecer em branco no resumo.
final NotifierProvider<SaleNoteController, String> saleNoteProvider =
    NotifierProvider<SaleNoteController, String>(SaleNoteController.new);

class SaleNoteController extends Notifier<String> {
  @override
  String build() => '';

  void setNote(String note) => state = note.trim();

  void clear() => state = '';
}
