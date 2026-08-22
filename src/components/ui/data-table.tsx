"use client";

import {
  flexRender,
  Header,
  type Table as TableType,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  onRowClick,
}: {
  table: TableType<TData>;
  className?: string;
  isDraggable?: boolean;
  onRowClick?: (data: TData) => void;
}) {
  const hasFooter = table
    .getAllLeafColumns()
    .some((column) => column.columnDef.footer !== undefined);

  return (
    <div
      className={cn(
        "overflow-hidden whitespace-nowrap rounded-xl border bg-card shadow-sm",
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
                className={cn(onRowClick && "cursor-pointer")}
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick ? "View details" : undefined}
                onClick={(event) => {
                  if (!onRowClick || isInteractiveTarget(event.target)) return;
                  onRowClick(row.original);
                }}
                onKeyDown={(event) => {
                  if (
                    onRowClick &&
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    onRowClick(row.original);
                  }
                }}
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
                className="h-40 text-center"
              >
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Inbox className="size-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    No results
                  </span>
                  <span className="mt-1 text-xs">
                    There is no data to display yet.
                  </span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        {hasFooter && (
          <TableFooter>
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id}>
                {footerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        meta &&
                          "footerClassName" in meta &&
                          typeof meta.footerClassName === "string" &&
                          meta.footerClassName,
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.footer,
                        header.getContext(),
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    !!target.closest(
      "a, button, input, select, textarea, [role=button], [role=menuitem]",
    )
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
      <Button
        variant="ghost"
        className="-ml-3 h-8 gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
        onClick={header.column.getToggleSortingHandler()}
      >
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
