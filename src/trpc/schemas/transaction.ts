import { TransactionType } from "@prisma/client";
import * as yup from "yup";

export const createTransactionSchema = yup.object({
  currency: yup.string().label("Currency").required(),
  amount: yup.number().label("Amount").required(),
  timestamp: yup.date().label("Timestamp").required(),
  description: yup.string().label("Description").required(),
  type: yup
    .string()
    .oneOf(Object.values(TransactionType))
    .label("Type")
    .required(),
  categoryId: yup.string().label("Category ID").required(),
});
