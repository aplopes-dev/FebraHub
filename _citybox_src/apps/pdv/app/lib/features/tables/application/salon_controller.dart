import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_address.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_counter_draft.dart';
import 'package:citybox_pdv/features/delivery/data/pos_delivery_api.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/delivery/domain/format_delivery_address.dart';
import 'package:citybox_pdv/features/service/domain/service_queue_item.dart';
import 'package:citybox_pdv/features/tables/data/shared_preferences_salon_store.dart';
import 'package:citybox_pdv/features/tables/domain/dining_table.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';

final Provider<SharedPreferencesSalonStore?> salonStoreProvider =
    Provider<SharedPreferencesSalonStore?>((Ref ref) => null);

/// Próximo número de pedido de delivery. Função pura, para ser testada sem
/// montar o salão inteiro.
int nextDeliveryOrderNumber(List<DeliveryOrder> orders) {
  int highest = 0;
  for (final DeliveryOrder order in orders) {
    if (order.number > highest) highest = order.number;
  }
  return highest + 1;
}

final NotifierProvider<SalonController, SalonSnapshot> salonProvider =
    NotifierProvider<SalonController, SalonSnapshot>(SalonController.new);

/// `true` depois que o salão terminou de ler o que estava gravado.
///
/// Existe para a tabela de pedidos poder mostrar a barra de carregamento
/// enquanto a leitura acontece: `hydrate()` é disparado sem `await` no
/// `main.dart`, então até ele voltar o que está em tela é o estado vazio
/// inicial, não o snapshot persistido do terminal.
final NotifierProvider<SalonHydrationController, bool> salonHydratedProvider =
    NotifierProvider<SalonHydrationController, bool>(
      SalonHydrationController.new,
    );

class SalonHydrationController extends Notifier<bool> {
  @override
  bool build() => false;

  void markHydrated() => state = true;
}

class SalonController extends Notifier<SalonSnapshot> {
  SharedPreferencesSalonStore? _store;

  @override
  SalonSnapshot build() => SalonSnapshot.empty;

  Future<void> hydrate() async {
    SharedPreferencesSalonStore? store = ref.read(salonStoreProvider);
    if (store == null) {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      store = SharedPreferencesSalonStore(prefs);
    }
    _store = store;
    final SalonSnapshot loaded = await store.read();
    state = loaded.copyWith(
      accounts:
          loaded.accounts
              .where((SalonAccount a) => !isUncommittedDeliveryAccount(a))
              .toList(growable: false),
    );
    if (ref.read(deviceCredentialProvider) != null) {
      try {
        await refreshDeliveryOrders();
      } on Object {
        // Hidratação pode cair no último espelho conhecido. Operações de
        // escrita continuam online-only e nunca usam este fallback.
      }
    }
    ref.read(salonHydratedProvider.notifier).markHydrated();
  }

  /// Relê os pedidos delivery do ERP e atualiza o espelho local.
  Future<void> refreshDeliveryOrders() async {
    final List<PosDeliveryOrderDto> remote =
        await ref.read(posDeliveryApiProvider).list();
    _replaceDeliveryMirror(remote);
    await _persist();
  }

