import * as yup from "yup";
import { OTHER_CATEGORY } from "~/constants";
import { safeEvaluate } from "~/utils/number";

export const createNetWorthDebtSchema = yup.object({
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
});
