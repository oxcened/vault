import { evaluate } from "mathjs";
import * as yup from "yup";

export const createNetWorthSchema = yup.object({
  name: yup.string().required(),
  type: yup.string().required(),
  customType: yup.string().when("type", {
    is: "Other",
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
    is: "Stocks",
    then: (schema) => schema.required(),
  }),
});
