/** URL 입력은 외부 입력이다. 유효한 값만 선택 상태로 사용한다. */
export function searchInteger(value: unknown, minimum = 1): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  if (value === '') return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= minimum ? number : undefined;
}

export function searchEnum<T extends string>(value: unknown, values: readonly T[]): T | undefined {
  return values.find((item) => item === value);
}

export function searchEnums<T extends string>(value: unknown, values: readonly T[]): T[] | undefined {
  const items = Array.isArray(value) ? value : [value];
  const valid = [...new Set(items.flatMap((item) => searchEnum(item, values) ?? []))];
  return valid.length ? valid : undefined;
}

export function searchText(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}
export function searchTexts(value: unknown): string[] {
  return [...new Set((Array.isArray(value) ? value : [value]).flatMap((item) => searchText(item) ?? []))];
}
export function searchDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 9999) return undefined;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? value : undefined;
}
export function searchMonth(value: unknown): string | undefined {
  return typeof value === 'string' && searchDate(`${value}-01`) ? value : undefined;
}
