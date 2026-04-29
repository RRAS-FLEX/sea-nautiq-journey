export interface BoatVoucherPricingInput {
  baseTotalPrice: number;
  bookingDate: string;
  departureTime: string;
  flashSaleEnabled: boolean;
  paymentPlan: "deposit" | "full";
}

export interface BoatVoucherPricingResult {
  subtotalAfterVoucher: number;
  flashSaleEligible: boolean;
  flashSaleDiscount: number;
  discountedTotal: number;
  depositAmount: number;
  amountDueNow: number;
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const FLASH_SALE_WINDOW_MS = 24 * 60 * 60 * 1000;
const FLASH_SALE_DISCOUNT_RATE = 0.3;

const isValidTime = (value: string | null | undefined): boolean => TIME_REGEX.test(String(value ?? ""));

const buildDepartureDateTime = (bookingDate: string, departureTime: string): Date | null => {
  if (!bookingDate || !isValidTime(departureTime)) {
    return null;
  }

  const departureDateTime = new Date(`${bookingDate}T${departureTime}:00`);
  return Number.isNaN(departureDateTime.getTime()) ? null : departureDateTime;
};

export const resolveBoatVoucherPricing = ({
  baseTotalPrice,
  bookingDate,
  departureTime,
  flashSaleEnabled,
  paymentPlan,
}: BoatVoucherPricingInput): BoatVoucherPricingResult => {
  // Vouchers removed: no voucher discount applied; subtotal equals base total.
  const subtotalAfterVoucher = Math.max(baseTotalPrice, 0);

  const departureDateTime = buildDepartureDateTime(bookingDate, departureTime);
  const flashSaleEligible = Boolean(
    flashSaleEnabled &&
      departureDateTime &&
      departureDateTime.getTime() > Date.now() &&
      departureDateTime.getTime() - Date.now() <= FLASH_SALE_WINDOW_MS,
  );

  const flashSaleDiscount = flashSaleEligible
    ? Math.round(subtotalAfterVoucher * FLASH_SALE_DISCOUNT_RATE)
    : 0;
  const discountedTotal = Math.max(subtotalAfterVoucher - flashSaleDiscount, 0);
  const depositAmount = paymentPlan === "deposit" ? Math.round(discountedTotal * 0.3) : 0;
  const amountDueNow = paymentPlan === "deposit" ? depositAmount : discountedTotal;

  return {
    subtotalAfterVoucher,
    flashSaleEligible,
    flashSaleDiscount,
    discountedTotal,
    depositAmount,
    amountDueNow,
  };
};
