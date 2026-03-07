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
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleArrowUpIcon,
  CircleDashedIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { Badge, BadgeProps } from "~/components/ui/badge";
import { api, RouterOutputs } from "~/trpc/react";
import { toast } from "sonner";
import { useState } from "react";
import { useConfirmDelete } from "~/components/confirm-delete-modal";
import EditEnvelopeDialog from "./EditEnvelopeDialog";
import { DragHandle } from "~/components/drag-handle";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";
import Decimal from "decimal.js";

type EnvelopeRow = RouterOutputs["envelope"]["getAll"]["envelopes"][number];

const columnHelper = createColumnHelper<EnvelopeRow>();

export const envelopeColumns = [
  columnHelper.display({
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.id} />,
  }),
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.display({
    header: "Status",
    cell: ({ row }) => {
      const getConfig = (): {
        label: React.ReactNode;
        variant: BadgeProps["variant"];
        icon?: React.ReactNode;
      } => {
        const { amount, target } = row.original;

        if (!target) {
          return {
            variant: "secondary",
            icon: <CircleDashedIcon className="size-4" />,
            label: "Flexible",
          };
        } else if (amount.greaterThan(target)) {
          return {
            variant: "secondary",
            icon: <CircleArrowUpIcon className="size-4" />,
            label: (
              <>
                Overfunded by <RoundedCurrency value={amount.minus(target)} />
              </>
            ),
          };
        } else if (amount.eq(target)) {
          return {
            variant: "secondary",
            icon: <CheckCircle2Icon className="size-4" />,
            label: "Funded",
          };
        } else {
          return {
            variant: "secondary",
            icon: <AlertTriangleIcon className="size-4" />,
            label: (
              <>
                Underfunded by <RoundedCurrency value={target.minus(amount)} />
              </>
            ),
          };
        }
      };

      const mappedValue = getConfig();

      return (
        <Badge className="gap-1" variant={mappedValue.variant}>
          {mappedValue.icon}
          {mappedValue.label}
        </Badge>
      );
    },
  }),
  columnHelper.display({
    header: "Amount",
    cell: ({ row }) => {
      const { amount, target } = row.original;
      const progressValue = target
        ? amount.div(target).mul(100)
        : new Decimal(0);

      return (
        <div className="flex flex-col gap-2">
          <div>
            <RoundedCurrency value={amount} /> /{" "}
            <span className="text-muted-foreground">
              {target ? <RoundedCurrency value={target} /> : "∞"}
            </span>
          </div>

          <Progress
            value={progressValue.toNumber()}
            className={cn(
              "max-w-[300px]",
              !target && "bg-stripes text-neutral-500",
            )}
            indicatorClassName={cn(
              progressValue.eq(100) && "bg-financial-positive",
              progressValue.greaterThan(100) && "bg-purple-500",
              progressValue.lessThan(100) && "bg-yellow-500",
            )}
          />
        </div>
      );
    },
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
