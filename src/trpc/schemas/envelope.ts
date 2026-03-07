import * as yup from "yup";

export const createEnvelopeSchema = yup.object({
  name: yup.string().label("Name").required(),
  target: yup.number().label("Target").optional(),
  amount: yup.number().label("Amount").required(),
  priority: yup.number().label("Priority").required(),
});

export type CreateEnvelope = yup.InferType<typeof createEnvelopeSchema>;

export const updateEnvelopeSchema = createEnvelopeSchema.concat(
  yup.object({
    id: yup.string().required(),
  }),
);

export type UpdateEnvelope = yup.InferType<typeof updateEnvelopeSchema>;
