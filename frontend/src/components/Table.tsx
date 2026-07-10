"use client";

import type { ReactNode } from "react";
import CTable from "@cloudscape-design/components/table";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  width?: number | string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
  empty?: ReactNode;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  selectable,
  selectedIds,
  onToggleRow,
  onToggleAll,
  empty,
}: TableProps<T>) {
  const columnDefinitions = columns.map((col) => ({
    id: col.key,
    header: col.header,
    cell: (item: T) => col.render(item),
    width: col.width,
  }));

  // Convert Set<string> selectedIds → array of row objects
  const selectedItems = selectable && selectedIds
    ? rows.filter((row) => selectedIds.has(rowKey(row)))
    : [];

  return (
    <CTable
      columnDefinitions={columnDefinitions}
      items={rows}
      trackBy={(item) => rowKey(item)}
      selectionType={selectable ? "multi" : undefined}
      selectedItems={selectedItems}
      onSelectionChange={({ detail }) => {
        if (!selectable) return;
        const newSelectedIds = new Set(detail.selectedItems.map((item) => rowKey(item)));
        // Determine if this is a toggle-all or single toggle
        if (
          detail.selectedItems.length === rows.length ||
          detail.selectedItems.length === 0
        ) {
          onToggleAll?.(detail.selectedItems.length === rows.length);
        } else {
          // Find what changed
          const added = detail.selectedItems.find((item) => !selectedIds?.has(rowKey(item)));
          const removed = rows.find(
            (row) => selectedIds?.has(rowKey(row)) && !newSelectedIds.has(rowKey(row))
          );
          if (added) onToggleRow?.(rowKey(added));
          else if (removed) onToggleRow?.(rowKey(removed));
        }
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