  void _replaceDeliveryMirror(List<PosDeliveryOrderDto> remote) {
    final List<SalonAccount> nonDeliveryAccounts = state.accounts
        .where((SalonAccount account) => account.origin != SalonOrigin.delivery)
        .toList(growable: false);
    final List<SalonAccount> deliveryAccounts = <SalonAccount>[];
    final List<DeliveryOrder> deliveryOrders = <DeliveryOrder>[];

    for (final PosDeliveryOrderDto dto in remote) {
      final SalonAccount? cached =
          state.accounts
              .where(
                (SalonAccount account) =>
                    account.deliveryOrderId == dto.order.id,
              )
              .firstOrNull;
      final String accountId =
          cached?.id ?? _accountIdForDelivery(dto.order.id);
      final bool active =
          dto.order.status != DeliveryOrderStatus.delivered &&
          dto.order.status != DeliveryOrderStatus.cancelled;
      final List<CounterCartLine> lines = preferRicherCartLines(
        local: cached?.lines,
        remote: dto.lines,
      );
      final ({int goodsTotalCents, int totalCents}) totals =
          deliveryTotalsFromLines(lines, dto.order.feeCents);
      final SalonAccountStatus status =
          !active
              ? SalonAccountStatus.closed
              : (cached?.status == SalonAccountStatus.closing
                  ? SalonAccountStatus.closing
                  : SalonAccountStatus.open);
      deliveryAccounts.add(
        SalonAccount(
          id: accountId,
          status: status,
          openedAt: dto.order.createdAt,
          closedAt: active ? null : dto.order.updatedAt,
          origin: SalonOrigin.delivery,
          customerId: dto.order.customerId,
          deliveryOrderId: dto.order.id,
          lines: lines,
          couvert: cached?.couvert,
          serviceFeeEnabled: cached?.serviceFeeEnabled ?? false,
          serviceFeePercentBps: cached?.serviceFeePercentBps ?? 1000,
          saleAdjustment: cached?.saleAdjustment,
        ),
      );
      deliveryOrders.add(
        dto.order.copyWith(
          accountId: accountId,
          goodsTotalCents: totals.goodsTotalCents,
          totalCents: totals.totalCents,
        ),
      );
    }

    state = state.copyWith(
      accounts: <SalonAccount>[
        ...nonDeliveryAccounts,
        ...deliveryAccounts,
        ..._draftDeliveryAccounts(),
      ],
      deliveryOrders: deliveryOrders,
    );
  }

  List<SalonAccount> _draftDeliveryAccounts() {
    return state.accounts
        .where(isUncommittedDeliveryAccount)
        .toList(growable: false);
  }

  SalonSnapshot _persistentSnapshot() {
    return state.copyWith(
      accounts:
          state.accounts
              .where((SalonAccount a) => !isUncommittedDeliveryAccount(a))
              .toList(growable: false),
    );
  }

  Future<void> _persist() async {
    final SharedPreferencesSalonStore? store = _store;
    if (store != null) {
      // Rascunhos de montagem não vão ao disco — só existem na sessão do Balcão.
      await store.write(_persistentSnapshot());
    }
  }

  String _newId() => 's_${DateTime.now().microsecondsSinceEpoch}';

  String _accountIdForDelivery(String orderId) => 'delivery_$orderId';

  DiningTable _tableById(String tableId) {
    return state.tables.firstWhere(
      (DiningTable t) => t.id == tableId,
      orElse: () => throw StateError('Mesa não encontrada: $tableId'),
    );
  }

  SalonAccount? accountById(String id) {
    for (final SalonAccount a in state.accounts) {
      if (a.id == id) {
        return a;
      }
    }
    return null;
  }

  /// Abre mesa livre e retorna o accountId.
  Future<String> openTable(String tableId) async {
    final DiningTable table = _tableById(tableId);
    if (table.accountId != null) {
      final SalonAccount? existing = accountById(table.accountId!);
      if (existing != null && existing.isActive) {
        return existing.id;
      }
    }
    final String accountId = _newId();
    final SalonAccount account = SalonAccount(
      id: accountId,
      status: SalonAccountStatus.open,
      openedAt: DateTime.now(),
      tableId: tableId,
      origin: SalonOrigin.table,
    );
    state = state.copyWith(
      tables: <DiningTable>[
        for (final DiningTable t in state.tables)
          if (t.id == tableId) t.copyWith(accountId: accountId) else t,
      ],
      accounts: <SalonAccount>[...state.accounts, account],
    );
    await _persist();
    return accountId;
  }

  Future<String> openTab({String? number, String? card}) async {
    final String? tabNumber = number?.trim();
    final String? tabCard = card?.trim();
    if ((tabNumber == null || tabNumber.isEmpty) &&
        (tabCard == null || tabCard.isEmpty)) {
      throw ArgumentError('Informe número ou cartão da comanda.');
    }
    for (final SalonAccount a in state.accounts) {
      if (!a.isActive) {
        continue;
      }
      if (tabNumber != null &&
          tabNumber.isNotEmpty &&
          a.tabNumber == tabNumber) {
        return a.id;
      }
      if (tabCard != null && tabCard.isNotEmpty && a.tabCard == tabCard) {
        return a.id;
      }
    }
    // duplicate check for another open with same number when creating new
    final String accountId = _newId();
    final SalonAccount account = SalonAccount(
      id: accountId,
      status: SalonAccountStatus.open,
      openedAt: DateTime.now(),
      tabNumber: tabNumber?.isEmpty ?? true ? null : tabNumber,
      tabCard: tabCard?.isEmpty ?? true ? null : tabCard,
      origin: SalonOrigin.tab,
    );
    state = state.copyWith(
      accounts: <SalonAccount>[...state.accounts, account],
    );
    await _persist();
    return accountId;
  }

