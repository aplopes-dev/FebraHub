import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/counter/application/food_charges_controller.dart';
import 'package:citybox_pdv/features/customer/application/customer_catalog_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_address.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_picker_dialog.dart';
import 'package:citybox_pdv/features/delivery/data/pos_delivery_api.dart';
import 'package:citybox_pdv/features/shared/application/reset_open_sale.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';
import 'package:citybox_pdv/ui/pdv_money_field.dart';

class DeliveryNewPage extends ConsumerStatefulWidget {
  const DeliveryNewPage({super.key});

  @override
  ConsumerState<DeliveryNewPage> createState() => _DeliveryNewPageState();
}

class _DeliveryNewPageState extends ConsumerState<DeliveryNewPage> {
  final TextEditingController _customer = TextEditingController();
  final TextEditingController _address = TextEditingController();
  final TextEditingController _fee = TextEditingController(text: '5,00');

  DeliveryFulfillment _fulfillment = DeliveryFulfillment.delivery;
  Customer? _selectedCustomer;
  List<PosCourier> _couriers = const <PosCourier>[];
  PosCourier? _selectedCourier;
  bool _loadingCouriers = true;
  bool _loadingCustomer = false;
  bool _submitting = false;

  bool get _isPickup => _fulfillment == DeliveryFulfillment.pickup;

  @override
  void initState() {
    super.initState();
    _loadCouriers();
  }

