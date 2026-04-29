import { describe, expect, it, vi, afterEach } from "vitest";
import { resolveFlashSalePricing } from "../../server/flash-sale-pricing.mjs";

const toLocalDatePart = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toLocalTimePart = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

afterEach(() => {
  vi.useRealTimers();
});

describe("resolveFlashSalePricing", () => {
  it("applies 30% flash sale when within 24 hours and enabled", () => {
    vi.useFakeTimers();
    const now = new Date(2026, 3, 26, 10, 0, 0);
    vi.setSystemTime(now);

    const departure = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    const result = resolveFlashSalePricing({
      baseTotalPrice: 1000,
      bookingDate: toLocalDatePart(departure),
      departureTime: toLocalTimePart(departure),
      flashSaleEnabled: true,
      paymentPlan: "full",
    });

    expect(result.flashSaleEligible).toBe(true);
    expect(result.flashSaleDiscount).toBe(300);
    expect(result.discountedTotal).toBe(700);
    expect(result.amountDueNow).toBe(700);
  });

  it("does not apply flash sale outside the 24-hour window", () => {
    vi.useFakeTimers();
    const now = new Date(2026, 3, 26, 10, 0, 0);
    vi.setSystemTime(now);

    const departure = new Date(now.getTime() + 30 * 60 * 60 * 1000);

    const result = resolveFlashSalePricing({
      baseTotalPrice: 1000,
      bookingDate: toLocalDatePart(departure),
      departureTime: toLocalTimePart(departure),
      flashSaleEnabled: true,
      paymentPlan: "full",
    });

    expect(result.flashSaleEligible).toBe(false);
    expect(result.flashSaleDiscount).toBe(0);
    expect(result.discountedTotal).toBe(1000);
    expect(result.amountDueNow).toBe(1000);
  });

  it("applies deposit against discounted total", () => {
    vi.useFakeTimers();
    const now = new Date(2026, 3, 26, 10, 0, 0);
    vi.setSystemTime(now);

    const departure = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const result = resolveFlashSalePricing({
      baseTotalPrice: 999,
      bookingDate: toLocalDatePart(departure),
      departureTime: toLocalTimePart(departure),
      flashSaleEnabled: true,
      paymentPlan: "deposit",
    });

    expect(result.flashSaleEligible).toBe(true);
    expect(result.flashSaleDiscount).toBe(Math.round(999 * 0.3));
    expect(result.depositAmount).toBe(Math.round(result.discountedTotal * 0.3));
    expect(result.amountDueNow).toBe(result.depositAmount);
  });
});
