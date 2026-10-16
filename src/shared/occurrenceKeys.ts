export interface KeyedValue<Value extends string> {
  readonly key: string;
  readonly value: Value;
}

export function withOccurrenceKeys<Value extends string>(
  values: readonly Value[],
): KeyedValue<Value>[] {
  const occurrences = new Map<Value, number>();
  return values.map((value) => {
    const occurrence = (occurrences.get(value) ?? 0) + 1;
    occurrences.set(value, occurrence);
    return { key: `${value}#${occurrence}`, value };
  });
}
