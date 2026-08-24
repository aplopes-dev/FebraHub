'use client';

import { DataTable, type DataTableProps } from '@citybox/ui/organisms';
import { reportsDataTableStyleProps } from '../lib/reports-data-table-styles';

/**
 * DataTable dos relatórios com scroll horizontal só na tabela
 * (paginação fica fora do overflow, para os botões clicarem).
 */
export function ReportsDataTable<TData, TValue>(
  props: DataTableProps<TData, TValue>,
) {
  const {
    className,
    tableClassName,
    headerClassName,
    tableWrapperClassName,
    ...rest
  } = props;

  return (
    <DataTable
      {...rest}
      className={className ?? reportsDataTableStyleProps.className}
      tableWrapperClassName={
        tableWrapperClassName ??
        reportsDataTableStyleProps.tableWrapperClassName
      }
      tableClassName={
        tableClassName ?? reportsDataTableStyleProps.tableClassName
      }
      headerClassName={
        headerClassName ?? reportsDataTableStyleProps.headerClassName
      }
    />
  );
}
