import * as yup from "yup";

export const createStockPriceSchema = yup.object({
  tickerId: yup.string().label("Stock ticker").required(),
  price: yup.number().label("Price").required(),
  timestamp: yup.date().label("Date").required(),
});

export type CreateStockPrice = yup.InferType<typeof createStockPriceSchema>;

export const updateStockPriceSchema = createStockPriceSchema.concat(
  yup.object({
    id: yup.string().required(),
  }),
);

export type UpdateStockPrice = yup.InferType<typeof updateStockPriceSchema>;
