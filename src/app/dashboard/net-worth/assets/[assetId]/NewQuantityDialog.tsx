"use client";

import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import QuantityForm, { QuantityFormRef } from "./QuantityForm";

export type NewQuantityDialogProps = {
  isOpen: boolean;
  onOpenChange: (newOpen: boolean) => void;
  onSuccess: () => void;
};

export default function NewQuantityDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: NewQuantityDialogProps) {
  const [createMore, setCreateMore] = useState(false);
  const formRef = useRef<QuantityFormRef>(null);
  const { mutate, isPending } = api.netWorthAsset.createQuantity.useMutation({
    onSuccess: () => {
      toast.success("Quantity created.");
      if (createMore) {
        formRef.current?.reset();
      } else {
        onOpenChange(false);
      }
      onSuccess();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add quantity</DialogTitle>
        </DialogHeader>
        <QuantityForm
          ref={formRef}
          formId="new-quantity-dialog-form"
          onSubmit={(data) => mutate(data)}
        />
        <DialogFooter className="gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="create-more"
              onCheckedChange={(checked) => setCreateMore(checked)}
            />
            <Label htmlFor="create-more">Create more</Label>
          </div>
          <Button
            type="submit"
            disabled={isPending}
            form="new-quantity-dialog-form"
          >
            {isPending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
