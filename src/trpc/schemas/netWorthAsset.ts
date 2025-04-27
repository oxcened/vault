import * as yup from "yup";
import { safeEvaluate } from "~/utils/number";

export const createNetWorthAssetSchema = yup.object({
  name: yup.string().label("Name").required(),
  categoryId: yup.string().label("Category").required(),
  currency: yup.string().label("Currency").required(),
  initialQuantity: yup
    .string()
    .label("Initial quantity/value")
    .required()
    .test((value) => safeEvaluate(value) != null),
  tickerId: yup.string().label("Stock ticker"),
});

export const createQuantitySchema = yup.object({
  assetId: yup.string().required().label("Asset ID"),
  timestamp: yup.date().label("Date").required(),
  quantity: yup
    .string()
    .label("Initial quantity/value")
    .required()
    .test((value) => safeEvaluate(value) != null),
});

export type CreateQuantity = yup.InferType<typeof createQuantitySchema>;

export const updateQuantitySchema = yup.object({
  assetId: yup.string().required().label("Asset ID"),
  timestamp: yup.date().label("Date").required(),
  quantity: yup
    .string()
    .label("Initial quantity/value")
    .required()
    .test((value) => safeEvaluate(value) != null),
  id: yup.string().required().label("ID"),
});

export type UpdateQuantity = yup.InferType<typeof updateQuantitySchema>;
