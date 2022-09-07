import { calculate } from '@smogon/calc';
import {
  createSmogonField,
  createSmogonMove,
  createSmogonPokemon,
} from '@showdex/utils/calc';
import { logger } from '@showdex/utils/debug';
import type { Generation, MoveName } from '@pkmn/data';
import type {
  // Field as SmogonField,
  Move as SmogonMove,
  // Pokemon as SmogonPokemon,
  Result,
} from '@smogon/calc';
import type {
  CalcdexBattleField,
  CalcdexPlayerKey,
  CalcdexPokemon,
} from '@showdex/redux/store';

export interface CalcdexMatchupResult {
  /**
   * Move that the calculator used to calculate the calculatable calculation.
   *
   * @since 0.1.3
   */
  move?: SmogonMove;

  /**
   * Description of the result.
   *
   * * Useful for displaying additional matchup information in a tooltip, for instance.
   *
   * @example '252+ SpA Life Orb Venusaur Weather Ball (50 BP Normal) vs. 4 HP / 0 SpD Azumarill: 79-94 (23 - 27.4%) -- 59.5% chance to 4HKO'
   * @since 1.0.1
   */
  description?: string;

  /**
   * In the format `XXX.X% - XXX.X%`, where `X` are numbers.
   *
   * @example '38.5% - 52.0%'
   * @since 0.1.2
   */
  damageRange?: string;

  /**
   * In the format `XXX[.X]% nHKO`, where `X` and `n` are numbers.
   *
   * @example '47.2% 2HKO'
   * @since 0.1.2
   */
  koChance?: string;

  /**
   * Color that should be applied to the DOM element rendering `koChance`.
   *
   * * If the value is `null`, then no color (other than the default) should be applied.
   *
   * @since 0.1.2
   */
  koColor?: string;
}

const l = logger('@showdex/utils/calc/calcSmogonMatchup');

const formatDamageRange = (
  // result: Result,
  description: string,
): string => {
  // if (!result?.damage || typeof result.desc !== 'function') {
  //   return null;
  // }

  if (!description) {
    return null;
  }

  // const resultDesc = result.desc();

  const extractedRange = /\(([\d.]+\s-\s[\d.]+%)\)/.exec(description)?.[1] || '';

  if (extractedRange.includes('0 - 0%')) {
    return '0%';
  }

  return extractedRange;
};

const formatKoChance = (
  result: Result,
): string => {
  if (!result?.damage || typeof result.kochance !== 'function') {
    return null;
  }

  const output: string[] = [];

  try {
    const resultKoChance = result.kochance();

    if (!resultKoChance?.chance && !resultKoChance?.n) {
      return null;
    }

    output.push(`${resultKoChance.n}HKO`);

    // no point in displaying a 100% chance to KO
    // (should be assumed that if there's no % displayed before the KO, it's 100%)
    if (typeof resultKoChance.chance === 'number' && resultKoChance.chance !== 1) {
      // sometimes, we might see '0.0% 3HKO' or something along those lines...
      // probably it's like 0.09%, but gets rounded down when we fix it to 1 decimal place
      const chancePercentage = resultKoChance.chance * 100;
      const decimalPlaces = ['0.0', '100.0'].includes(chancePercentage.toFixed(1)) ? 2 : 1;
      const fixedChance = chancePercentage.toFixed(decimalPlaces);

      if (fixedChance !== '0.0' && fixedChance !== '100.0') {
        // also truncate any trailing zeroes, e.g., 75.0% -> 75%
        output.unshift(`${fixedChance}%`.replace('.0%', '%'));
      }
    }
  } catch (error) {
    if (__DEV__) {
      l.error(
        'Exception while grabbing the kochance() of the result.',
        '\n', 'result', result,
        '\n', '(You will only see this error on development.)',
      );
    }

    throw error;
  }

  return output.join(' ');
};

/**
 * Index refers to the `result.n` value.
 *
 * * Hence why the first index (`0`) is `null` ("0HKO" = no KO... lmao).
 * * If `n` is `0` or falsy, the default color should be applied.
 * * Any index that exceeds the length of this array should use the last index's color.
 *
 * @since 0.1.2
 */
