import { describe, it, expect } from "vitest";
import { parseDecimalInput, validateConsumoMetros } from "@/lib/consumo-validation";

describe("consumo validation", () => {
  it("parses Brazilian comma decimals and dot decimals identically", () => {
    expect(parseDecimalInput("2,16")).toBeCloseTo(2.16);
    expect(parseDecimalInput("2.16")).toBeCloseTo(2.16);
    expect(parseDecimalInput("")).toBe(0);
  });

  it("rejects values >= 1000 that overflow modelos.consumo_tecido numeric(6,3)", () => {
    expect(validateConsumoMetros("2612")).toContain("menor que 1000");
    expect(validateConsumoMetros(1000)).toContain("menor que 1000");
    expect(validateConsumoMetros("-1")).toContain("não negativo");
  });

  it("accepts blank and valid consumption values up to 999.999", () => {
    expect(validateConsumoMetros("")).toBeNull();
    expect(validateConsumoMetros("2,16")).toBeNull();
    expect(validateConsumoMetros("999.999")).toBeNull();
  });
});