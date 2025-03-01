import { evaluate } from "mathjs";
import * as yup from "yup";
import { OTHER_CATEGORY, STOCK_CATEGORY } from "~/constants";

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
  initialQuantity: yup.number().label("Initial quantity").required(),
  quantityFormula: yup
    .string()
    .label("Quantity formula")
    .test((value) => {
      if (!value) return true;

      try {
        evaluate(value);
        return true;
      } catch (e) {
        return false;
      }
    }),
  tickerId: yup
    .string()
    .label("Ticker ID")
    .when("category", {
      is: STOCK_CATEGORY,
      then: (schema) => schema.required(),
    }),
});
