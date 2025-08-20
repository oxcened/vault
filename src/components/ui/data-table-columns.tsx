"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { type Column, type Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import { Button, ButtonProps } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { STORAGE_KEY_HIDDEN_COLUMNS } from "~/constants";

export function DataTableColumns<TData>({
  table,
  ...props
}: {
  table: Table<TData>;
} & ButtonProps) {
  const tableMeta = table.options.meta;
  const tableId =
    tableMeta && "id" in tableMeta && typeof tableMeta.id === "string"
      ? tableMeta.id
      : undefined;
  const storageKey = tableId
    ? `${STORAGE_KEY_HIDDEN_COLUMNS}${tableId}`
    : undefined;

  const handleCheckedChange = ({
    value,
    column,
  }: {
    value: boolean;
    column: Column<TData>;
  }) => {
    column.toggleVisibility(value);

    if (!storageKey) return;

    const storageObject = JSON.parse(
      localStorage.getItem(storageKey) ?? "{}",
    ) as Record<string, boolean>;

    storageObject[column.id] = value;

    localStorage.setItem(storageKey, JSON.stringify(storageObject));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button {...props} variant={props.variant ?? "outline"}>
          <Settings2 />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) =>
                  handleCheckedChange({ value, column })
                }
              >
                {typeof column.columnDef.header == "string"
                  ? column.columnDef.header
                  : column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