const SmogonMatchupKoColors: string[] = [
  null,
  '#4CAF50', // 1HKO -- (styles/config/colors.scss) colors.$green
  '#FF9800', // 2HKO -- MD Orange 500
  '#FF9800', // 3HKO -- MD Orange 500
  '#F44336', // 4+HKO -- (styles/config/colors.scss) colors.$red
];

const getKoColor = (
  result: Result,
): string => {
  if (!result?.damage || typeof result.kochance !== 'function') {
    return null;
  }

  const resultKoChance = result.kochance();

  if (!resultKoChance?.chance && !resultKoChance?.n) {
    return null;
  }

  const koColorIndex = Math.min(
    resultKoChance.n,
    SmogonMatchupKoColors.length - 1,
  );

  return SmogonMatchupKoColors[koColorIndex];
};

/**
 * Verifies that the arguments look *decently* good, then yeets them to `calculate()` from `@smogon/calc`.
 *
 * @warning If using this within a React component, opt to use the `useSmogonMatchup()` hook instead.
 * @since 0.1.2
 */
export const calcSmogonMatchup = (
  dex: Generation,
  playerPokemon: CalcdexPokemon,
  opponentPokemon: CalcdexPokemon,
  playerMove: MoveName,
  playerKey?: CalcdexPlayerKey,
  field?: CalcdexBattleField,
): CalcdexMatchupResult => {
  if (!dex?.num || !playerPokemon?.speciesForme || !opponentPokemon?.speciesForme || !playerMove) {
    if (__DEV__ && playerMove) {
      l.warn(
        'Calculation ignored due to invalid arguments.',
        '\n', 'dex.num', dex?.num,
        '\n', 'playerPokemon.speciesForme', playerPokemon?.speciesForme,
        '\n', 'opponentPokemon.speciesForme', opponentPokemon?.speciesForme,
        '\n', 'playerMove', playerMove,
        '\n', 'field', field,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  const smogonPlayerPokemon = createSmogonPokemon(dex, playerPokemon, playerMove);
  const smogonPlayerPokemonMove = createSmogonMove(dex, playerPokemon, playerMove);
  const smogonOpponentPokemon = createSmogonPokemon(dex, opponentPokemon);

  const attackerSide = playerKey === 'p1' ? field?.attackerSide : field?.defenderSide;
  const defenderSide = playerKey === 'p1' ? field?.defenderSide : field?.attackerSide;

  const smogonField = createSmogonField({
    ...field,
    attackerSide,
    defenderSide,
  });

  try {
    const result = calculate(
      dex,
      smogonPlayerPokemon,
      smogonOpponentPokemon,
      smogonPlayerPokemonMove,
      smogonField,
    );

    const description = result?.desc();

    const matchup: CalcdexMatchupResult = {
      move: smogonPlayerPokemonMove,
      description,
      damageRange: formatDamageRange(description),
      koChance: formatKoChance(result),
      koColor: getKoColor(result),
    };

    // l.debug(
    //   'Calculated damage from', playerPokemon.name, 'using', playerMove, 'against', opponentPokemon.name,
    //   '\n', 'dex.num', dex.num,
    //   '\n', 'matchup', matchup,
    //   '\n', 'result', result,
    //   '\n', 'playerPokemon', playerPokemon.name || '???', playerPokemon,
    //   '\n', 'opponentPokemon', opponentPokemon.name || '???', opponentPokemon,
    //   '\n', 'field', field,
    // );

    return matchup;
  } catch (error) {
    if (__DEV__) {
      l.error(
        'Exception while calculating the damage from', playerPokemon.name, 'using', playerMove, 'against', opponentPokemon.name,
        '\n', 'dex.num', dex.num,
        '\n', 'playerPokemon', playerPokemon.name || '???', playerPokemon,
        '\n', 'opponentPokemon', opponentPokemon.name || '???', opponentPokemon,
        '\n', 'field', field,
        '\n', '(You will only see this error on development.)',
        '\n', error,
      );
    }

    return {
      move: smogonPlayerPokemonMove,
      description: null,
      damageRange: null,
      koChance: null,
      koColor: null,
    };
  }
};