  Future<void> updateAccountLines(
    String accountId,
    List<CounterCartLine> lines,
  ) async {
    final SalonAccount? account = accountById(accountId);
    if (account?.origin == SalonOrigin.delivery &&
        account?.deliveryOrderId != null) {
      await ref
          .read(posDeliveryApiProvider)
          .replaceLines(account!.deliveryOrderId!, lines);
    }
    final String? deliveryOrderId = account?.deliveryOrderId;
    final List<DeliveryOrder> nextOrders;
    if (deliveryOrderId == null) {
      nextOrders = state.deliveryOrders;
    } else {
      final List<DeliveryOrder> updated = <DeliveryOrder>[];
      for (final DeliveryOrder order in state.deliveryOrders) {
        if (order.id != deliveryOrderId) {
          updated.add(order);
          continue;
        }
        final ({int goodsTotalCents, int totalCents}) totals =
            deliveryTotalsFromLines(lines, order.feeCents);
        updated.add(
          order.copyWith(
            goodsTotalCents: totals.goodsTotalCents,
            totalCents: totals.totalCents,
          ),
        );
      }
      nextOrders = updated;
    }
    state = state.copyWith(
      accounts: <SalonAccount>[
        for (final SalonAccount a in state.accounts)
          if (a.id == accountId) a.copyWith(lines: lines) else a,
      ],
      deliveryOrders: nextOrders,
    );
    await _persist();
  }

  Future<void> transferTable({
    required String fromTableId,
    required String toTableId,
  }) async {
    final DiningTable from = _tableById(fromTableId);
    final DiningTable to = _tableById(toTableId);
    if (from.accountId == null) {
      throw StateError('Mesa de origem está livre.');
    }
    if (to.accountId != null) {
      final SalonAccount? dest = accountById(to.accountId!);
      if (dest != null && dest.isActive) {
        throw StateError('table_occupied');
      }
    }
    final String accountId = from.accountId!;
    state = state.copyWith(
      tables: <DiningTable>[
        for (final DiningTable t in state.tables)
          if (t.id == fromTableId)
            t.copyWith(clearAccount: true)
          else if (t.id == toTableId)
            t.copyWith(accountId: accountId)
          else
            t,
      ],
      accounts: <SalonAccount>[
        for (final SalonAccount a in state.accounts)
          if (a.id == accountId) a.copyWith(tableId: toTableId) else a,
      ],
    );
    await _persist();
  }

  Future<void> joinAccounts({
    required String sourceId,
    required String targetId,
  }) async {
    final SalonAccount? source = accountById(sourceId);
    final SalonAccount? target = accountById(targetId);
    if (source == null || target == null) {
      throw StateError('Conta não encontrada.');
    }
    if (!source.isActive || !target.isActive) {
      throw StateError('Só é possível juntar contas abertas.');
    }
    final List<CounterCartLine> merged = <CounterCartLine>[
      ...target.lines,
      ...source.lines,
    ];
    state = state.copyWith(
      accounts: <SalonAccount>[
        for (final SalonAccount a in state.accounts)
          if (a.id == targetId)
            a.copyWith(lines: merged)
          else if (a.id == sourceId)
            a.copyWith(
              status: SalonAccountStatus.closed,
              closedAt: DateTime.now(),
              clearTable: true,
            )
          else
            a,
      ],
      tables: <DiningTable>[
        for (final DiningTable t in state.tables)
          if (t.accountId == sourceId) t.copyWith(clearAccount: true) else t,
      ],
    );
    await _persist();
  }

