import type {
  StoreSettingsData,
  PaymentMethodConfig,
  PrinterConfig,
  ReceiptConfig,
  TaxConfig,
} from '../types/settings';

export const INITIAL_STORE_SETTINGS: StoreSettingsData = {
  logoUrl: null,
  storeName: 'ClaPos Ilhéus - Gastronomia & Hamburgueria',
  phone: '+55 (73) 99823-8821',
  whatsapp: '+55 (73) 99823-8821',
  city: 'Ilhéus',
  state: 'Bahia',
  neighborhood: 'Centro Histórico',
  postCode: '45653-000',
  fullAddress: 'Av. Soares Lopes, 1420, Centro, Ilhéus - BA',
};

export const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: '1', name: 'PIX (QR Code Instantâneo)', enabled: true, type: 'pix', icon: 'QrCode' },
  { id: '2', name: 'Cartão de Crédito', enabled: true, type: 'credit', icon: 'CreditCard' },
  { id: '3', name: 'Cartão de Débito', enabled: true, type: 'debit', icon: 'CreditCard' },
  { id: '4', name: 'Dinheiro', enabled: true, type: 'cash', icon: 'Banknote' },
  { id: '5', name: 'Vale Refeição (VR / VA)', enabled: true, type: 'voucher', icon: 'Ticket' },
];

export const INITIAL_PRINTERS: PrinterConfig[] = [
  {
    id: 'p1',
    name: 'Impressora Principal do Caixa (Epson TM-T20III)',
    type: 'cashier',
    connection: 'usb',
    autoPrint: true,
  },
  {
    id: 'p2',
    name: 'Impressora da Cozinha (Bematech MP-4200 TH)',
    type: 'kitchen',
    connection: 'network',
    ipAddress: '192.168.1.200',
    autoPrint: true,
  },
];

export const INITIAL_RECEIPT_CONFIG: ReceiptConfig = {
  headerText: 'ClaPos Ilhéus - O Melhor Hambúrguer da Cidade',
  footerText: 'Obrigado pela preferência! Volte sempre!',
  showCnpj: true,
  cnpj: '12.345.678/0001-90',
  showLogo: true,
  showPixQrCode: true,
};

export const INITIAL_TAX_CONFIG: TaxConfig = {
  serviceTaxPercent: 10,
  enableServiceTax: true,
  salesTaxPercent: 0,
  enableSalesTax: false,
};
