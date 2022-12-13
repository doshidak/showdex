import { calculate } from '@smogon/calc';
// import { formatId } from '@showdex/utils/app';
import { getGenDexForFormat } from '@showdex/utils/battle';
import { logger } from '@showdex/utils/debug';
import type { Move as SmogonMove, Pokemon as SmogonPokemon } from '@smogon/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type {
  CalcdexBattleField,
  CalcdexPlayerKey,
  CalcdexPokemon,
  ShowdexCalcdexSettings,
} from '@showdex/redux/store';
import type { CalcdexMatchupParsedDescription } from './parseDescription';
import { createSmogonField } from './createSmogonField';
import { createSmogonMove } from './createSmogonMove';
import { createSmogonPokemon } from './createSmogonPokemon';
import { formatDamageRange } from './formatDamageRange';
import { formatKoChance } from './formatKoChance';
import { getKoColor } from './getKoColor';
import { parseDescription } from './parseDescription';

export interface CalcdexMatchupResult {
  /**
   * Attacking Pokemon that the calculator used to calculate the calculatable calculation.
   *
   * @since 1.0.3
   */
  attacker?: SmogonPokemon;

  /**
   * Defending Pokemon that the calculator used to calculate the calculatable calculation.
   *
   * @since 1.0.3
   */
  defender?: SmogonPokemon;

  /**
   * Move that the calculator used to calculate the calculatable calculation.
   *
   * @since 0.1.3
   */
  move?: SmogonMove;

  /**
   * Parsed description of the result.
   *
   * * Useful for displaying additional matchup information in a tooltip, for instance.
   *
   * @example
   * ```ts
   * {
   *   raw: '252 Atk Weavile Knock Off (97.5 BP) vs. 252 HP / 0 Def Heatran: 144-169 (37.3 - 43.7%) -- guaranteed 2HKO after Stealth Rock and 2 layers of Spikes',
   *   attacker: '252 ATK Weavile Knock Off (97.5 BP)',
   *   defender: '252 HP / 0 DEF Heatran',
   *   damageRange: '144-169 (37.3 - 43.7%)',
   *   koChance: 'guaranteed 2HKO after Stealth Rock & 2 layers of Spikes',
   * }
   * ```
   * @since 1.0.1
   */
  description?: CalcdexMatchupParsedDescription;

  /**
   * In the format `XXX.X% - XXX.X%`, where `X` are numbers.
   *
   * * If the reported damage range was `'0 - 0%'`, this value will be `'N/A'` instead.
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

/**
 * Verifies that the arguments look *decently* good, then yeets them to `calculate()` from `@smogon/calc`.
 *
 * * If using this within a React component, opt to use the `useSmogonMatchup()` hook instead.
 *
 * @since 0.1.2
 */
export const calcSmogonMatchup = (
  format: string,
  playerPokemon: CalcdexPokemon,
  opponentPokemon: CalcdexPokemon,
  playerMove: MoveName,
  playerKey?: CalcdexPlayerKey,
  field?: CalcdexBattleField,
  settings?: ShowdexCalcdexSettings,
): CalcdexMatchupResult => {
  // this is the object that will be returned
  const matchup: CalcdexMatchupResult = {
    move: null,
    description: null,
    damageRange: null,
    koChance: null,
    koColor: null,
  };

  const dex = getGenDexForFormat(format);
  // const gen = detectGenFromFormat(format);

  if (!dex || !format || !playerPokemon?.speciesForme || !opponentPokemon?.speciesForme || !playerMove) {
    if (__DEV__ && playerMove) {
      l.warn(
        'Calculation ignored due to invalid arguments.',
        // '\n', 'dex.num', dex?.num,
        '\n', 'format', format, 'dex', dex,
        '\n', 'playerPokemon.speciesForme', playerPokemon?.speciesForme,
        '\n', 'opponentPokemon.speciesForme', opponentPokemon?.speciesForme,
        '\n', 'playerMove', playerMove,
        '\n', 'field', field,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return matchup;
  }

  // const ability = formatId(playerPokemon.dirtyAbility || playerPokemon.ability);

  // apply base power mods
  // const basePowerMods: number[] = [];

  // const playerSideKey: keyof CalcdexBattleField = playerKey === 'p2' ? 'defenderSide' : 'attackerSide';
  // const playerSide = field?.[playerSideKey];

  /**
   * @todo This implementation does not allow us to display the increased base power in the UI,
   *   like how it's for *Rage Fist*.
   */
  // if (ability === 'supremeoverlord' && playerSide?.faintedCount > 0) {
  //   /** @todo replace `5` with `maxPokemon - 1` from `CalcdexPlayer` whenever you refactor the codebase lmao */
  //   basePowerMods.push(1 + (0.1 * Math.min(playerSide.faintedCount, 5)));
  // }

  // if (formatId(opponentPokemon.lastMove) === 'glaiverush') {
  //   basePowerMods.push(2);
  // }

  matchup.attacker = createSmogonPokemon(format, playerPokemon, field);
  matchup.move = createSmogonMove(format, playerPokemon, playerMove, opponentPokemon);
  matchup.defender = createSmogonPokemon(format, opponentPokemon, field);

  const smogonField = createSmogonField(field, playerPokemon, playerKey);

  try {
    const result = calculate(
      dex,
      matchup.attacker,
      matchup.defender,
      matchup.move,
      smogonField,
    );

    matchup.description = parseDescription(result);
    matchup.damageRange = formatDamageRange(result);
    matchup.koChance = formatKoChance(result, settings?.nhkoLabels);
    matchup.koColor = getKoColor(result, settings?.nhkoColors);

    // l.debug(
    //   'Calculated damage from', playerPokemon.name, 'using', playerMove, 'against', opponentPokemon.name,
    //   '\n', 'gen', dex.num,
    //   '\n', 'playerPokemon', playerPokemon.name || '???', playerPokemon,
    //   '\n', 'opponentPokemon', opponentPokemon.name || '???', opponentPokemon,
    //   '\n', 'field', field,
    //   '\n', 'matchup', matchup,
    //   '\n', 'result', result,
    // );
  } catch (error) {
    // ignore 'damage[damage.length - 1] === 0' (i.e., no damage) errors,
    // which is separate from 'N/A' damage (e.g., status moves).
    // typically occurs when the opposing Pokemon is immune to the damaging move,
    // like using Earthquake against a Lando-T, which is immune due to its Flying type.
    if (__DEV__ && !(<Error> error)?.message?.includes('=== 0')) {
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
  }

  return matchup;
};
