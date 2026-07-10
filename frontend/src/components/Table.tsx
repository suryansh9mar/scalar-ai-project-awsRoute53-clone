"use client";

import { useState, type ReactNode } from "react";
import CTable, { type TableProps } from "@cloudscape-design/components/table";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Optional field name on T used for client-side sorting. Defaults to `key`. */
  sortingField?: string;
  width?: number | string;
}

interface TableProps_<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
  empty?: ReactNode;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  selectable,
  selectedIds,
  onToggleRow,
  onToggleAll,
  empty,
}: TableProps_<T>) {
  const [sortingColumn, setSortingColumn] = useState<TableProps.SortingColumn<T> | undefined>();
  const [sortingDescending, setSortingDescending] = useState(false);

  const columnDefinitions: TableProps.ColumnDefinition<T>[] = columns.map((col) => ({
    id: col.key,
    header: col.header,
    cell: (item: T) => col.render(item),
    width: col.width,
    sortingField: col.sortingField ?? col.key,
  }));

  // Client-side sort
  const sortField = sortingColumn?.sortingField as string | undefined;
  const sortedRows = sortField
    ? [...rows].sort((a, b) => {
        const aVal = a[sortField] ?? "";
        const bVal = b[sortField] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: "base" });
        return sortingDescending ? -cmp : cmp;
      })
    : rows;

  // Convert Set<string> selectedIds → array of row objects
  const selectedItems =
    selectable && selectedIds ? rows.filter((row) => selectedIds.has(rowKey(row))) : [];

  return (
    <CTable
      columnDefinitions={columnDefinitions}
      items={sortedRows}
      trackBy={(item) => rowKey(item)}
      selectionType={selectable ? "multi" : undefined}
      selectedItems={selectedItems}
      onSelectionChange={({ detail }) => {
        if (!selectable) return;
        const newSelectedIds = new Set(detail.selectedItems.map((item) => rowKey(item)));
        if (
          detail.selectedItems.length === rows.length ||
          detail.selectedItems.length === 0
        ) {
          onToggleAll?.(detail.selectedItems.length === rows.length);
        } else {
          const added = detail.selectedItems.find((item) => !selectedIds?.has(rowKey(item)));
          const removed = rows.find(
            (row) => selectedIds?.has(rowKey(row)) && !newSelectedIds.has(rowKey(row))
          );
          if (added) onToggleRow?.(rowKey(added));
          else if (removed) onToggleRow?.(rowKey(removed));
        }
      }}
      sortingColumn={sortingColumn}
      sortingDescending={sortingDescending}
      onSortingChange={({ detail }) => {
        setSortingColumn(detail.sortingColumn);
        setSortingDescending(detail.isDescending ?? false);
      }}
      empty={
        empty ? (
          <Box textAlign="center" color="inherit">
            {empty}
          </Box>
        ) : (
          <Box textAlign="center" color="inherit">
            <SpaceBetween size="m">
              <b>No items</b>
            </SpaceBetween>
          </Box>
        )
      }
      variant="embedded"
      stickyHeader
    />
  );
}
