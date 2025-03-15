import * as yup from "yup";
import { OTHER_CATEGORY, STOCK_CATEGORY } from "~/constants";
import { safeEvaluate } from "~/utils/number";

export const createNetWorthAssetSchema = yup.object({
  name: yup.string().label("Name").required(),
  category: yup.string().label("Category").required(),
  customCategory: yup
    .string()
    .label("Custom category")
    .when("category", {
      is: OTHER_CATEGORY,
      then: (schema) => schema.required(),
    }),
  currency: yup.string().label("Currency").required(),
  initialQuantity: yup
    .string()
    .label("Initial quantity/value")
    .required()
    .test((value) => safeEvaluate(value) != null),
  tickerId: yup
    .string()
    .label("Stock ticker")
    .when("category", {
      is: STOCK_CATEGORY,
      then: (schema) => schema.required(),
    }),
});
