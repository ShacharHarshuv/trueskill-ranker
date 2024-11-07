import { persistentSignal } from "~/utils/persistant-signal";
import { Rating } from "ts-trueskill";

export interface Item {
  name: string;
  rating: Rating;
}

export interface SerializedItem {
  name: string;
  rating: [number, number];
}

export function parseItems(value: string): Item[] {
  return JSON.parse(value).map((item: SerializedItem) => ({
    ...item,
    rating: new Rating(item.rating[0], item.rating[1]),
  }));
}

export function serializeItems(value: Item[]): string {
  return JSON.stringify(
    value.map((item) => ({
      ...item,
      rating: [item.rating.mu, item.rating.sigma],
    })),
  );
}

export function createItemsSignal() {
  return persistentSignal<Item[]>("list", [], {
    parse: parseItems,
    serialize: serializeItems,
  });
}
