'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StoreSettingsData,
  PaymentMethodConfig,
  PrinterConfig,
  ReceiptConfig,
  TaxConfig,
} from '../types/settings';
import {
  INITIAL_STORE_SETTINGS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_PRINTERS,
  INITIAL_RECEIPT_CONFIG,
  INITIAL_TAX_CONFIG,
} from '../data/mock-settings';

type SettingsStore = {
  storeSettings: StoreSettingsData;
  paymentMethods: PaymentMethodConfig[];
  printers: PrinterConfig[];
  receiptConfig: ReceiptConfig;
  taxConfig: TaxConfig;

  updateStoreSettings: (data: Partial<StoreSettingsData>) => void;
  togglePaymentMethod: (id: string) => void;
  updateReceiptConfig: (data: Partial<ReceiptConfig>) => void;
  updateTaxConfig: (data: Partial<TaxConfig>) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      storeSettings: INITIAL_STORE_SETTINGS,
      paymentMethods: INITIAL_PAYMENT_METHODS,
      printers: INITIAL_PRINTERS,
      receiptConfig: INITIAL_RECEIPT_CONFIG,
      taxConfig: INITIAL_TAX_CONFIG,

      updateStoreSettings: (data) =>
        set((state) => ({
          storeSettings: { ...state.storeSettings, ...data },
        })),

      togglePaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.map((m) =>
            m.id === id ? { ...m, enabled: !m.enabled } : m,
          ),
        })),

      updateReceiptConfig: (data) =>
        set((state) => ({
          receiptConfig: { ...state.receiptConfig, ...data },
        })),

      updateTaxConfig: (data) =>
        set((state) => ({
          taxConfig: { ...state.taxConfig, ...data },
        })),
    }),
    {
      name: 'citybox-pdv-settings-storage',
    },
  ),
);
