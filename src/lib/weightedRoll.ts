export type WeightedItem = {
  id: string;
  name: string;
  chance: number;
};

export function pickWeightedItem<T extends WeightedItem>(items: T[], roll01: number): T {
  const total = items.reduce((sum, item) => sum + Number(item.chance || 0), 0);
  let target = roll01 * total;

  for (const item of items) {
    target -= Number(item.chance || 0);
    if (target <= 0) return item;
  }

  return items[items.length - 1];
}
