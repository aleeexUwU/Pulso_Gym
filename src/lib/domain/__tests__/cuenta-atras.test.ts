import { describe, expect, it } from "vitest";
import { msHastaSiguienteCambio, segundosRestantes } from "../../hooks/use-cuenta-atras";

describe("cuenta atrás basada en timestamps", () => {
  const hasta = 100_000;

  it("redondea hacia arriba y nunca baja de 0", () => {
    expect(segundosRestantes(hasta, 97_000)).toBe(3);
    expect(segundosRestantes(hasta, 97_001)).toBe(3);
    expect(segundosRestantes(hasta, 99_999)).toBe(1);
    expect(segundosRestantes(hasta, 100_000)).toBe(0);
    expect(segundosRestantes(hasta, 105_000)).toBe(0);
  });

  it("programa el siguiente tic justo en el cambio de segundo", () => {
    expect(msHastaSiguienteCambio(hasta, 97_000)).toBe(1000);
    expect(msHastaSiguienteCambio(hasta, 97_300)).toBe(700);
    expect(msHastaSiguienteCambio(hasta, 99_995)).toBe(16);
    expect(msHastaSiguienteCambio(hasta, 100_000)).toBe(0);
  });

  it("aunque un tic llegue tarde, el valor mostrado es el real", () => {
    // Si el navegador retrasa el temporizador 1,7 s, no "pierde" ese tiempo.
    expect(segundosRestantes(hasta, 97_000 + 1_700)).toBe(2);
  });
});