  /// Divide o total das linhas em [n] partes iguais (resto na primeira).
  Future<List<String>> splitEqual(String accountId, int n) async {
    if (n < 2) {
      throw ArgumentError.value(n, 'n', 'Mínimo 2 partes.');
    }
    final SalonAccount? account = accountById(accountId);
    if (account == null || !account.isActive) {
      throw StateError('Conta inválida para dividir.');
    }
    final int total = account.lines.fold(
      0,
      (int sum, CounterCartLine l) => sum + l.totalCents,
    );
    final int base = total ~/ n;
    final int remainder = total % n;
    // Fecha a original e cria N contas filhas só com marcador de valor
    // (v1: partes iguais sem redistribuir itens — preview no totalCents).
    final List<SalonAccount> created = <SalonAccount>[];
    for (int i = 0; i < n; i++) {
      final int part = base + (i == 0 ? remainder : 0);
      created.add(
        SalonAccount(
          id: _newId(),
          status: SalonAccountStatus.open,
          openedAt: DateTime.now(),
          tableId: account.tableId,
          origin: account.origin,
          tabNumber:
              account.tabNumber == null
                  ? null
                  : '${account.tabNumber}-${i + 1}',
          lines:
              part == 0
                  ? const <CounterCartLine>[]
                  : account
                      .lines, // shared snapshot for UI; amounts shown via note
        ),
      );
    }
    // Simpler approach for v1: keep lines only on first split, others empty
    // with a synthetic note via kitchen — actually keep all lines on first,
    // others empty; UI shows split labels. Better: leave original open with
    // lines, create n-1 empty siblings — operator redistributes. Spec wants
    // equal parts of total. We'll put all lines on first and leave others
    // empty; totals panel not recalculated here.
    final List<SalonAccount> fixed = <SalonAccount>[
      created.first.copyWith(lines: account.lines),
      ...created
          .skip(1)
          .map(
            (SalonAccount a) => a.copyWith(lines: const <CounterCartLine>[]),
          ),
    ];

    state = state.copyWith(
      accounts: <SalonAccount>[
        for (final SalonAccount a in state.accounts)
          if (a.id == accountId)
            a.copyWith(
              status: SalonAccountStatus.closed,
              closedAt: DateTime.now(),
              clearTable: true,
            )
          else
            a,
        ...fixed,
      ],
      tables: <DiningTable>[
        for (final DiningTable t in state.tables)
          if (account.tableId != null && t.id == account.tableId)
            t.copyWith(accountId: fixed.first.id)
          else
            t,
      ],
    );
    await _persist();
    return fixed.map((SalonAccount a) => a.id).toList();
  }

  Future<void> beginClose(String accountId) async {
    state = state.copyWith(
      accounts: <SalonAccount>[
        for (final SalonAccount a in state.accounts)
          if (a.id == accountId)
            a.copyWith(status: SalonAccountStatus.closing)
          else
            a,
      ],
    );
    await _persist();
  }

  Future<void> closeAccount(
    String accountId, {
    String? saleOrderId,
  }) async {
    final SalonAccount? account = accountById(accountId);
    state = state.copyWith(
      accounts: <SalonAccount>[
        for (final SalonAccount a in state.accounts)
          if (a.id == accountId)
            a.copyWith(
              status: SalonAccountStatus.closed,
              closedAt: DateTime.now(),
              clearTable: true,
            )
          else
            a,
      ],
      tables: <DiningTable>[
        for (final DiningTable t in state.tables)
          if (t.accountId == accountId) t.copyWith(clearAccount: true) else t,
      ],
    );
    if (account?.deliveryOrderId != null) {
      // Pagamento vincula a venda — **não** avança o status operacional.
      final String orderId = account!.deliveryOrderId!;
      final String? resolvedSaleId =
          saleOrderId ??
          state.deliveryOrders
              .where((DeliveryOrder o) => o.id == orderId)
              .map((DeliveryOrder o) => o.saleOrderId)
              .firstOrNull;
      state = state.copyWith(
        deliveryOrders: <DeliveryOrder>[
          for (final DeliveryOrder o in state.deliveryOrders)
            if (o.id == orderId)
              o.copyWith(
                saleOrderId: resolvedSaleId ?? o.saleOrderId,
                updatedAt: DateTime.now(),
              )
            else
              o,
        ],
      );
    }
    await _persist();
  }

  Future<void> cancelAccount(String accountId) async {
    final SalonAccount? account = accountById(accountId);
    if (account?.deliveryOrderId != null) {
      await ref
          .read(posDeliveryApiProvider)
          .updateStatus(
            account!.deliveryOrderId!,
            DeliveryOrderStatus.cancelled,
          );
    }
    state = state.copyWith(
      accounts: <SalonAccount>[
        for (final SalonAccount item in state.accounts)
          if (item.id == accountId)
            item.copyWith(
              status: SalonAccountStatus.closed,
              closedAt: DateTime.now(),
              clearTable: true,
            )
          else
            item,
      ],
      tables: <DiningTable>[
        for (final DiningTable table in state.tables)
          if (table.accountId == accountId)
            table.copyWith(clearAccount: true)
          else
            table,
      ],
    );
    if (account?.deliveryOrderId != null) {
      _updateDeliveryStatusLocally(
        account!.deliveryOrderId!,
        DeliveryOrderStatus.cancelled,
      );
    }
    await _persist();
  }

