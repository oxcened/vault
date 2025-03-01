import { evaluate } from "mathjs";
import * as yup from "yup";
import { OTHER_TYPE, STOCK_TYPE } from "~/constants";

export const createNetWorthAssetSchema = yup.object({
  name: yup.string().label("Name").required(),
  type: yup.string().label("Type").required(),
  customType: yup
    .string()
    .label("Custom type")
    .when("type", {
      is: OTHER_TYPE,
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
    .when("type", {
      is: STOCK_TYPE,
      then: (schema) => schema.required(),
    }),
});
