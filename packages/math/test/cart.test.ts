import { describe, it, expect } from "vitest";
import {
  CartCalculator,
  yuanToCents,
  formatCurrency,
  type CartData,
} from "../src/cart.js";

describe("CartCalculator Precision & Features", () => {
  describe("Basic Precision Utils", () => {
    it("yuanToCents should correctly convert typical floats", () => {
      expect(yuanToCents(0.1)).toBe(10n);
      expect(yuanToCents(19.99)).toBe(1999n);
      expect(yuanToCents(99.99)).toBe(9999n);
      expect(yuanToCents(300)).toBe(30000n);
    });

    it("yuanToCents should throw error if decimal places > 2", () => {
      expect(() => yuanToCents(0.30000000000000004)).toThrow(
        "Precision anomaly",
      );
      expect(() => yuanToCents(19.991)).toThrow("Precision anomaly");
    });

    it("formatCurrency should format correctly", () => {
      expect(formatCurrency(12345678n)).toBe("¥123,456.78");
      expect(formatCurrency(30n)).toBe("¥0.30");
      expect(formatCurrency(999900000000n)).toBe("¥9,999,000,000.00");
    });
  });

  describe("Scenario 1: Precision Loss Test", () => {
    it("should correctly calculate 0.1 * 3 without yielding 0.30000000000000004", () => {
      const cart: CartData = {
        goodsList: [{ id: 1, price: 0.1, quantity: 3 }],
      };
      const calculator = new CartCalculator(cart);

      const report = calculator.getReport();
      expect(report.originalTotalCents).toBe(30n); // exactly 30 cents
      expect(report.originalTotalFormatted).toBe("¥0.30");
    });
  });

  describe("Scenario 2: Mixed Goods Test", () => {
    it("should correctly calculate 19.99 * 2 + 29.9 * 3 without yielding 129.67999999999998", () => {
      const cart: CartData = {
        goodsList: [
          { id: 2, price: 19.99, quantity: 2 },
          { id: 4, price: 29.9, quantity: 3 },
        ],
      };
      const calculator = new CartCalculator(cart);

      const report = calculator.getReport();
      // 19.99 * 2 = 39.98 -> 3998 cents
      // 29.90 * 3 = 89.70 -> 8970 cents
      // 3998 + 8970 = 12968 cents -> 129.68 yuan
      expect(report.originalTotalCents).toBe(12968n);
      expect(report.originalTotalFormatted).toBe("¥129.68");
    });
  });

  describe("Scenario 3: Large Order Test", () => {
    it("should correctly calculate 99.99 * 10 billion without yielding 9999000000.000002", () => {
      const cart: CartData = {
        goodsList: [{ id: 3, price: 99.99, quantity: 1000000000 }],
      };
      const calculator = new CartCalculator(cart);

      const report = calculator.getReport();
      // 99.99 -> 9999 cents. 9999 * 1000000000 = 9999000000000 cents
      expect(report.originalTotalCents).toBe(9999000000000n);
      expect(report.originalTotalFormatted).toBe("¥99,990,000,000.00");
    });
  });

  describe("Scenario 4: Full Reduce Discount Test", () => {
    it("should correctly calculate threshold met without float artifact yielding 300.000001", () => {
      const cart: CartData = {
        goodsList: [{ id: 5, price: 350.0, quantity: 1 }],
        discount: {
          type: "fullReduce",
          value: { threshold: 300, reduce: 50 },
        },
      };
      const calculator = new CartCalculator(cart);

      const report = calculator.getReport();
      // Original: 35000 cents
      // Discount: 5000 cents
      // Final: 30000 cents
      expect(report.originalTotalCents).toBe(35000n);
      expect(report.discountAmountCents).toBe(5000n);
      expect(report.finalTotalCents).toBe(30000n);
      expect(report.finalTotalFormatted).toBe("¥300.00");
    });
  });

  describe("Additional: Percentage Discount Test", () => {
    it("should apply percentage discount correctly and format it", () => {
      const cart: CartData = {
        goodsList: [
          { id: 6, price: 100, quantity: 1 }, // 10000 cents
        ],
        discount: {
          type: "percentage",
          value: 0.9, // 90%
        },
      };
      const calculator = new CartCalculator(cart);

      const report = calculator.getReport();
      // Original: 10000 cents
      // Final: 10000 * 90 / 100 = 9000 cents
      // Discount: 1000 cents
      expect(report.originalTotalCents).toBe(10000n);
      expect(report.discountAmountCents).toBe(1000n);
      expect(report.finalTotalCents).toBe(9000n);
      expect(report.finalTotalFormatted).toBe("¥90.00");
    });
  });
});
