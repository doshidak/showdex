const serializableKeys: (keyof Showdown.Pokemon)[] = [
  'ident',
  'name',
  'speciesForme',
  // 'slot',
  'fainted',
  'hp',
  'maxhp',
  'level',
  // 'gender',
  // 'shiny',
  // 'moves',
  'ability',
  'baseAbility',
  'item',
  'itemEffect',
  'prevItem',
  'prevItemEffect',
  'boosts',
  'status',
  'statusStage',
  'volatiles',
  'turnstatuses',
  'movestatuses',
  'lastMove',
  'moveTrack',
  'statusData',
];

export const serializePokemon = (pokemon: Partial<Showdown.Pokemon>, pretty?: boolean): string => {
  const serialized = serializableKeys.reduce((acc, key) => {
    if (key in (pokemon || {})) {
      acc[key] = pokemon[key];
    }

    return acc;
  }, {});

  if (pretty) {
    return JSON.stringify(serialized, null, 2);
  }

  return JSON.stringify(serialized);
};
