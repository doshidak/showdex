declare namespace Showdown {
  type StatName =
    | 'hp'
    | 'atk'
    | 'def'
    | 'spa'
    | 'spd'
    | 'spe';

  type StatNameNoHp = Exclude<StatName, 'hp'>;

  type BoostStatName =
    | StatNameNoHp
    | 'accuracy'
    | 'evasion'
    | 'spc';

  type NatureName =
    | 'Adamant'
    | 'Bashful'
    | 'Bold'
    | 'Brave'
    | 'Calm'
    | 'Careful'
    | 'Docile'
    | 'Gentle'
    | 'Hardy'
    | 'Hasty'
    | 'Impish'
    | 'Jolly'
    | 'Lax'
    | 'Lonely'
    | 'Mild'
    | 'Modest'
    | 'Naive'
    | 'Naughty'
    | 'Quiet'
    | 'Quirky'
    | 'Rash'
    | 'Relaxed'
    | 'Sassy'
    | 'Serious'
    | 'Timid';

  type TypeName =
    | 'Normal'
    | 'Fighting'
    | 'Flying'
    | 'Poison'
    | 'Ground'
    | 'Rock'
    | 'Bug'
    | 'Ghost'
    | 'Steel'
    | 'Fire'
    | 'Water'
    | 'Grass'
    | 'Electric'
    | 'Psychic'
    | 'Ice'
    | 'Dragon'
    | 'Dark'
    | 'Fairy'
    | 'Stellar'
    | '???';

  type GenderName = 'M' | 'F' | 'N';
}
