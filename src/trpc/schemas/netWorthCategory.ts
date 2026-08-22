import { NetWorthCategoryType } from "@prisma/client";
import { z } from "zod";

export const createNetWorthCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.nativeEnum(NetWorthCategoryType),
  isStock: z.boolean(),
});

export const updateNetWorthCategorySchema = createNetWorthCategorySchema.extend(
  { id: z.string() },
);
