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
import { ComponentProps } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function DataTable<TData>({
  table,
  className,
  isDraggable = false,
}: {
  table: TableType<TData>;
  className?: string;
  isDraggable?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden whitespace-nowrap rounded-md border",
        className,
      )}
    >
      <Table className={cn(isDraggable && "overflow-hidden")}>
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
              <CustomTableRow
                key={row.id}
                id={row.id}
                data-state={row.getIsSelected() && "selected"}
                isDraggable={isDraggable}
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
              </CustomTableRow>
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

function CustomTableRow({
  isDraggable = false,
  ...props
}: ComponentProps<typeof TableRow> & { isDraggable?: boolean; id: string }) {
  if (isDraggable) {
    return <DraggableRow {...props} id={props.id} />;
  }

  return <TableRow {...props} />;
}

function DraggableRow<T>({
  ...props
}: ComponentProps<typeof TableRow> & { id: string }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: props.id,
  });

  return (
    <TableRow
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      {...props}
    />
  );
}
