import {
  maxLengthFor,
  type FiscalAdditionalInfo,
} from '../../../../domain/entities/fiscal-additional-info.entity';

export class FiscalAdditionalInfoPresenter {
  static toHttpDetail(info: FiscalAdditionalInfo) {
    return {
      id: info.id,
      name: info.name,
      text: info.text,
      documentType: info.documentType,
      target: info.target,
      // O limite do campo é do XSD e a UI precisa dele para avisar antes de
      // estourar — expor evita duplicar a tabela de tetos no front.
      maxLength: maxLengthFor(info.documentType, info.target),
      createdAt: info.createdAt.toISOString(),
      updatedAt: info.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(info: FiscalAdditionalInfo) {
    return { data: FiscalAdditionalInfoPresenter.toHttpDetail(info) };
  }

  static toHttpList(infos: FiscalAdditionalInfo[]) {
    return {
      data: infos.map((info) =>
        FiscalAdditionalInfoPresenter.toHttpDetail(info),
      ),
    };
  }
}
