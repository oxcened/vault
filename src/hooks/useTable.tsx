import { useReactTable, type TableOptions } from "@tanstack/react-table";
import { useEffect } from "react";
import { STORAGE_KEY_HIDDEN_COLUMNS } from "~/constants";

export function useTable<TData>({
  initialState = {},
  ...options
}: TableOptions<TData>) {
  const tableMeta = options.meta;
  const tableId =
    tableMeta && "id" in tableMeta && typeof tableMeta.id === "string"
      ? tableMeta.id
      : undefined;
  const storageKey = tableId
    ? `${STORAGE_KEY_HIDDEN_COLUMNS}${tableId}`
    : undefined;
  const { columnVisibility, ...initialStateRest } = initialState;

  const table = useReactTable({
    initialState: {
      columnVisibility,
      ...initialStateRest,
    },
    enableSorting: false,
    ...options,
  });

  useEffect(() => {
    if (!storageKey) return;

    try {
      const storedVisibility = JSON.parse(
        window.localStorage.getItem(storageKey) ?? "{}",
      ) as Record<string, boolean>;

      table.setColumnVisibility((currentVisibility) => ({
        ...currentVisibility,
        ...storedVisibility,
      }));
    } catch {
      // Ignore unavailable storage and malformed saved preferences.
    }
  }, [storageKey, table]);

  return table;
}
