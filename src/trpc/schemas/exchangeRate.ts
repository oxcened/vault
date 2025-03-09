import * as yup from "yup";

export const createExchangeRateSchema = yup.object({
  baseCurrency: yup.string().label("Base currency").required().length(3),
  quoteCurrency: yup.string().label("Quote currency").required().length(3),
  rate: yup.number().label("Rate").required(),
  timestamp: yup.date().label("Date").required(),
});

export type CreateExchangeRate = yup.InferType<typeof createExchangeRateSchema>;

export const updateExchangeRateSchema = createExchangeRateSchema.concat(
  yup.object({
    id: yup.string().required(),
  }),
);

export type UpdateExchangeRate = yup.InferType<typeof updateExchangeRateSchema>;
