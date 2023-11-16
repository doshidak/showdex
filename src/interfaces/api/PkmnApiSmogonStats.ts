import { type AbilityName, type ItemName, type MoveName } from '@smogon/calc';

/**
 * Schema of a Pokemon's Showdown usage statistics from the pkmn API.
 *
 * * Note that this is for a **single** Pokemon.
 * * Prior to v1.1.8, this was defined directly in `PkmnApiSmogonFormatStatsResponse`.
 *
 * @since 1.1.8
 */
export interface PkmnApiSmogonStats {
  count: number;
  weight: number;

  lead: {
    raw: number;
    real: number;
    weighted: number;
  };

  usage: {
    raw: number;
    real: number;
    weighted: number;
  };

  viability: [
    bigBigNumberIdk: number,
    smallerNumberMaybe: number,
    maybeSmallerNumber: number,
    noIdeaTbh: number,
  ];

  abilities: { [name: AbilityName]: number; };
  items: { [name: ItemName]: number; };
  spreads: { [spread: string]: number; };
  moves: { [name: MoveName]: number; };
  happinesses: { [value: string]: number; };

  teammates: {
    [speciesForme: string]: number;
  };

  counters: {
    [speciesForme: string]: [
      bigBigNumberIdk: number,
      percentageProbably: number,
      anotherPercentageIdk: number,
    ];
  };
}
