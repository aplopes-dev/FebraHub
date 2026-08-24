import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/sales_history/application/sales_history_controller.dart';
import 'package:citybox_pdv/features/sales_history/presentation/widgets/sales_history_filters_panel.dart';
import 'package:citybox_pdv/features/sales_history/presentation/widgets/sales_history_table.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_table.dart';
import 'package:citybox_pdv/ui/pdv_table_footer.dart';

/// Últimas vendas do turno aberto: busca, filtro por situação e paginação
/// sobre uma tabela densa.
///
/// É tabela, e não a lista de cartões que esta tela já foi: o operador vem
/// aqui procurando **uma** venda específica — por número, cliente ou valor — e
/// comparar valores numa coluna alinhada é mais rápido que ler cartão a
/// cartão. `StatefulWidget` só por causa do `TextEditingController` da busca;
/// busca, filtro e página moram no `salesHistoryQueryProvider`, para
/// sobreviverem a ir ao detalhe de uma venda e voltar.
class SalesHistoryPage extends ConsumerStatefulWidget {
  const SalesHistoryPage({super.key});

  @override
  ConsumerState<SalesHistoryPage> createState() => _SalesHistoryPageState();
}

class _SalesHistoryPageState extends ConsumerState<SalesHistoryPage> {
  late final TextEditingController _searchController;

