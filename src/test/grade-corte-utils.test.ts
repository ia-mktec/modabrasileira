import { describe, it, expect } from "vitest";
import { findDuplicateGradeColors, isCorJaNaGrade, normalizeGradeCor } from "@/lib/grade-corte-utils";

describe("grade corte duplicate color checks", () => {
  it("detects exact, case, whitespace and accent duplicates", () => {
    const dups = findDuplicateGradeColors([
      { cor: "Preto" },
      { cor: "Salmão" },
      { cor: "preto" },
      { cor: "Salmao " },
      { cor: "Caqui" },
    ]);
    expect(dups).toEqual(["preto", "Salmao"]);
  });

  it("returns empty array when all colors are distinct", () => {
    const dups = findDuplicateGradeColors([
      { cor: "Preto" },
      { cor: "Caqui" },
      { cor: "Azul bebê" },
      { cor: "Amarelo" },
      { cor: "Salmão" },
      { cor: "Rosa" },
    ]);
    expect(dups).toEqual([]);
  });

  it("flags colors already selected on another row while allowing keeping the same row color", () => {
    const rows = [
      { id: "r1", cor: "Azul bebê" },
      { id: "r2", cor: "Preto" },
    ];
    expect(isCorJaNaGrade(rows, "r2", "Azul bebe")).toBe(true);
    expect(isCorJaNaGrade(rows, "r1", "Azul bebê")).toBe(false);
    expect(isCorJaNaGrade(rows, "r2", "Rosa")).toBe(false);
    expect(normalizeGradeCor("  Azul  Bebê ")).toBe("azul bebe");
  });
});