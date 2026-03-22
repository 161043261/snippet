export type Goods = {
  id: number;
  price: number; // In Yuan
  quantity: number;
};

export type Discount =
  | { type: "percentage"; value: number }
  | { type: "fullReduce"; value: { threshold: number; reduce: number } };

export type CartData = {
  goodsList: Goods[];
  discount?: Discount;
};

/**
 * Safely converts a float price in Yuan to an integer in Cents.
 * Throws an error if precision anomaly or overflow is detected.
 */
export function yuanToCents(yuan: number): bigint {
  if (!Number.isFinite(yuan)) {
    throw new Error("Invalid number");
  }

  // Use string conversion to avoid floating point precision issues
  const str = yuan.toString();

  if (str.includes("e") || str.includes("E")) {
    throw new Error("Numerical overflow: scientific notation not supported");
  }

  const parts = str.split(".");
  const intPart = parts[0] || "0";
  const fracPart = parts[1] || "";

  if (fracPart.length > 2) {
    throw new Error(
      `Precision anomaly: price ${yuan} has more than 2 decimal places`,
    );
  }

  const paddedFrac = fracPart.padEnd(2, "0");
  const centsStr = intPart + paddedFrac;

  return BigInt(centsStr);
}

/**
 * Formats cents into a currency string (e.g. ¥123,456.78)
 */
export function formatCurrency(cents: bigint): string {
  const isNegative = cents < 0n;
  const absCents = isNegative ? -cents : cents;

  const intPart = absCents / 100n;
  const fracPart = absCents % 100n;

  const intStr = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fracStr = fracPart.toString().padStart(2, "0");

  return `¥${isNegative ? "-" : ""}${intStr}.${fracStr}`;
}

export class CartCalculator {
  private cart: CartData;

  constructor(cart: CartData) {
    this.cart = cart;
  }

  /**
   * Calculates the original total price in cents.
   */
  getOriginalTotalCents(): bigint {
    let total = 0n;
    for (const item of this.cart.goodsList) {
      if (item.quantity < 0 || !Number.isInteger(item.quantity)) {
        throw new Error(`Invalid quantity for item ${item.id}`);
      }
      const priceCents = yuanToCents(item.price);
      const qty = BigInt(item.quantity);
      total += priceCents * qty;
    }
    return total;
  }

  /**
   * Calculates the discount amount in cents based on the discount rules.
   */
  getDiscountAmountCents(originalTotalCents: bigint): bigint {
    const { discount } = this.cart;
    if (!discount) return 0n;

    if (discount.type === "percentage") {
      // For percentage, value is e.g. 0.9 (90%). We convert to cents to represent multiplier * 100.
      const percentMultiplier = yuanToCents(discount.value); // 0.9 -> 90n

      // The final price would be: (originalTotalCents * percentMultiplier + 50n) / 100n
      // The discount amount is originalTotalCents - finalPrice
      const finalPrice = (originalTotalCents * percentMultiplier + 50n) / 100n;
      let discountAmount = originalTotalCents - finalPrice;

      if (discountAmount < 0n) discountAmount = 0n;
      return discountAmount;
    }

    if (discount.type === "fullReduce") {
      const thresholdCents = yuanToCents(discount.value.threshold);
      const reduceCents = yuanToCents(discount.value.reduce);

      if (originalTotalCents >= thresholdCents) {
        return reduceCents > originalTotalCents
          ? originalTotalCents
          : reduceCents;
      }
    }

    return 0n;
  }

  /**
   * Calculates the final actual payment amount in cents.
   */
  getFinalTotalCents(): bigint {
    const originalTotal = this.getOriginalTotalCents();
    const discountAmount = this.getDiscountAmountCents(originalTotal);
    return originalTotal - discountAmount;
  }

  /**
   * Returns formatted final price
   */
  getFormattedFinalTotal(): string {
    const finalCents = this.getFinalTotalCents();
    return formatCurrency(finalCents);
  }

  /**
   * Returns a complete calculation report.
   */
  getReport() {
    const originalTotalCents = this.getOriginalTotalCents();
    const discountAmountCents = this.getDiscountAmountCents(originalTotalCents);
    const finalTotalCents = originalTotalCents - discountAmountCents;

    return {
      originalTotalCents,
      originalTotalFormatted: formatCurrency(originalTotalCents),
      discountAmountCents,
      discountAmountFormatted: formatCurrency(discountAmountCents),
      finalTotalCents,
      finalTotalFormatted: formatCurrency(finalTotalCents),
    };
  }
}
