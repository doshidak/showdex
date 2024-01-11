export type MoveCategoryFieldLabel = [
  offensive: 'status',
  defensive: 'status',
  label: string,
] | [
  offensive: Showdown.StatNameNoHp,
  defensive: Showdown.StatNameNoHp,
  label: string,
];

export const MoveCategoryFieldDefaultLabels: MoveCategoryFieldLabel[] = [
  ['status', 'status', 'status'],
  ['atk', 'def', 'physical'],
  ['spa', 'spd', 'special'],
];

export const findCategoryLabel = (
  offensive: Showdown.StatNameNoHp | 'status',
  defensive: Showdown.StatNameNoHp | 'status',
  ...labels: MoveCategoryFieldLabel[]
): MoveCategoryFieldLabel => [
  ...labels,
  ...MoveCategoryFieldDefaultLabels,
].find(([
  atk,
  def,
]) => (
  (offensive === 'status' || defensive === 'status')
    && atk === 'status'
) || (
  offensive === atk && defensive === def
));