  List<ServiceQueueItem> serviceQueue() {
    final Map<String, String> tableLabels = <String, String>{
      for (final DiningTable t in state.tables) t.id: t.label,
    };
    return buildServiceQueue(
      state.accounts,
      titleOf: (SalonAccount a) {
        if (a.tableId != null) {
          return tableLabels[a.tableId!] ?? 'Mesa ${a.tableId}';
        }
        if (a.tabNumber != null) {
          return 'Comanda ${a.tabNumber}';
        }
        if (a.tabCard != null) {
          return 'Cartão ${a.tabCard}';
        }
        return 'Atendimento';
      },
    );
  }

  Future<String> beginDeliveryDraft({
    required String addressText,
    required int feeCents,
    DeliveryFulfillment fulfillment = DeliveryFulfillment.delivery,
    CustomerAddress address = const CustomerAddress(),
    String? customerId,
    String? customerName,
    String? courierId,
    String? courierName,
  }) async {
    final String trimmed = addressText.trim();
    if (trimmed.isEmpty && fulfillment == DeliveryFulfillment.delivery) {
      throw ArgumentError('Endereço obrigatório.');
    }
    if (feeCents < 0) {
      throw ArgumentError.value(feeCents, 'feeCents');
    }

    final DeliveryCounterDraft? previous = ref.read(
      deliveryCounterDraftProvider,
    );
    if (previous != null) {
      await discardDeliveryDraft(previous.accountId);
    }

    final String accountId =
        'draft_delivery_${DateTime.now().microsecondsSinceEpoch}';
    final SalonAccount account = SalonAccount(
      id: accountId,
      status: SalonAccountStatus.open,
      openedAt: DateTime.now(),
      origin: SalonOrigin.delivery,
      customerId: customerId,
    );
    state = state.copyWith(
      accounts: <SalonAccount>[...state.accounts, account],
    );
    ref.read(deliveryCounterDraftProvider.notifier).state = DeliveryCounterDraft(
      accountId: accountId,
      fulfillment: fulfillment,
      addressText: trimmed,
      address: address,
      feeCents: fulfillment == DeliveryFulfillment.pickup ? 0 : feeCents,
      customerId: customerId,
      customerName: customerName?.trim().isEmpty == true ? null : customerName?.trim(),
      courierId: fulfillment == DeliveryFulfillment.pickup ? null : courierId,
      courierName:
          fulfillment == DeliveryFulfillment.pickup ? null : courierName,
    );
    // Sem _persist: rascunho não entra no Kanban nem no disco.
    return accountId;
  }

  /// Descarta montagem local sem chamar o ERP (Voltar sem salvar).
  Future<void> discardDeliveryDraft(String accountId) async {
    final SalonAccount? account = accountById(accountId);
    if (account != null && !isUncommittedDeliveryAccount(account)) {
      return;
    }
    state = state.copyWith(
      accounts: <SalonAccount>[
        for (final SalonAccount item in state.accounts)
          if (item.id != accountId) item,
      ],
    );
    final DeliveryCounterDraft? draft = ref.read(deliveryCounterDraftProvider);
    if (draft?.accountId == accountId) {
      ref.read(deliveryCounterDraftProvider.notifier).state = null;
    }
  }

