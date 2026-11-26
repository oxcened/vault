import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const getAssets = vi.hoisted(() => vi.fn());
vi.mock("~/server/utils/db", () => ({ getAssetValuesForUserMonth: getAssets }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
import { envelopeRouter } from "./envelope";

describe("reserve pool", () => {
  it("sums active liquid assets and subtracts allocated reserves", async () => {
    getAssets.mockResolvedValue([
      {
        assetId: "cash",
        assetName: "Cash",
        isLiquid: true,
        assetArchivedAt: null,
        valueInTarget: new Prisma.Decimal("1000.50"),
      },
      {
        assetId: "account",
        assetName: "Account",
        isLiquid: true,
        assetArchivedAt: null,
        valueInTarget: new Prisma.Decimal("250"),
      },
      {
        assetId: "house",
        assetName: "House",
        isLiquid: false,
        assetArchivedAt: null,
        valueInTarget: new Prisma.Decimal("50000"),
      },
      {
        assetId: "old",
        assetName: "Old",
        isLiquid: true,
        assetArchivedAt: new Date(),
        valueInTarget: new Prisma.Decimal("900"),
      },
    ]);
    const findMany = vi
      .fn()
      .mockResolvedValue([
        { amount: new Prisma.Decimal("300.25") },
        { amount: new Prisma.Decimal("100") },
      ]);
    const ctx = {
      db: { envelope: { findMany } },
      session: { user: { id: "user-1" }, expires: "2099-01-01" },
      headers: new Headers(),
    } as unknown as Parameters<typeof envelopeRouter.createCaller>[0];
    const result = await envelopeRouter.createCaller(ctx).getAll();
    expect(result.pool.toString()).toBe("1250.5");
    expect(result.remaining.toString()).toBe("850.25");
    expect(result.accounts.map((account) => account.id)).toEqual([
      "cash",
      "account",
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { createdById: "user-1" } }),
    );
  });
  it("rejects unauthenticated requests", async () => {
    const ctx = {
      db: {},
      session: null,
      headers: new Headers(),
    } as unknown as Parameters<typeof envelopeRouter.createCaller>[0];
    await expect(
      envelopeRouter.createCaller(ctx).getAll(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
