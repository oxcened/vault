import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ChevronDown, PlusIcon, ZapIcon } from "lucide-react";
import { Button } from "./ui/button";
import NewTransactionDialog from "~/app/dashboard/cash-flow/transactions/NewTransactionDialog";
import { useState } from "react";
import TransactionTemplateDialog from "~/app/dashboard/cash-flow/transactions/TransactionTemplateDialog";

export function AddTransactionDropdown({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [isNewDialogOpen, setNewDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default">
            <span className="sr-only">Open menu</span>
            <PlusIcon />
            Add
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setNewDialogOpen(true)}>
            Add transaction...
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setTemplateDialogOpen(true)}>
            <ZapIcon />
            Quick add...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NewTransactionDialog
        key={`new-transaction-dialog-${isNewDialogOpen}`}
        isOpen={isNewDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={onSuccess}
      />

      <TransactionTemplateDialog
        key={`transaction-template-dialog-${isTemplateDialogOpen}`}
        isOpen={isTemplateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