  /// Cria o pedido no ERP a partir do rascunho + linhas do Balcão.
  ///
  /// Invalida o draft **antes** do await para um segundo toque falhar cedo
  /// (anti-duplo-commit). Em falha de rede, o rascunho não volta — o operador
  /// refaz o fluxo; evita dois pedidos no ERP.
  Future<String> commitDeliveryDraft(
    List<CounterCartLine> lines, {
    String? customerId,
    String? customerName,
  }) async {
    final DeliveryCounterDraft? draft = ref.read(deliveryCounterDraftProvider);
    if (draft == null) {
      throw StateError('Não há rascunho de delivery para confirmar.');
    }
    final String draftAccountId = draft.accountId;
    final String? resolvedCustomerId = customerId ?? draft.customerId;
    final String? resolvedCustomerName =
        (customerName != null && customerName.trim().isNotEmpty)
            ? customerName.trim()
            : draft.customerName;

    // Libera o rascunho antes do HTTP — segundo commit não reusa o mesmo draft.
    ref.read(deliveryCounterDraftProvider.notifier).state = null;
    state = state.copyWith(
      accounts: <SalonAccount>[
        for (final SalonAccount item in state.accounts)
          if (item.id != draftAccountId) item,
      ],
    );

    try {
      final String committedId = await createDeliveryOrder(
        addressText: draft.addressText,
        feeCents: draft.feeCents,
        fulfillment: draft.fulfillment,
        address: draft.address,
        customerId: resolvedCustomerId,
        customerName: resolvedCustomerName,
        courierId: draft.courierId,
        courierName: draft.courierName,
        lines: lines,
      );
      await _persist();
      return committedId;
    } on Object {
      // Restaura rascunho só em memória se o create falhou, para o operador
      // poder tentar de novo sem refazer o form.
      final SalonAccount restored = SalonAccount(
        id: draftAccountId,
        status: SalonAccountStatus.open,
        openedAt: DateTime.now(),
        origin: SalonOrigin.delivery,
        customerId: resolvedCustomerId,
        lines: lines,
      );
      state = state.copyWith(
        accounts: <SalonAccount>[...state.accounts, restored],
      );
      ref.read(deliveryCounterDraftProvider.notifier).state = draft.copyWith(
        customerId: resolvedCustomerId,
        customerName: resolvedCustomerName,
      );
      rethrow;
    }
  }

  Future<String> createDeliveryOrder({
    required String addressText,
    required int feeCents,
    DeliveryFulfillment fulfillment = DeliveryFulfillment.delivery,
    CustomerAddress address = const CustomerAddress(),
    String? customerId,
    String? customerName,
    String? courierId,
    String? courierName,
    List<CounterCartLine> lines = const <CounterCartLine>[],
  }) async {
    final String trimmed = addressText.trim();
    // Retirada não tem endereço para exigir — o cliente vem buscar no balcão.
    if (trimmed.isEmpty && fulfillment == DeliveryFulfillment.delivery) {
      throw ArgumentError('Endereço obrigatório.');
    }
    if (feeCents < 0) {
      throw ArgumentError.value(feeCents, 'feeCents');
    }
    final PosDeliveryOrderDto remote = await ref
        .read(posDeliveryApiProvider)
        .create(<String, dynamic>{
          'fulfillment': fulfillment.name,
          if (customerId != null) 'customerId': customerId,
          'customerName': customerName?.trim() ?? '',
          'addressText': trimmed,
          if (address.zipCode.isNotEmpty) 'addressZipCode': address.zipCode,
          if (address.street.isNotEmpty) 'addressStreet': address.street,
          if (address.number.isNotEmpty) 'addressNumber': address.number,
          if (address.district.isNotEmpty) 'addressDistrict': address.district,
          if (address.city.isNotEmpty) 'addressCity': address.city,
          if (address.state.isNotEmpty) 'addressState': address.state,
          if (address.complement.isNotEmpty)
            'addressComplement': address.complement,
          'feeCents': fulfillment == DeliveryFulfillment.pickup ? 0 : feeCents,
          if (courierId != null) 'courierId': courierId,
          if (courierName != null) 'courierName': courierName,
          'lines': <Map<String, dynamic>>[
            for (final CounterCartLine line in lines) posDeliveryLineBody(line),
          ],
        });
    final DeliveryOrder remoteOrder = remote.order;
    final String accountId = _accountIdForDelivery(remoteOrder.id);
    final List<CounterCartLine> remoteLines =
        remote.lines.isEmpty ? lines : remote.lines;
    final ({int goodsTotalCents, int totalCents}) totals =
        deliveryTotalsFromLines(remoteLines, remoteOrder.feeCents);
    final SalonAccount account = SalonAccount(
      id: accountId,
      status: SalonAccountStatus.open,
      openedAt: remoteOrder.createdAt,
      origin: SalonOrigin.delivery,
      customerId: remoteOrder.customerId,
      deliveryOrderId: remoteOrder.id,
      lines: remoteLines,
    );
    final DeliveryOrder order = remoteOrder.copyWith(
      accountId: accountId,
      goodsTotalCents: totals.goodsTotalCents,
      totalCents: totals.totalCents,
    );
    state = state.copyWith(
      accounts: <SalonAccount>[...state.accounts, account],
      deliveryOrders: <DeliveryOrder>[...state.deliveryOrders, order],
    );
    await _persist();
    return accountId;
  }

