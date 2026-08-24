import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { buildProductImportTemplateBuffer } from '../../utils/product-import-xlsx';

@Injectable()
export class GetProductImportTemplateUseCase implements IUseCase<
  void,
  Buffer
> {
  async execute(): Promise<Buffer> {
    return buildProductImportTemplateBuffer();
  }
}
