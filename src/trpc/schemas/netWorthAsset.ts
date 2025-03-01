import { evaluate } from "mathjs";
import * as yup from "yup";
import { OTHER_TYPE, STOCK_TYPE } from "~/constants";

export const createNetWorthAssetSchema = yup.object({
  name: yup.string().required(),
  type: yup.string().required(),
  customType: yup.string().when("type", {
    is: OTHER_TYPE,
    then: (schema) => schema.required(),
  }),
  currency: yup.string().required(),
  initialQuantity: yup.number().required(),
  quantityFormula: yup.string().test((value) => {
    if (value === undefined) return true;
    try {
      evaluate(value);
      return true;
    } catch (e) {
      return false;
    }
  }),
  tickerId: yup.string().when("type", {
    is: STOCK_TYPE,
    then: (schema) => schema.required(),
  }),
});
