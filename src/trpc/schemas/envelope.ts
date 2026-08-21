import * as yup from "yup";
import {
  DEFAULT_RESERVE_ICON,
  RESERVE_ICON_NAMES,
} from "~/constants/reserve-icons";

export const createEnvelopeSchema = yup.object({
  name: yup.string().label("Name").required(),
  icon: yup
    .string()
    .oneOf([...RESERVE_ICON_NAMES])
    .default(DEFAULT_RESERVE_ICON)
    .required(),
  target: yup
    .number()
    .label("Target")
    .min(0)
    .optional()
    .nullable()
    .transform((value) => (isNaN(value) ? null : value)),
  amount: yup.number().label("Reserved amount").min(0).required(),
  priority: yup.number().label("Priority").required(),
});

export type CreateEnvelope = yup.InferType<typeof createEnvelopeSchema>;

export const updateEnvelopeSchema = createEnvelopeSchema.concat(
  yup.object({
    id: yup.string().required(),
  }),
);

export type UpdateEnvelope = yup.InferType<typeof updateEnvelopeSchema>;
