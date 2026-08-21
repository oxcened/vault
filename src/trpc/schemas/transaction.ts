import { TransactionStatus, TransactionType } from "@prisma/client";
import * as yup from "yup";
import { getCurrencyFractionDigits, getDecimalPlaces } from "~/utils/currency";

const normalizeDescription = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value;

export const createTransactionSchema = yup.object({
  currency: yup.string().trim().uppercase().label("Currency").required(),
  amount: yup
    .number()
    .label("Amount")
    .required()
    .test("currency-precision", function (value) {
      const parent = this.parent as { currency?: unknown };
      const currency =
        typeof parent.currency === "string" ? parent.currency : "";
      const maximumFractionDigits = getCurrencyFractionDigits(currency);

      if (getDecimalPlaces(value) <= maximumFractionDigits) return true;

      return this.createError({
        message: `${currency.toUpperCase()} amounts support at most ${maximumFractionDigits} decimal places`,
      });
    }),
  timestamp: yup.date().label("Timestamp").required(),
  description: yup
    .string()
    .transform(normalizeDescription)
    .label("Description")
    .required(),
  type: yup
    .string()
    .oneOf(Object.values(TransactionType))
    .label("Type")
    .required(),
  categoryId: yup.string().label("Category").required(),
  status: yup
    .string()
    .oneOf(Object.values(TransactionStatus))
    .label("Status")
    .required(),
});

export type CreateTransaction = yup.InferType<typeof createTransactionSchema>;

export const updateTransactionSchema = yup.object({
  id: yup.string().required(),
  currency: yup.string().trim().uppercase().label("Currency"),
  amount: yup
    .number()
    .label("Amount")
    .test("currency-precision", function (value) {
      if (value === undefined) return true;

      const parent = this.parent as { currency?: unknown };
      const currency =
        typeof parent.currency === "string" ? parent.currency : "";
      const maximumFractionDigits = getCurrencyFractionDigits(currency);

      if (getDecimalPlaces(value) <= maximumFractionDigits) return true;

      return this.createError({
        message: `${currency.toUpperCase()} amounts support at most ${maximumFractionDigits} decimal places`,
      });
    }),
  timestamp: yup.date().label("Timestamp"),
  description: yup
    .string()
    .transform(normalizeDescription)
    .label("Description"),
  type: yup.string().oneOf(Object.values(TransactionType)).label("Type"),
  categoryId: yup.string().label("Category"),
});

export type UpdateTransaction = yup.InferType<typeof updateTransactionSchema>;
