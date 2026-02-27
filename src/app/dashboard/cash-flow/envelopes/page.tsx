"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import Decimal from "decimal.js";
import { DataTable } from "~/components/ui/data-table";
import { getCoreRowModel } from "@tanstack/react-table";
import { useTable } from "~/hooks/useTable";
import { envelopeColumns } from "./config";
import { RoundedCurrency } from "~/components/ui/number";
import { api } from "~/trpc/react";
import { TableSkeleton } from "~/components/table-skeleton";
import { DataTableColumns } from "~/components/ui/data-table-columns";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import NewEnvelopeDialog from "./NewEnvelopeDialog";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

export type Envelope = {
  id: string;
  name: string;
  target: Decimal;
  allocated: Decimal;
  shortfall: Decimal;
  isFull: boolean;
};

export default function EnvelopesPage() {
  const { data, isPending, refetch } = api.envelope.getAll.useQuery();
  const { mutateAsync: reorder } = api.envelope.reorder.useMutation();

  const [envelopes, setEnvelopes] = useState(data?.envelopes ?? []);

  useEffect(() => {
    setEnvelopes(data?.envelopes ?? []);
  }, [data?.envelopes]);

  const table = useTable({
    data: envelopes,
    columns: envelopeColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      id: "envelopes",
    },
    getRowId: (originalRow) => originalRow.id,
  });

  const [isNewDialogOpen, setNewDialogOpen] = useState(false);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex = dataIds.indexOf(active.id);
    const newIndex = dataIds.indexOf(over.id);
    const orderedArray = arrayMove(data?.envelopes ?? [], oldIndex, newIndex);
    const oldEnvelopes = envelopes;
    setEnvelopes(orderedArray);

    try {
      await reorder({
        orderedIds: orderedArray.map((item) => item.id),
      });
      void refetch();
    } catch (e) {
      console.error("Failed to reorder envelopes", e);
      setEnvelopes(oldEnvelopes);
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const dataIds = useMemo<UniqueIdentifier[]>(
    () => data?.envelopes?.map(({ id }) => id) ?? [],
    [data?.envelopes],
  );

  const sortableId = useId();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/cash-flow">
                Cash flow
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Envelopes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="mx-auto flex w-screen max-w-screen-lg flex-col gap-5 p-5">
        <div className="flex gap-2">
          <div className="mr-auto">
            <p className="text-sm text-muted-foreground">Envelopes pool</p>
            <RoundedCurrency
              value={data?.pool}
              className="text-sx font-medium"
            />
          </div>

          <DataTableColumns table={table} />
          <Button variant="default" onClick={() => setNewDialogOpen(true)}>
            <PlusIcon />
            Add
          </Button>
        </div>

        {isPending ? (
          <TableSkeleton />
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <SortableContext
              items={dataIds}
              strategy={verticalListSortingStrategy}
            >
              <DataTable table={table} isDraggable />
            </SortableContext>
          </DndContext>
        )}
      </div>

      <NewEnvelopeDialog
        key={`new-envelope-dialog-${isNewDialogOpen}`}
        isOpen={isNewDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={refetch}
      />
    </>
  );
}
