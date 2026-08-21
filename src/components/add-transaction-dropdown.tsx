import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { CalendarClock, ChevronDown, PlusIcon, ZapIcon } from "lucide-react";
import { Button } from "./ui/button";
import NewTransactionDialog from "~/app/dashboard/cash-flow/transactions/NewTransactionDialog";
import { useEffect, useState } from "react";
import TransactionTemplateDialog from "~/app/dashboard/cash-flow/transactions/TransactionTemplateDialog";
import { RecurringTransactionDialog } from "~/app/dashboard/cash-flow/transactions/RecurringTransactionDialog";

export function AddTransactionDropdown({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [isNewDialogOpen, setNewDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase() !== "q" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.repeat
      )
        return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.matches("input, textarea, select") || target.isContentEditable)
      )
        return;

      event.preventDefault();
      setTemplateDialogOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
            <DropdownMenuShortcut>Q</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setScheduleDialogOpen(true)}>
            <CalendarClock />
            Add schedule...
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

      <RecurringTransactionDialog
        key={`recurring-transaction-dialog-${isScheduleDialogOpen}`}
        isOpen={isScheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}
