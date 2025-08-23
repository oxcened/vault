"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EnvelopeForm } from "./EnvelopeForm";

export default function NewEnvelopeDialog({
  isOpen,
  onSuccess,
  onOpenChange,
}: {
  isOpen: boolean;
  onSuccess: () => void;
  onOpenChange: (newOpen: boolean) => void;
}) {
  const { mutate, isPending } = api.envelope.create.useMutation({
    onSuccess: () => {
      toast.success("Envelope created.");
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add envelope</DialogTitle>
        </DialogHeader>
        <EnvelopeForm formId="new-envelope-dialog-form" onSubmit={mutate} />
        <DialogFooter>
          <Button
            type="submit"
            disabled={isPending}
            form="new-envelope-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
