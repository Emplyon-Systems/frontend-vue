import { describe, expect, it } from "vitest";

import {
  laravelErrorsToFieldMap,
  parseApiValidationResponse,
  pickToastMessage,
} from "../map-laravel-errors";

describe("laravelErrorsToFieldMap", () => {
  it("retorna null para null", () => {
    expect(laravelErrorsToFieldMap(null)).toBeNull();
  });

  it("mapeia objeto de erros por campo", () => {
    expect(
      laravelErrorsToFieldMap({ email: ["inválido"], name: "obrigatório" }),
    ).toEqual({ email: "inválido", name: "obrigatório" });
  });
});

describe("pickToastMessage", () => {
  it("respeita prioridade", () => {
    expect(
      pickToastMessage({ a: "x", general: "g" }, ["a"]),
    ).toBe("x");
  });
});

describe("parseApiValidationResponse", () => {
  it("extrai fieldErrors de errors", () => {
    const r = parseApiValidationResponse({ errors: { foo: ["bar"] } });
    expect(r.fieldErrors).toEqual({ foo: "bar" });
  });

  it("lê message quando não há errors", () => {
    const r = parseApiValidationResponse({ message: "Ops" });
    expect(r.fieldErrors).toBeNull();
    expect(r.messageOnly).toBe("Ops");
  });
});
