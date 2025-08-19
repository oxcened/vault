import { useReactTable, TableOptions } from "@tanstack/react-table";
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

  function getStorageColumnVisibility() {
    if (!storageKey) return {};
    return JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<
      string,
      boolean
    >;
  }

  return useReactTable({
    initialState: {
      columnVisibility: {
        ...columnVisibility,
        ...getStorageColumnVisibility(),
      },
      ...initialStateRest,
    },
    enableSorting: false,
    ...options,
  });
}
