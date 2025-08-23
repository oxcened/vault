/* eslint-disable react-hooks/rules-of-hooks */

import { createColumnHelper } from "@tanstack/react-table";
import { RoundedCurrency } from "~/components/ui/number";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import {
  CheckCircle2Icon,
  MoreHorizontalIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Badge, BadgeProps } from "~/components/ui/badge";
import { api, RouterOutputs } from "~/trpc/react";
import { toast } from "sonner";
import { useState } from "react";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import EditEnvelopeDialog from "./EditEnvelopeDialog";
import { DragHandle } from "~/components/drag-handle";

type EnvelopeRow = RouterOutputs["envelope"]["getAll"]["envelopes"][number];

const columnHelper = createColumnHelper<EnvelopeRow>();

export const envelopeColumns = [
  columnHelper.display({
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.id} />,
  }),
  columnHelper.accessor("priority", {
    header: "#",
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("isFull", {
    header: "Status",
    cell: ({ getValue, row }) => {
      const valueMap: Record<
        number,
        {
          label: React.ReactNode;
          variant: BadgeProps["variant"];
          icon: React.ReactNode;
        }
      > = {
        0: {
          icon: <TriangleAlertIcon className="size-4" />,
          label: (
            <span>
              Needs <RoundedCurrency value={row.original.shortfall} />
            </span>
          ),
          variant: "destructive",
        },
        1: {
          icon: <CheckCircle2Icon className="size-4" />,
          label: "Fully funded",
          variant: "default",
        },
      };

      const mappedValue = valueMap[Number(getValue())];
      if (!mappedValue) return null;

      return (
        <Badge className="gap-1" variant={mappedValue.variant}>
          {mappedValue.icon} {mappedValue.label}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("target", {
    header: "Target",
    cell: ({ getValue }) => <RoundedCurrency value={getValue()} />,
  }),
  columnHelper.accessor("funded", {
    header: "Funded",
    cell: ({ getValue }) => <RoundedCurrency value={getValue()} />,
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const utils = api.useUtils();

      const { mutate: deleteEnvelope } = api.envelope.delete.useMutation({
        onSuccess: () => {
          toast.success("Envelope deleted.");
          void utils.envelope.getAll.invalidate();
        },
      });

      const [editingEnvelope, setEditingEnvelope] = useState<EnvelopeRow>();
      const [isEditDialogOpen, setEditDialogOpen] = useState(false);

      const { confirm, modal } = useConfirmDelete();

      function handleEditClick() {
        setEditingEnvelope(row.original);
        setEditDialogOpen(true);
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleEditClick}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onClick={() =>
                confirm({
                  itemType: "envelope",
                  itemName: row.original.name,
                  onConfirm: () => deleteEnvelope({ id: row.original.id }),
                })
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
          {modal}

          <EditEnvelopeDialog
            key={`edit-envelope-dialog-${isEditDialogOpen}`}
            isOpen={isEditDialogOpen}
            envelope={editingEnvelope}
            onOpenChange={setEditDialogOpen}
            onSuccess={() => void utils.envelope.getAll.invalidate()}
          />
        </DropdownMenu>
      );
    },
  }),
];