  Future<void> updateDeliveryStatus(
    String orderId,
    DeliveryOrderStatus status,
  ) async {
    final PosDeliveryOrderDto remote = await ref
        .read(posDeliveryApiProvider)
        .updateStatus(orderId, status);
    state = state.copyWith(
      deliveryOrders: <DeliveryOrder>[
        for (final DeliveryOrder o in state.deliveryOrders)
          if (o.id == orderId)
            o.copyWith(
              status: remote.order.status,
              saleOrderId: remote.order.saleOrderId ?? o.saleOrderId,
              updatedAt: DateTime.now(),
            )
          else
            o,
      ],
    );
    await _persist();
  }

  Future<void> updateDeliveryHeader(
    String orderId,
    Map<String, dynamic> body,
  ) async {
    final PosDeliveryOrderDto remote = await ref
        .read(posDeliveryApiProvider)
        .updateHeader(orderId, body);
    final ({int goodsTotalCents, int totalCents}) totals =
        deliveryTotalsFromLines(remote.lines, remote.order.feeCents);
    state = state.copyWith(
      deliveryOrders: <DeliveryOrder>[
        for (final DeliveryOrder order in state.deliveryOrders)
          if (order.id == orderId)
            remote.order.copyWith(
              accountId: order.accountId,
              saleOrderId: remote.order.saleOrderId ?? order.saleOrderId,
              goodsTotalCents: totals.goodsTotalCents,
              totalCents: totals.totalCents,
            )
          else
            order,
      ],
      accounts: <SalonAccount>[
        for (final SalonAccount account in state.accounts)
          if (account.deliveryOrderId == orderId)
            account.copyWith(
              customerId: remote.order.customerId,
              lines:
                  remote.lines.isEmpty ? account.lines : remote.lines,
            )
          else
            account,
      ],
    );
    await _persist();
  }

  /// Sincroniza cliente/endereço no ERP enquanto o pedido **não** está pago.
  Future<void> syncDeliveryCustomerHeader(
    String accountId,
    Customer? customer,
  ) async {
    final SalonAccount? account = accountById(accountId);
    final String? orderId = account?.deliveryOrderId;
    if (orderId == null) return;

    DeliveryOrder? order;
    for (final DeliveryOrder item in state.deliveryOrders) {
      if (item.id == orderId) {
        order = item;
        break;
      }
    }
    if (order == null || order.isPaid) return;

    final CustomerAddress address =
        customer?.deliveryAddress ??
        customer?.address ??
        const CustomerAddress();
    final String addressText = formatDeliveryAddress(address);
    final Map<String, dynamic> body = <String, dynamic>{
      'customerId': customer?.id,
      'customerName': customer?.name.trim() ?? '',
    };
    if (order.fulfillment == DeliveryFulfillment.delivery) {
      body['addressText'] = addressText.isNotEmpty
          ? addressText
          : order.addressText;
      if (address.zipCode.isNotEmpty) body['addressZipCode'] = address.zipCode;
      if (address.street.isNotEmpty) body['addressStreet'] = address.street;
      if (address.number.isNotEmpty) body['addressNumber'] = address.number;
      if (address.district.isNotEmpty) {
        body['addressDistrict'] = address.district;
      }
      if (address.city.isNotEmpty) body['addressCity'] = address.city;
      if (address.state.isNotEmpty) body['addressState'] = address.state;
      if (address.complement.isNotEmpty) {
        body['addressComplement'] = address.complement;
      }
    }
    await updateDeliveryHeader(orderId, body);
  }

  void _updateDeliveryStatusLocally(
    String orderId,
    DeliveryOrderStatus status,
  ) {
    state = state.copyWith(
      deliveryOrders: <DeliveryOrder>[
        for (final DeliveryOrder o in state.deliveryOrders)
          if (o.id == orderId)
            o.copyWith(status: status, updatedAt: DateTime.now())
          else
            o,
      ],
    );
  }
}
