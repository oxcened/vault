import * as yup from "yup";

export const createStockTickerSchema = yup.object({
  name: yup.string().label("Name").required(),
  ticker: yup.string().label("Ticker").required(),
  exchange: yup.string().label("Exchange").required(),
});

export type CreateStockTicker = yup.InferType<typeof createStockTickerSchema>;

export const updateStockTickerSchema = createStockTickerSchema.concat(
  yup.object({
    id: yup.string().required(),
  }),
);

export type UpdateStockTicker = yup.InferType<typeof updateStockTickerSchema>;
