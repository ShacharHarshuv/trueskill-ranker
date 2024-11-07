import { signal } from "~/utils/signal";
import { createEffect, onMount } from "solid-js";

export function persistentSignal<T>(
  key: string,
  defaultValue: T,
  options: {
    parse: (value: string) => Exclude<T, Function>;
    serialize: (value: T) => string;
  } = {
    parse: JSON.parse,
    serialize: JSON.stringify,
  },
) {
  const valueSignal = signal<T>(defaultValue);

  onMount(() => {
    const savedString = localStorage.getItem(key);
    if (savedString) {
      valueSignal.set(options.parse(savedString));
    }
  });
  createEffect(() => {
    localStorage.setItem(key, options.serialize(valueSignal()));
  });
  return valueSignal;
}
