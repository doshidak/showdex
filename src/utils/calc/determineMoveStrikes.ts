import { type MoveName, type ShowdexCalcStrike } from '@smogon/calc';
import { type CalcdexBattleField, type CalcdexPlayer, type CalcdexPokemon } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { detectGenFromFormat } from '@showdex/utils/dex';
import { calcPokemonFinalStats } from './calcPokemonFinalStats';
import { calcMoveBasePower } from './calcMoveBasePower';

/**
 * Returns any base damage calculator parameters for the given move.
 *
 * * This is pretty much only used for *Beat Up* atm lmao.
 * * Return value of this will be passed into our modified `calculate()` function as the last argument.
 *   - `@smogon/calc` patch file included in this codebase modifies the aforementioned function to accept
 *     an array of `ShowdexCalcStrike`'s.
 *   - (Idea behind the name *strike* was to distinguish it from *hits* as in multi-hitting moves like *Rock Blast*.)
 *   - (idk how I feel about it tbh LOL)
 *   - Each element in the array will call the internal `getBaseDamage()` function used in each mechanics
 *     file, with any of the parameters defaulting to the attacker's stats if falsy.
 *   - Cool trick is that you can pass `null` to represent the attacker's strike.
 * * As intended to be passed into the last argument of `calculate()`, this will return `undefined` if there aren't
 *   any strikes to be made for the `moveName`.
 * * Due to the ass function signature of `calcPokemonFinalStats()` cause I never cleaned it up, this function has
 *   an equally as (if not arguably more) terrible function signature as well.
 *   - Sorry.
 *   - I'll fix it eventually.
 *
 * @since 1.1.6
 */
export const determineMoveStrikes = (
  format: string,
  moveName: MoveName,
  pokemon?: CalcdexPokemon,
  opponentPokemon?: CalcdexPokemon,
  player?: CalcdexPlayer,
  opponent?: CalcdexPlayer,
  allPlayers?: CalcdexPlayer[],
  field?: CalcdexBattleField,
): ShowdexCalcStrike[] => {
  const gen = detectGenFromFormat(format);

  if (!gen || !moveName) {
    return undefined;
  }

  const moveId = formatId(moveName);

  // just like the name implies, not only does it beat up your Pokemon, it also beats up all the devs
  // who attempt to implement this shit (also thank fuk we don't have to apply damage mods on each strike LOL)
  if (moveId === 'beatup') {
    if (!pokemon?.calcdexId || !player?.pokemon?.length) {
      return undefined;
    }

    // in the event that no Pokemon are eligble (alive w/out a non-volatile status like BRN) to beat up the defender:
    // in gens 2-4, the move completely fails &
    // in gens 5+, only the attacker strikes (with the calculated base power from calcMoveBasePower())
    // note: we're filtering out the `pokemon` itself in `eligiblePokemon`
    const eligiblePokemon = player.pokemon.filter((p) => (
      !!p?.calcdexId
        && p.calcdexId !== pokemon.calcdexId
        && (p.dirtyHp ?? (p.hp || 0)) > 0
        && !p.status
    ));

    if (!eligiblePokemon?.length) {
      return undefined;
    }

    // we must perform the big mathematics to get the summation of all the final attack stats of each ally,
    // which is then divided by 10 probably for scaling purposes & finally, a 5 is added to it probably
    // to guarantee at least 5 points of damage ... ez right? c:
    if (gen > 4) {
      const attack = calcPokemonFinalStats(
        format,
        pokemon,
        opponentPokemon,
        player,
        opponent,
        field,
        allPlayers,
      )?.stats?.atk ?? 0;

      // note: for gens 5+, eligible Pokemon only influence the number of strikes & their base powers,
      // unlike in prior gens where their level & ATK stat (not of the original attacker) are considered
      return [
        null, // this is the attacker's strike (which are the default values of each ShowdexCalcStrike)
        ...eligiblePokemon.map((p) => ({
          basePower: calcMoveBasePower(format, p, moveName),
          attack,
        }) as ShowdexCalcStrike),
      ];
    }

    // gens 2-4 is where Beat Up gets a lil spicy
    const defense = opponentPokemon?.dirtyBaseStats?.def
      ?? opponentPokemon?.transformedBaseStats?.def
      ?? opponentPokemon?.baseStats?.def
      ?? 0;

    return [{
      attack: pokemon?.dirtyBaseStats?.atk ?? pokemon?.transformedBaseStats?.atk ?? pokemon?.baseStats?.atk ?? 0,
      defense,
    }, ...eligiblePokemon.map((p) => ({
      // striking Pokemon's level is ***only*** used in gen 2!
      level: gen === 2 ? p.level : undefined,

      // every strike in these gens have a fixed BP of 10
      // (but we'll fallback to whatever the dex lookup got [hopefully 10] by passing undefined)
      // basePower: undefined,

      // each strike hits with the striking Pokemon's base ATK stat
      attack: p?.dirtyBaseStats?.atk ?? p?.transformedBaseStats?.atk ?? p?.baseStats?.atk ?? 0,

      // ... & we'll use the defending stat that was passed to calcSmogonMatchup() sooo...
      // (wow this doesn't look very complex in retrospect LOL)
      // jk I lied this shit broke af
      defense,
    }) as ShowdexCalcStrike)];
  }

  // at this point, no other moves need strikes to be populated, so undefined it is!
  return undefined;
};
