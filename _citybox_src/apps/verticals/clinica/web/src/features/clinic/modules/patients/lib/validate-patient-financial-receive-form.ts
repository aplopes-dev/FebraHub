import { parseBrlCurrencyToCents } from './patient-budget-form-utils';
import type { PatientFinancialReceiveFormValues } from '../types/patient-financial-receive-form';

export function validatePatientFinancialReceiveForm(
  values: PatientFinancialReceiveFormValues,
): string | null {
  if (parseBrlCurrencyToCents(values.paidAmount) <= 0) {
    return 'Informe o valor pago.';
  }

  if (!values.receivedDate) {
    return 'Informe a data de recebimento.';
  }

  if (!values.cashRegisterId) {
    return 'Selecione o caixa.';
  }

  if (values.paymentMethod === 'check') {
    if (!values.checkIssueDate) {
      return 'Informe a data do cheque.';
    }

    if (!values.checkHolderName.trim()) {
      return 'Informe o nome do cheque.';
    }

    if (!values.checkNumber.trim()) {
      return 'Informe o número do cheque.';
    }

    if (!values.checkBank.trim()) {
      return 'Informe o banco.';
    }

    if (!values.checkDocument.trim()) {
      return 'Informe o CPF/CNPJ.';
    }
  }

  return null;
}
