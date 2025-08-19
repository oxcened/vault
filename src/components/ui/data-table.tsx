"use client";

import {
  flexRender,
  Header,
  type Table as TableType,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import { Button } from "./button";

export function DataTable<TData>({
  table,
  className,
}: {
  table: TableType<TData>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden whitespace-nowrap rounded-md border",
        className,
      )}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta;
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      meta &&
                        "headerClassName" in meta &&
                        typeof meta.headerClassName === "string" &&
                        meta.headerClassName,
                    )}
                  >
                    <CustomTableHead header={header} />
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        meta &&
                          "cellClassName" in meta &&
                          typeof meta.cellClassName === "string" &&
                          meta.cellClassName,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CustomTableHead<TData, TValue>({
  header,
}: {
  header: Header<TData, TValue>;
}) {
  const content = flexRender(
    header.column.columnDef.header,
    header.getContext(),
  );

  if (header.isPlaceholder) {
    return null;
  }

  if (header.column.getCanSort()) {
    return (
      <Button variant="ghost" onClick={header.column.getToggleSortingHandler()}>
        {content}

        {{
          asc: <ArrowUpIcon />,
          desc: <ArrowDownIcon />,
        }[header.column.getIsSorted() as string] ?? null}
      </Button>
    );
  }

  return content;
}
