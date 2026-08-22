import { TransactionCategoryType } from "@prisma/client";
import { z } from "zod";

export const createTransactionCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.nativeEnum(TransactionCategoryType),
});

export const updateTransactionCategorySchema =
  createTransactionCategorySchema.extend({ id: z.string() });
