import { describe, it, expect } from "vitest";
import { transformConditional } from "../src/core/index.js";

describe("Conditional Compilation", () => {
  const code = `
const a = 1;
// #if MY_ENV=='dev' && app=='1'
const b = 1;
// #elif MY_ENV=='test'
const b = 2;
// #else
const b = 3;
// #endif
const c = 3;
  `;

  it("should compile for dev env and app 1", () => {
    const result = transformConditional(code, { MY_ENV: "dev", app: "1" });
    expect(result?.code).toContain("const b = 1;");
    expect(result?.code).not.toContain("const b = 2;");
    expect(result?.code).not.toContain("const b = 3;");
  });

  it("should compile for test env", () => {
    const result = transformConditional(code, { MY_ENV: "test", app: "1" });
    expect(result?.code).not.toContain("const b = 1;");
    expect(result?.code).toContain("const b = 2;");
    expect(result?.code).not.toContain("const b = 3;");
  });

  it("should compile for other envs (else)", () => {
    const result = transformConditional(code, { MY_ENV: "prod", app: "1" });
    expect(result?.code).not.toContain("const b = 1;");
    expect(result?.code).not.toContain("const b = 2;");
    expect(result?.code).toContain("const b = 3;");
  });

  it("should handle nested conditions", () => {
    const nestedCode = `
// #if A
  // #if B
  const val = 'AB';
  // #else
  const val = 'A';
  // #endif
// #else
const val = 'None';
// #endif
    `;

    const resAB = transformConditional(nestedCode, { A: true, B: true });
    expect(resAB?.code).toContain("const val = 'AB'");
    expect(resAB?.code).not.toContain("const val = 'A'");

    const resA = transformConditional(nestedCode, { A: true, B: false });
    expect(resA?.code).toContain("const val = 'A'");
    expect(resA?.code).not.toContain("const val = 'AB'");

    const resNone = transformConditional(nestedCode, { A: false });
    expect(resNone?.code).toContain("const val = 'None'");
    expect(resNone?.code).not.toContain("const val = 'A'");
  });
});