  Future<void> _loadCouriers() async {
    try {
      final List<PosCourier> couriers =
          await ref.read(posDeliveryApiProvider).listCouriers();
      if (!mounted) return;
      setState(() {
        _couriers = couriers;
        _loadingCouriers = false;
      });
    } on PdvApiException catch (error) {
      if (!mounted) return;
      setState(() => _loadingCouriers = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Future<void> _pickCustomer() async {
    final CustomerSelection? selection = await showCustomerPickerDialog(
      context,
      selected: _selectedCustomer,
    );
    if (selection == null || !mounted) return;
    final Customer? picked = selection.customer;
    if (picked == null) {
      setState(() => _selectedCustomer = null);
      _customer.clear();
      _address.clear();
      return;
    }

    setState(() => _loadingCustomer = true);
    try {
      final Customer customer = await ref
          .read(posCustomersApiProvider)
          .getById(picked.id);
      if (!mounted) return;
      final CustomerAddress address =
          customer.deliveryAddress ?? customer.address;
      final String addressText = _formatAddress(address);
      setState(() => _selectedCustomer = customer);
      _customer.text = customer.name;
      _address.text = addressText;
      if (addressText.isEmpty && !_isPickup) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Cliente sem endereço cadastrado. Preencha o endereço manualmente.',
            ),
          ),
        );
      }
    } on PdvApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _loadingCustomer = false);
    }
  }

  @override
  void dispose() {
    _customer.dispose();
    _address.dispose();
    _fee.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final Customer? customer = _selectedCustomer;
      final CustomerAddress structuredAddress =
          customer?.deliveryAddress ??
          customer?.address ??
          const CustomerAddress();
      // Só rascunho local — o ERP/Kanban só recebem o pedido no Salvar / Pagar.
      final String accountId = await ref
          .read(salonProvider.notifier)
          .beginDeliveryDraft(
            addressText: _address.text,
            fulfillment: _fulfillment,
            address: structuredAddress,
            feeCents: _isPickup ? 0 : PdvMoneyField.centsOf(_fee),
            customerId: customer?.id,
            customerName:
                _customer.text.trim().isEmpty ? null : _customer.text.trim(),
            courierId: _isPickup ? null : _selectedCourier?.id,
            courierName: _isPickup ? null : _selectedCourier?.name,
          );
      if (!mounted) {
        return;
      }
      resetOpenSale(ref.read);
      final Customer? forCounter = resolveCounterCustomerFromDelivery(
        customerId: customer?.id,
        customerName:
            _customer.text.trim().isEmpty ? null : _customer.text.trim(),
      );
      final CounterCustomerController customerCtrl = ref.read(
        counterCustomerProvider.notifier,
      );
      if (forCounter == null) {
        customerCtrl.clear();
      } else {
        customerCtrl.setCustomer(forCounter);
      }
      ref
          .read(foodChargesProvider.notifier)
          .setDeliveryFeeCents(_isPickup ? 0 : PdvMoneyField.centsOf(_fee));
      context.go(
        '${PdvRoutes.counter}?accountId=$accountId&returnTo=${PdvRoutes.deliveryOrders}',
      );
    } on ArgumentError catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message?.toString() ?? 'Dados inválidos')),
      );
    } on PdvApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PdvScaffold(
      // Sem app bar própria: a padrão do PdvScaffold já traz o Voltar, e o
      // nome da tela vive na barra de título (`currentPageProvider`).
      body: ListView(
        padding: const EdgeInsets.all(PdvSpacing.lg),
        children: <Widget>[
          Text(
            'Forma de entrega',
            style: PdvTypography.label.copyWith(color: PdvColors.textSecondary),
          ),
          const SizedBox(height: PdvSpacing.sm),
          SegmentedButton<DeliveryFulfillment>(
            segments: <ButtonSegment<DeliveryFulfillment>>[
              for (final DeliveryFulfillment option
                  in DeliveryFulfillment.values)
                ButtonSegment<DeliveryFulfillment>(
                  value: option,
                  label: Text(option.label),
                  icon: Icon(
                    option == DeliveryFulfillment.pickup
                        ? Icons.storefront_outlined
                        : Icons.delivery_dining_outlined,
                  ),
                ),
            ],
            selected: <DeliveryFulfillment>{_fulfillment},
            onSelectionChanged:
                (Set<DeliveryFulfillment> picked) =>
                    setState(() => _fulfillment = picked.first),
          ),
          const SizedBox(height: PdvSpacing.lg),
          FilledButton.tonalIcon(
            onPressed: _loadingCustomer ? null : _pickCustomer,
            icon: const Icon(Icons.person_search_outlined),
            label: Text(
              _loadingCustomer
                  ? 'Carregando cliente…'
                  : _selectedCustomer == null
                  ? 'Buscar cliente no CRM'
                  : 'Cliente: ${_selectedCustomer!.name}',
            ),
          ),
          const SizedBox(height: PdvSpacing.md),
          PdvFilledField(
            label:
                _selectedCustomer == null
                    ? 'Nome do cliente (avulso)'
                    : 'Nome do cliente',
            controller: _customer,
            enabled: _selectedCustomer == null,
            helperText:
                _selectedCustomer == null
                    ? 'Use somente quando o cliente não estiver no CRM.'
                    : null,
          ),
          const SizedBox(height: PdvSpacing.md),
          // Endereço, taxa e entregador só existem na entrega. Na retirada o
          // cliente vem ao balcão: manter os campos em tela, cinzas, só daria
          // o que preencher à toa.
          if (!_isPickup) ...<Widget>[
            PdvFilledField(
              label: 'Endereço',
              controller: _address,
              maxLines: 2,
            ),
            const SizedBox(height: PdvSpacing.md),
            PdvMoneyField(label: 'Taxa de entrega', controller: _fee),
            const SizedBox(height: PdvSpacing.md),
            DropdownButtonFormField<PosCourier>(
              initialValue: _selectedCourier,
              decoration: pdvFilledDecoration(
                label: 'Entregador',
                helperText:
                    _loadingCouriers
                        ? 'Carregando entregadores…'
                        : 'Pode ser definido antes de despachar.',
              ),
              items: <DropdownMenuItem<PosCourier>>[
                for (final PosCourier courier in _couriers)
                  DropdownMenuItem<PosCourier>(
                    value: courier,
                    child: Text(courier.name),
                  ),
              ],
              onChanged:
                  _loadingCouriers
                      ? null
                      : (PosCourier? value) =>
                          setState(() => _selectedCourier = value),
            ),
          ],
          const SizedBox(height: PdvSpacing.lg),
          FilledButton(
            onPressed: _submitting || _loadingCustomer ? null : _submit,
            child: Text(
              _submitting ? 'Criando delivery…' : 'Continuar no Balcão',
            ),
          ),
        ],
      ),
    );
  }
}

String _formatAddress(CustomerAddress address) {
  return <String>[
    <String>[
      address.street,
      address.number,
    ].where((String value) => value.isNotEmpty).join(', '),
    address.complement,
    address.district,
    <String>[
      address.city,
      address.state,
    ].where((String value) => value.isNotEmpty).join(' - '),
    if (address.zipCode.isNotEmpty) 'CEP ${address.zipCode}',
  ].where((String value) => value.isNotEmpty).join(' · ');
}
