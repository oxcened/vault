import { RecurrenceFrequency, TransactionType } from "@prisma/client";
import * as yup from "yup";
import { getCurrencyFractionDigits, getDecimalPlaces } from "~/utils/currency";

const normalizeDescription = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value;

export const recurringTransactionSchema = yup.object({
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
  nextDate: yup.date().label("Next date").required(),
  frequency: yup
    .string()
    .oneOf(Object.values(RecurrenceFrequency))
    .label("Frequency")
    .required(),
  interval: yup.number().integer().min(1).max(99).label("Interval").required(),
});

export type RecurringTransactionInput = yup.InferType<
  typeof recurringTransactionSchema
>;

export const updateRecurringTransactionSchema =
  recurringTransactionSchema.concat(
    yup.object({ id: yup.string().required() }),
  );
