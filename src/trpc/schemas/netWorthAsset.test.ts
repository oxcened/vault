import { describe, expect, it } from "vitest";
import {
  createNetWorthAssetSchema,
  createQuantitySchema,
} from "./netWorthAsset";

const asset = {
  name: "Savings",
  categoryId: "cash",
  currency: "EUR",
  initialQuantity: "1000 + 250",
};
describe("asset validation", () => {
  it("accepts a quantity formula and defaults portfolio flags to false", async () => {
    await expect(
      createNetWorthAssetSchema.validate(asset),
    ).resolves.toMatchObject({
      initialQuantity: "1000 + 250",
      isLiquid: false,
      includeInFire: false,
    });
  });
  it("preserves explicit liquid and FIRE flags", async () => {
    await expect(
      createNetWorthAssetSchema.validate({
        ...asset,
        isLiquid: true,
        includeInFire: true,
      }),
    ).resolves.toMatchObject({ isLiquid: true, includeInFire: true });
  });
  it("rejects invalid formulas and missing asset information", async () => {
    await expect(
      createNetWorthAssetSchema.validate({
        ...asset,
        initialQuantity: "not valid +",
      }),
    ).rejects.toThrow();
    await expect(
      createNetWorthAssetSchema.validate({ ...asset, currency: "" }),
    ).rejects.toThrow();
  });
  it("requires a valid month and quantity when recording a holding", async () => {
    await expect(
      createQuantitySchema.validate({
        assetId: "asset",
        timestamp: new Date("2026-01-01T00:00:00Z"),
        quantity: "3 * 5",
      }),
    ).resolves.toMatchObject({ quantity: "3 * 5" });
    await expect(
      createQuantitySchema.validate({
        assetId: "asset",
        timestamp: "invalid",
        quantity: "1",
      }),
    ).rejects.toThrow();
    await expect(
      createQuantitySchema.validate({
        assetId: "asset",
        timestamp: new Date(),
        quantity: "(",
      }),
    ).rejects.toThrow();
  });
});
