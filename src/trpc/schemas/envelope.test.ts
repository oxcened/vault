import { describe, expect, it } from "vitest";
import { createEnvelopeSchema, updateEnvelopeSchema } from "./envelope";

const reserve = { name: "Emergency", amount: 100, priority: 1 };
describe("reserve validation", () => {
  it("accepts an optional target and supplies a default icon", async () => {
    const result = await createEnvelopeSchema.validate({
      ...reserve,
      target: "",
    });
    expect(result.target).toBeNull();
    expect(result.icon).toBeTruthy();
  });
  it("rejects negative balances and targets", async () => {
    await expect(
      createEnvelopeSchema.validate({ ...reserve, amount: -1 }),
    ).rejects.toThrow();
    await expect(
      createEnvelopeSchema.validate({ ...reserve, target: -1 }),
    ).rejects.toThrow();
  });
  it("requires a name, amount and update id", async () => {
    await expect(
      createEnvelopeSchema.validate({ ...reserve, name: "" }),
    ).rejects.toThrow();
    await expect(
      createEnvelopeSchema.validate({ ...reserve, amount: undefined }),
    ).rejects.toThrow();
    await expect(updateEnvelopeSchema.validate(reserve)).rejects.toThrow();
  });
});
