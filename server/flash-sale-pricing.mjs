const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const FLASH_SALE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const FLASH_SALE_DISCOUNT_RATE = 0.3;

const isValidTime = (value) => TIME_REGEX.test(String(value ?? ""));

const buildDepartureDateTime = (bookingDate, departureTime) => {
  if (!bookingDate || !isValidTime(departureTime)) {
    return null;
  }

  const departureDateTime = new Date(`${bookingDate}T${departureTime}:00`);
  return Number.isNaN(departureDateTime.getTime()) ? null : departureDateTime;
};

export const resolveFlashSalePricing = ({
  baseTotalPrice,
  bookingDate,
  departureTime,
  flashSaleEnabled,
  paymentPlan,
}) => {
  const departureDateTime = buildDepartureDateTime(bookingDate, departureTime);
  const flashSaleEligible = Boolean(
    flashSaleEnabled &&
      departureDateTime &&
      departureDateTime.getTime() > Date.now() &&
      departureDateTime.getTime() - Date.now() <= FLASH_SALE_WINDOW_MS,
  );

  const flashSaleDiscount = flashSaleEligible
    ? Math.round(baseTotalPrice * FLASH_SALE_DISCOUNT_RATE)
    : 0;
  const discountedTotal = Math.max(baseTotalPrice - flashSaleDiscount, 0);
  const depositAmount = paymentPlan === "deposit" ? Math.round(discountedTotal * 0.3) : 0;
  const amountDueNow = paymentPlan === "deposit" ? depositAmount : discountedTotal;

  return {
    flashSaleEligible,
    flashSaleDiscount,
    discountedTotal,
    depositAmount,
    amountDueNow,
  };
};
