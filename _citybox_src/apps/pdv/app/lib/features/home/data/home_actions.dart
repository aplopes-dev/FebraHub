import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/home/domain/home_action.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';

/// Catálogo das ações da tela inicial.
///
/// A ordem desta lista **é** a ordem na tela, e a posição de cada ação é
/// memória muscular: mover um bloco depois que o lojista treinou a equipe custa
/// mais caro que qualquer refatoração. Acrescente no fim; não reordene sem
/// motivo forte.
///
/// Os subtítulos são fixtures — passam a vir da sessão e da configuração da
/// loja quando a integração existir.
const List<HomeAction> homeActions = <HomeAction>[
  // --- Grade: as ações que abrem uma venda ---------------------------------
  HomeAction(
    id: PdvModuleIds.counter,
    label: 'Balcão',
    icon: Icons.shopping_cart_outlined,
    color: PdvActionColors.counter,
    placement: HomeActionPlacement.grid,
    gridColumn: HomeGridColumn.primary,
    shortcut: LogicalKeyboardKey.keyB,
    shortcutLabel: 'B',
  ),
  HomeAction(
    id: PdvModuleIds.customer,
    label: 'Cliente',
    subtitle: 'Consumidor final — padrão',
    icon: Icons.people_outline,
    color: PdvActionColors.customer,
    placement: HomeActionPlacement.grid,
    gridColumn: HomeGridColumn.secondary,
    shortcut: LogicalKeyboardKey.f8,
    shortcutLabel: 'F8',
  ),
  HomeAction(
    id: PdvModuleIds.tables,
    label: 'Mesas',
    icon: Icons.restaurant_outlined,
    color: PdvActionColors.tables,
    placement: HomeActionPlacement.grid,
    gridColumn: HomeGridColumn.primary,
    shortcut: LogicalKeyboardKey.keyM,
    shortcutLabel: 'M',
  ),
  HomeAction(
    id: PdvModuleIds.service,
    label: 'Atendimentos',
    icon: Icons.list_alt_outlined,
    color: PdvActionColors.service,
    placement: HomeActionPlacement.grid,
    gridColumn: HomeGridColumn.secondary,
    shortcut: LogicalKeyboardKey.keyA,
    shortcutLabel: 'A',
  ),
  HomeAction(
    id: PdvModuleIds.tabs,
    label: 'Comandas',
    icon: Icons.receipt_long_outlined,
    color: PdvActionColors.tabs,
    placement: HomeActionPlacement.grid,
    gridColumn: HomeGridColumn.primary,
    shortcut: LogicalKeyboardKey.keyQ,
    shortcutLabel: 'Q',
  ),
  HomeAction(
    id: PdvModuleIds.seller,
    label: 'Vendedor',
    subtitle: 'Sem vendedor',
    icon: Icons.person_outline,
    color: PdvActionColors.seller,
    placement: HomeActionPlacement.grid,
    gridColumn: HomeGridColumn.secondary,
    shortcut: LogicalKeyboardKey.f9,
    shortcutLabel: 'F9',
  ),

  // --- Coluna: apoio à operação do turno -----------------------------------
  // Novo pedido: só em Pedidos delivery → "Novo delivery" (não há atalho
  // separado "Delivery" na Home).
  HomeAction(
    id: PdvModuleIds.priceCheck,
    label: 'Consulta de preço',
    icon: Icons.qr_code_scanner_outlined,
    color: PdvActionColors.priceCheck,
    placement: HomeActionPlacement.rail,
    shortcut: LogicalKeyboardKey.keyP,
    shortcutLabel: 'P',
  ),
  HomeAction(
    id: PdvModuleIds.credit,
    label: 'Crédito dos clientes',
    icon: Icons.attach_money,
    color: PdvActionColors.credit,
    placement: HomeActionPlacement.rail,
    shortcut: LogicalKeyboardKey.keyC,
    shortcutLabel: 'C',
  ),
  HomeAction(
    id: PdvModuleIds.history,
    label: 'Últimas vendas',
    icon: Icons.shopping_cart_checkout,
    color: PdvActionColors.history,
    placement: HomeActionPlacement.rail,
    shortcut: LogicalKeyboardKey.keyU,
    shortcutLabel: 'U',
  ),
  HomeAction(
    id: PdvModuleIds.refund,
    label: 'Devolução',
    icon: Icons.swap_vert,
    color: PdvActionColors.refund,
    placement: HomeActionPlacement.rail,
    shortcut: LogicalKeyboardKey.keyV,
    shortcutLabel: 'V',
  ),
  HomeAction(
    id: PdvModuleIds.deliveryOrders,
    label: 'Delivery',
    icon: Icons.moped_outlined,
    color: PdvActionColors.deliveryOrders,
    placement: HomeActionPlacement.rail,
    shortcut: LogicalKeyboardKey.keyD,
    shortcutLabel: 'D',
  ),
  HomeAction(
    id: PdvModuleIds.cashDrawer,
    label: 'Sangria / reforço',
    icon: Icons.work_outline,
    color: PdvActionColors.cashDrawer,
    placement: HomeActionPlacement.rail,
    shortcut: LogicalKeyboardKey.keyS,
    shortcutLabel: 'S',
  ),
  HomeAction(
    id: PdvModuleIds.cashHub,
    label: 'Caixa',
    subtitle: 'Abrir / fechar turno',
    icon: Icons.point_of_sale_outlined,
    color: PdvActionColors.cashHub,
    placement: HomeActionPlacement.rail,
    shortcut: LogicalKeyboardKey.keyX,
    shortcutLabel: 'X',
  ),
  HomeAction(
    id: PdvModuleIds.settings,
    label: 'Configurações',
    icon: Icons.settings_outlined,
    color: PdvActionColors.settings,
    placement: HomeActionPlacement.rail,
    // Ç não tem constante própria em `LogicalKeyboardKey`; no teclado ABNT2 ela
    // ocupa a posição da `;` do layout americano, que é o que o Flutter reporta.
    shortcut: LogicalKeyboardKey.semicolon,
    shortcutLabel: 'Ç',
  ),
];

/// Ações da grade, na ordem de exibição.
Iterable<HomeAction> get gridActions => homeActions.where(
  (HomeAction action) => action.placement == HomeActionPlacement.grid,
);

/// Ações da coluna lateral, na ordem de exibição.
Iterable<HomeAction> get railActions => homeActions.where(
  (HomeAction action) => action.placement == HomeActionPlacement.rail,
);
