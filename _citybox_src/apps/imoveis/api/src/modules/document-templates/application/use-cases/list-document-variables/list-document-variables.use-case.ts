import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  DOCUMENT_VARIABLE_GROUPS,
  DOCUMENT_VARIABLES,
  type DocumentVariableDef,
  type DocumentVariableGroupId,
} from '../../policies/document-variable-catalog';

export type ListDocumentVariablesOutput = {
  groups: Record<DocumentVariableGroupId, string>;
  variables: readonly DocumentVariableDef[];
};

@Injectable()
export class ListDocumentVariablesUseCase implements IUseCase<
  void,
  ListDocumentVariablesOutput
> {
  async execute(): Promise<ListDocumentVariablesOutput> {
    return {
      groups: DOCUMENT_VARIABLE_GROUPS,
      variables: DOCUMENT_VARIABLES,
    };
  }
}