  /// Painel de filtros aberto. Fica na tela, e não no provider de consulta:
  /// é estado de apresentação — o recorte aplicado é que precisa sobreviver à
  /// navegação, não o painel estar aberto.
  bool _filtersOpen = false;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(
      text: ref.read(salesHistoryQueryProvider).search,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(ref.read(cashShiftProvider.notifier).refreshSessionSales());
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _goBack() => context.go(PdvRoutes.home);

  void _toggleFilters() => setState(() => _filtersOpen = !_filtersOpen);

  Future<void> _confirmResetNumbering() async {
    final bool? ok = await showResetNumberingDialog(context);
    if (ok != true) return;
    await ref.read(cashShiftProvider.notifier).resetSaleNumbering();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Numeração zerada. A próxima venda sai como 1.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final SalesHistoryQuery query = ref.watch(salesHistoryQueryProvider);
    final SalesHistoryPageResult result = ref.watch(salesHistoryProvider);

    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.escape, shift: true): _goBack,
      },
      child: Focus(
        autofocus: true,
        child: PdvScaffold(
          appBar: PdvAppBarChrome(
            child: Row(
              children: <Widget>[
                PdvAppBarButton(
                  icon: Icons.chevron_left,
                  label: 'Voltar',
                  secondaryLabel: '(Shift + Esc)',
                  tooltip: 'Voltar para a tela inicial (Shift + Esc)',
                  iconSize: PdvSizes.iconLg,
                  onPressed: _goBack,
                ),
                const _ToolbarSeparator(),
                Expanded(
                  child: _SearchField(
                    controller: _searchController,
                    onChanged:
                        (String value) => ref
                            .read(salesHistoryQueryProvider.notifier)
                            .setSearch(value),
                  ),
                ),
                const _ToolbarSeparator(),
                PdvAppBarButton(
                  icon: Icons.filter_list,
                  label: query.hasActiveFilter ? 'Filtros ●' : 'Filtros',
                  tooltip: 'Filtrar as vendas por período e situação',
                  onPressed: _toggleFilters,
                ),
                _ResetNumberingButton(onPressed: _confirmResetNumbering),
              ],
            ),
          ),
          body: Column(
            children: <Widget>[
              if (_filtersOpen)
                SalesHistoryFiltersPanel(
                  // `key` pela consulta atual: limpar os filtros por fora tem
                  // que remontar o rascunho do painel, senão ele continua
                  // exibindo o período que acabou de ser descartado.
                  key: ValueKey<String>(
                    '${query.status}-${query.from}-${query.to}',
                  ),
                  query: query,
                  onApply: ({
                    required SalesHistoryStatusFilter status,
                    required DateTime? from,
                    required DateTime? to,
                  }) {
                    ref
                        .read(salesHistoryQueryProvider.notifier)
                        .applyFilters(status: status, from: from, to: to);
                    setState(() => _filtersOpen = false);
                  },
                  onClear:
                      () =>
                          ref
                              .read(salesHistoryQueryProvider.notifier)
                              .clearFilters(),
                ),
              const SalesHistoryTableHeader(),
              Expanded(
                child:
                    result.data.isEmpty
                        ? const PdvTableEmpty(message: 'Sem dados para mostrar')
                        : ListView.builder(
                          itemCount: result.data.length,
                          itemBuilder: (BuildContext context, int index) {
                            final SaleRecord sale = result.data[index];
                            return SalesHistoryRow(
                              sale: sale,
                              striped: index.isOdd,
                              onOpen:
                                  () => context.push(
                                    '${PdvRoutes.salesHistory}/${sale.id}',
                                  ),
                            );
                          },
                        ),
              ),
              PdvTableFooter(
                page: result.page,
                totalPages: result.totalPages,
                total: result.total,
                perPage: result.perPage,
                onPerPageChanged:
                    (int value) => ref
                        .read(salesHistoryQueryProvider.notifier)
                        .setPerPage(value),
                onPrevious:
                    result.hasPrevious
                        ? () =>
                            ref
                                .read(salesHistoryQueryProvider.notifier)
                                .previousPage()
                        : null,
                onNext:
                    result.hasNext
                        ? () =>
                            ref
                                .read(salesHistoryQueryProvider.notifier)
                                .nextPage()
                        : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Campo de busca embutido na barra de ações.
///
/// Sem moldura, diferente do `PdvFilledField` do resto do app: aqui ele é uma
/// faixa da própria barra — desenhar a caixa de campo por cima da barra
/// criaria um segundo retângulo dentro de um retângulo da mesma cor.
class _SearchField extends StatelessWidget {
  const _SearchField({required this.controller, required this.onChanged});

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Expanded(
          child: TextField(
            controller: controller,
            onChanged: onChanged,
            style: PdvTypography.bodyMd.copyWith(
              color: PdvAppBarColors.foreground,
            ),
            cursorColor: PdvColors.focusRing,
            decoration: InputDecoration(
              hintText: 'Buscar',
              hintStyle: PdvTypography.bodyMd.copyWith(
                color: PdvColors.textDisabled,
              ),
              filled: false,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: PdvSpacing.lg,
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(right: PdvSpacing.md),
          child: Icon(
            Icons.search,
            size: PdvSizes.iconMd,
            color: PdvAppBarColors.foreground,
          ),
        ),
      ],
    );
  }
}

/// "Zerar numeração" — a próxima venda do turno volta a sair como 1.
///
/// Em azul, e não na cor de texto da barra: é a única ação da barra que muda
/// dado em vez de só filtrar a visão, e precisa se destacar do Voltar e do
/// Filtros ao lado. Vermelho seria exagero — nada é apagado, as vendas já
/// gravadas mantêm o número delas.
class _ResetNumberingButton extends StatelessWidget {
  const _ResetNumberingButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: 'Fazer a próxima venda deste turno começar do número 1',
      child: SizedBox(
        height: PdvSizes.appBarHeight,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            hoverColor: PdvAppBarColors.hover,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.lg),
              child: Center(
                child: Text(
                  'ZERAR NUMERAÇÃO',
                  style: PdvTypography.label.copyWith(
                    color: PdvCounterColors.accentMuted,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Confirmação de "Zerar numeração".
///
/// `Enter` confirma e `Esc` cancela, com os atalhos escritos nos botões: no
/// caixa a mão está no teclado, e uma confirmação que exige mouse interrompe
/// o fluxo mais do que a própria ação.
Future<bool?> showResetNumberingDialog(BuildContext context) {
  return showDialog<bool>(
    context: context,
    builder: (BuildContext ctx) {
      return CallbackShortcuts(
        bindings: <ShortcutActivator, VoidCallback>{
          const SingleActivator(LogicalKeyboardKey.enter):
              () => Navigator.pop(ctx, true),
          const SingleActivator(LogicalKeyboardKey.escape):
              () => Navigator.pop(ctx, false),
        },
        child: Focus(
          autofocus: true,
          child: AlertDialog(
            content: PdvDialogBody(
              child: Text(
                'Você tem certeza que deseja zerar a numeração das vendas?',
                style: PdvTypography.bodyLg,
              ),
            ),
            actionsPadding: EdgeInsets.zero,
            actions: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        minimumSize: const Size.fromHeight(
                          PdvSizes.controlHeightLg,
                        ),
                        shape: const RoundedRectangleBorder(),
                      ),
                      onPressed: () => Navigator.pop(ctx, false),
                      child: Text(
                        'CANCELAR (ESC)',
                        style: PdvTypography.label.copyWith(
                          color: PdvColors.textPrimary,
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: PdvColors.success,
                        foregroundColor: PdvColors.background,
                        minimumSize: const Size.fromHeight(
                          PdvSizes.controlHeightLg,
                        ),
                        shape: const RoundedRectangleBorder(),
                      ),
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('SIM (ENTER)'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
}

class _ToolbarSeparator extends StatelessWidget {
  const _ToolbarSeparator();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: PdvSizes.borderWidthFocus,
      height: PdvSizes.appBarHeight,
      color: PdvAppBarColors.separator,
    );
  }
}
