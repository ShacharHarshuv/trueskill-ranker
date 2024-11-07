/*Wrapper around solid signals for easier API*/

import { createSignal } from "solid-js";

export function signal<T>(initialValue: T) {
  const [value, setValue] = createSignal(initialValue);
  return Object.assign(value, {
    set: setValue,
  });
}

export type WritableSignal<T> = ReturnType<typeof signal<T>>;
