import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { formatDate } from "~/utils/date";
import { Currency } from "./ui/number";
import {
  ArrowRight,
  MoreHorizontal,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { Button, buttonVariants } from "./ui/button";
import Link from "next/link";
import { type Prisma, type TransactionType } from "@prisma/client";

export type TransactionRow = {
  id: string;
  timestamp: Date;
  amount: Prisma.Decimal;
  type: TransactionType;
  category: {
    name: string;
  };
  description: string;
  currency: string;
};

export type TransactionTableProps = {
  data: TransactionRow[];
  showSeeAllLink?: boolean;
  showActions?: boolean;
  onEditTransaction?: (id: string) => void;
  onDeleteTransaction?: (transaction: TransactionRow) => void;
};

export function TransactionTable({
  data,
  showSeeAllLink,
  showActions,
  onDeleteTransaction,
  onEditTransaction,
}: TransactionTableProps) {
  if (!data.length) {
    return (
      <div className="rounded-xl bg-muted p-10 text-center text-muted-foreground">
        You don&apos;t have any transactions yet
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Recent transactions</TableHead>
          <TableHead></TableHead>

          {showSeeAllLink ? (
            <TableHead className="text-right">
              <Link
                href="/dashboard/transactions"
                className={cn(
                  buttonVariants({
                    variant: "link",
                  }),
                  "p-0",
                )}
              >
                See all
                <ArrowRight className="size-4" />
              </Link>
            </TableHead>
          ) : (
            <TableHead />
          )}
          {showActions && <TableHead className="w-8" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((transaction) => {
          const isExpense = transaction.type === "EXPENSE";
          const amount = transaction.amount.mul(isExpense ? -1 : 1);

          return (
            <TableRow key={transaction.id}>
              <TableCell className="flex flex-col">
                <p>{transaction.description}</p>
                <p
                  suppressHydrationWarning
                  className="text-xs text-muted-foreground"
                >
                  {formatDate({ date: transaction.timestamp })}
                </p>
              </TableCell>
              <TableCell>
                <p className="rounded-lg bg-muted px-1 py-0.5 text-center text-muted-foreground">
                  {transaction.category.name}
                </p>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right",
                  amount.isPos() && "text-financial-positive",
                  amount.isNeg() && "text-financial-negative",
                )}
              >
                <Currency
                  value={amount}
                  options={{
                    currency: transaction.currency,
                  }}
                />
              </TableCell>
              {showActions && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onEditTransaction?.(transaction.id)}
                      >
                        <PencilIcon />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteTransaction?.(transaction)}
                      >
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
