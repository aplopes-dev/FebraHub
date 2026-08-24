import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/layout/pdv_breakpoints.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/payment/application/complete_sale.dart';
import 'package:citybox_pdv/features/payment/application/payment_draft_controller.dart';
import 'package:citybox_pdv/features/payment/application/payment_entries_controller.dart';
import 'package:citybox_pdv/features/payment/application/payment_summary_provider.dart';
import 'package:citybox_pdv/features/payment/domain/payment_entry.dart';
import 'package:citybox_pdv/features/payment/domain/payment_summary.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/payment_app_bar.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/payment_brand_picker.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/payment_entries_panel.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/payment_keypad.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/payment_method_sidebar.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/payment_summary_panel.dart';

/// Tela de Pagamento — onde a venda é recebida e fechada.
///
/// Expandido: três colunas (formas | teclado | lançados+fechamento).
/// Médio/compacto: empilha mantendo a ação de finalizar acessível.
class PaymentPage extends ConsumerStatefulWidget {
  const PaymentPage({super.key});

  @override
  ConsumerState<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends ConsumerState<PaymentPage> {
  bool _finalizing = false;

  /// Lança o pagamento em composição.
  void _receive() {
    final PaymentDraft draft = ref.read(paymentDraftProvider);
    if (!draft.canReceive) {
      return;
    }

    ref
        .read(paymentEntriesProvider.notifier)
        .add(
          PaymentEntry(
            method: draft.method,
            amountCents: draft.amountCents,
            brand: draft.brand,
            installments: draft.installments,
          ),
        );
    ref.read(paymentDraftProvider.notifier).reset();
  }

  /// Preenche o campo com o que falta receber — o atalho INSERT e o link
  /// "Receber valor total" caem os dois aqui.
  void _fillRemaining() {
    final PaymentSummary summary = ref.read(paymentSummaryProvider);
    if (summary.remainingCents <= 0) {
      return;
    }
    ref
        .read(paymentDraftProvider.notifier)
        .setAmountCents(summary.remainingCents);
  }

  Future<void> _finalize() async {
    if (_finalizing || !ref.read(paymentSummaryProvider).canFinalize) {
      return;
    }
    setState(() => _finalizing = true);
    try {
      await completeSaleOnline(ref);
      if (!mounted) {
        return;
      }
      String query = '';
      try {
        query = GoRouterState.of(context).uri.query;
      } on Object {
        query = '';
      }
      final String path =
          query.isEmpty
              ? PdvRoutes.saleCompleted
              : '${PdvRoutes.saleCompleted}?$query';
      context.go(path);
    } on PdvApiException catch (error) {
      if (!mounted) {
        return;
      }
      final String message =
          error.isOffline
              ? 'Sem conexão. Conecte-se à rede para finalizar a venda.'
              : (error.message.isNotEmpty
                  ? error.message
                  : 'Não foi possível finalizar a venda. Tente novamente.');
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(SnackBar(content: Text(message)));
    } on StateError catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) {
        setState(() => _finalizing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.enter): _receive,
        const SingleActivator(LogicalKeyboardKey.numpadEnter): _receive,
        const SingleActivator(LogicalKeyboardKey.insert): _fillRemaining,
        const SingleActivator(LogicalKeyboardKey.f2): () {
          unawaited(_finalize());
        },
      },
      child: Focus(
        autofocus: true,
        child: Stack(
          children: <Widget>[
            PdvScaffold(
              appBar: const PaymentAppBar(),
              contentPadding: EdgeInsets.zero,
              body: _PaymentContent(
                onReceive: _receive,
                onFinalize: () {
                  unawaited(_finalize());
                },
              ),
            ),
            if (_finalizing)
              const ColoredBox(
                color: Color(0x66000000),
                child: Center(child: CircularProgressIndicator()),
              ),
          ],
        ),
      ),
    );
  }
}

class _PaymentContent extends ConsumerWidget {
  const _PaymentContent({required this.onReceive, required this.onFinalize});

  final VoidCallback onReceive;
  final VoidCallback onFinalize;

  static const double _sidebarWidth = 200;
  static const double _rightColumnWidth = 400;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final PaymentDraft draft = ref.watch(paymentDraftProvider);

    return ColoredBox(
      color: PdvCounterColors.background,
      child: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          final PdvFormat format = PdvLayout.ofWidth(constraints.maxWidth);
          if (format.isExpanded) {
            return _expanded(draft);
          }
          if (format.isMedium) {
            return _medium(draft);
          }
          return _compact(draft);
        },
      ),
    );
  }

  Widget _keypadColumn(PaymentDraft draft) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(PdvSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: <Widget>[
          SizedBox(
            width: 380,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                if (draft.method.requiresBrand)
                  PaymentStepTrail(
                    brand: draft.brand,
                    hasAmount: draft.amountCents > 0,
                  ),
                if (draft.needsBrand)
                  PaymentBrandPicker(brands: draft.method.brands)
                else
                  PaymentKeypad(onReceive: onReceive),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _rightColumn({required bool scrollSummary}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        const Expanded(child: PaymentEntriesPanel()),
        if (scrollSummary)
          Flexible(
            fit: FlexFit.loose,
            child: SingleChildScrollView(
              child: PaymentSummaryPanel(onFinalize: onFinalize),
            ),
          )
        else
          PaymentSummaryPanel(onFinalize: onFinalize),
      ],
    );
  }

  Widget _expanded(PaymentDraft draft) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        const SizedBox(width: _sidebarWidth, child: PaymentMethodSidebar()),
        Expanded(child: _keypadColumn(draft)),
        SizedBox(
          width: _rightColumnWidth,
          child: _rightColumn(scrollSummary: false),
        ),
      ],
    );
  }

  Widget _medium(PaymentDraft draft) {
    return Column(
      children: <Widget>[
        Expanded(
          flex: 3,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              const SizedBox(width: 160, child: PaymentMethodSidebar()),
              Expanded(child: _keypadColumn(draft)),
            ],
          ),
        ),
        Expanded(flex: 2, child: _rightColumn(scrollSummary: true)),
      ],
    );
  }

  Widget _compact(PaymentDraft draft) {
    return Column(
      children: <Widget>[
        const SizedBox(height: 140, child: PaymentMethodSidebar()),
        Expanded(flex: 3, child: _keypadColumn(draft)),
        Expanded(flex: 2, child: _rightColumn(scrollSummary: true)),
      ],
    );
  }
}
