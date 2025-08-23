"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Envelope } from "@prisma/client";
import { EnvelopeForm } from "./EnvelopeForm";
import { CreateEnvelope } from "~/trpc/schemas/envelope";

export type EditEnvelopeDialogProps = {
  envelope?: Envelope;
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function EditEnvelopeDialog({
  envelope,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditEnvelopeDialogProps) {
  const { mutate, isPending } = api.envelope.update.useMutation({
    onSuccess: () => {
      toast.success("Envelope updated.");
      onSuccess();
      onOpenChange(false);
    },
  });

  const initialData: CreateEnvelope | undefined = envelope
    ? {
        ...envelope,
        target: envelope.target.toNumber(),
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit envelope</DialogTitle>
        </DialogHeader>
        <EnvelopeForm
          formId="edit-envelope-dialog-form"
          initialData={initialData}
          onSubmit={(data) =>
            envelope?.id && mutate({ ...data, id: envelope.id })
          }
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending}
            form="edit-envelope-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
