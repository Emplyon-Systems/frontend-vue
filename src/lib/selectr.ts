/**
 * Wrapper para mobius1-selectr.
 * O pacote é UMD e no Vite/ESM o default export pode vir em .default ou ser undefined;
 * este módulo normaliza para que Selectr esteja sempre disponível.
 */
import * as M from "mobius1-selectr";

const Raw = (M as unknown as { default?: unknown })?.default ?? M;
const Selectr = Raw as new (
  element: HTMLSelectElement | string,
  options?: Record<string, unknown>
) => {
  on: (event: string, fn: (...args: unknown[]) => void) => void;
  getValue: (serialise?: boolean, asObject?: boolean) => unknown;
  setValue: (value: string | number | (string | number)[]) => void;
  destroy: () => void;
};

export default Selectr;
