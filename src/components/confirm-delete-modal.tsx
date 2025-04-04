import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "~/components/ui/alert-dialog";
import { useState } from "react";
import { buttonVariants } from "./ui/button";

type UseConfirmDeleteProps = {
  itemType: string;
  itemName?: string;
  onConfirm: () => void;
};

export function useConfirmDelete() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<UseConfirmDeleteProps>();

  function confirm(props: UseConfirmDeleteProps) {
    setConfig(props);
    setOpen(true);
  }

  const modal = config ? (
    <ConfirmDeleteModal
      open={open}
      onOpenChange={setOpen}
      itemType={config.itemType}
      itemName={config.itemName}
      onConfirm={() => {
        config.onConfirm();
        setOpen(false);
      }}
    />
  ) : null;

  return { confirm, modal };
}

type ConfirmDeleteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: string;
  itemName?: string;
  onConfirm: () => void;
};

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  onOpenChange,
  itemType,
  itemName,
  onConfirm,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {itemName ? `"${itemName}"` : `this ${itemType}`}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This {itemType} will be permanently removed. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={buttonVariants({
              variant: "destructive",
            })}
          >
            Delete {itemType}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDeleteModal;
