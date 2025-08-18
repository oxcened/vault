"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { type Column, type Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";

export function DataTableColumns<TData>({
  table,
  className,
}: {
  table: Table<TData>;
  className?: string;
}) {
  const tableMeta = table.options.meta;
  const tableId =
    tableMeta && "id" in tableMeta && typeof tableMeta.id === "string"
      ? tableMeta.id
      : undefined;
  const storageKey = tableId ? `vaultHiddenColumns_${tableId}` : undefined;

  useEffect(() => {
    if (!storageKey) return;
    const saved = JSON.parse(
      localStorage.getItem(storageKey) ?? "[]",
    ) as string[];
    saved.forEach((id: string) => {
      const col = table.getColumn(id);
      col?.toggleVisibility(false);
    });
  }, []);

  const handleCheckedChange = ({
    value,
    column,
  }: {
    value: boolean;
    column: Column<TData>;
  }) => {
    column.toggleVisibility(!!value);

    if (!storageKey) return;

    const current = JSON.parse(
      localStorage.getItem(storageKey) ?? "[]",
    ) as string[];
    let next: string[];

    if (!value) {
      next = Array.from(new Set([...current, column.id]));
    } else {
      next = current.filter((id: string) => id !== column.id);
    }

    if (next.length) {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } else {
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
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
