import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/tables/domain/salon_account.dart';

class FoodChargesState {
  const FoodChargesState({
    this.couvert,
    this.serviceFeeEnabled = false,
    this.serviceFeePercentBps = 1000,
    this.deliveryFeeCents = 0,
  });

  final CouvertState? couvert;
  final bool serviceFeeEnabled;
  final int serviceFeePercentBps;
  final int deliveryFeeCents;

  FoodChargesState copyWith({
    CouvertState? couvert,
    bool clearCouvert = false,
    bool? serviceFeeEnabled,
    int? serviceFeePercentBps,
    int? deliveryFeeCents,
  }) {
    return FoodChargesState(
      couvert: clearCouvert ? null : (couvert ?? this.couvert),
      serviceFeeEnabled: serviceFeeEnabled ?? this.serviceFeeEnabled,
      serviceFeePercentBps: serviceFeePercentBps ?? this.serviceFeePercentBps,
      deliveryFeeCents: deliveryFeeCents ?? this.deliveryFeeCents,
    );
  }
}

final NotifierProvider<FoodChargesController, FoodChargesState>
foodChargesProvider = NotifierProvider<FoodChargesController, FoodChargesState>(
  FoodChargesController.new,
);

class FoodChargesController extends Notifier<FoodChargesState> {
  @override
  FoodChargesState build() => const FoodChargesState();

  void setServiceFee({required bool enabled, int? percentBps}) {
    state = state.copyWith(
      serviceFeeEnabled: enabled,
      serviceFeePercentBps: percentBps,
    );
  }

  void setCouvert({required int unitCents, required int covers}) {
    if (unitCents <= 0 || covers < 1) {
      state = state.copyWith(clearCouvert: true);
      return;
    }
    state = state.copyWith(
      couvert: CouvertState(unitCents: unitCents, covers: covers),
    );
  }

  void clearCouvert() => state = state.copyWith(clearCouvert: true);

  void setDeliveryFeeCents(int cents) {
    state = state.copyWith(deliveryFeeCents: cents < 0 ? 0 : cents);
  }

  void clear() => state = const FoodChargesState();
}
