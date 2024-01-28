import { type CalcdexPlayerKey, type CalcdexPokemon, CalcdexPlayerKeys } from '@showdex/interfaces/calc';
import { calcPokemonCalcdexId } from '@showdex/utils/calc';
import { detectPlayerKeyFromPokemon } from './detectPlayerKey';

/**
 * Reassigns the provided `pokemon` to the `playerKey`.
 *
 * * Generates a new `calcdexId`.
 * * Provided `pokemon` is only shallow-copied.
 * * Specifying `true` for the optional `userSourced` argument will convert all battle-reported properties, such as
 *   `ability` & `item`/`prevItem`, into their corresponding dirty properties, e.g., `dirtyAbility` & `dirtyItem`,
 *   respectively, & mark the `pokemon` as `'user'`-sourced.
 *   - This is so that any duplicated Pokemon from `'server'` & `'client'` sources (i.e., from a battle) in a converted
 *     honk won't inherit the battle-reported properties from its source.
 *   - Otherwise, a bunch of "Reset" buttons will appear when the user manually changes something, which isn't normally
 *     the case when the Pokemon is manually added.
 * * Doesn't check if the `pokemon.playerKey` is the same as the provided `playerKey`, so you can technically use this
 *   to convert a Pokemon into a `'user'`-sourced one.
 *
 * @since 1.2.3
 */
export const reassignPokemon = (
  pokemon: CalcdexPokemon,
  playerKey: CalcdexPlayerKey,
  userSourced?: boolean,
): CalcdexPokemon => {
  if (!pokemon?.calcdexId || !CalcdexPlayerKeys.includes(playerKey)) {
    return pokemon;
  }

  const output: CalcdexPokemon = { ...pokemon };
  const prevKey = detectPlayerKeyFromPokemon(output);

  output.playerKey = playerKey;
  output.calcdexId = calcPokemonCalcdexId(output, playerKey);
  output.searchid = (!userSourced && output.searchid?.replace(`${prevKey}:`, `${playerKey}:`)) || null;
  output.ident = !userSourced && output.ident?.includes(output.speciesForme?.split('-')[0])
    ? output.ident.replace(`${prevKey}:`, `${playerKey}:`)
    : `${playerKey}: ${output.calcdexId.slice(-7)}`;

  if (!userSourced) {
    return output;
  }

  output.source = 'user';
  output.details = null;
  output.searchid = null;
  output.active = false;

  // clear any battle-reported properties, if any
  if (output.transformedForme) {
    output.transformedForme = null;
    output.transformedLevel = null;
    output.transformedAbilities = [];
    output.transformedBaseStats = null;
    output.transformedMoves = [];
  }

  if (output.teraType) {
    output.dirtyTeraType = output.teraType;
    output.teraType = null;
  }

  if (output.hp !== output.maxhp) {
    output.dirtyHp = output.hp;
    output.hp = output.maxhp;
  }

  if (output.status) {
    output.dirtyStatus = output.status;
    output.status = null;
  }

  if (output.ability) {
    output.dirtyAbility = output.ability;
    output.ability = null;
  }

  if (output.boostedStat) {
    output.dirtyBoostedStat = output.boostedStat;
    output.boostedStat = null;
  }

  if (output.prevItem || output.item) {
    output.dirtyItem = output.prevItem || output.item;
    output.item = null;
    output.itemEffect = null;
    output.prevItem = null;
    output.prevItemEffect = null;
  }

  if (output.faintCounter) {
    output.dirtyFaintCounter = output.faintCounter;
    output.faintCounter = 0;
  }

  output.moveTrack = [];
  output.revealedMoves = [];
  output.serverMoves = [];
  output.serverStats = null;
  output.volatiles = {};

  if (Object.values(output.boosts || {}).some((v) => !!v)) {
    // make shallow-copies first to avoid unintentionally mutating `pokemon` !!
    output.boosts = { ...output.boosts };
    output.dirtyBoosts = { ...output.dirtyBoosts };

    (Object.entries(output.boosts) as [stat: Showdown.StatNameNoHp, value: number][]).forEach(([
      stat,
      value,
    ]) => {
      output.dirtyBoosts[stat] = value || null;
      output.boosts[stat] = 0;
    });
  }

  return output;
};
