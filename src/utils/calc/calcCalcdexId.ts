import { NIL as NIL_UUID, v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { type CalcdexPlayerKey, type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { detectPlayerKeyFromPokemon } from '@showdex/utils/battle';
import { dedupeArray, env, nonEmptyObject } from '@showdex/utils/core';

/* eslint-disable @typescript-eslint/indent */

export const serializePayload = <T>(
  payload: T,
): string => Object.entries(payload || {})
  .map(([key, value]) => `${key}:${(typeof value === 'object' ? JSON.stringify(value) : String(value)) ?? '???'}`)
  .join('|');

/* eslint-enable @typescript-eslint/indent */

/**
 * Calculatingly calculates the Calcdex ID from the calculated checksum of the calculated serialized payload.
 *
 * * Primary difference between a `calcdexId` & `calcdexNonce` is that the latter (`calcdexNonce`) includes values
 *   that are potentially mutable, such as a Pokemon's `hp` value.
 *
 * @since 0.1.0
 */
export const calcCalcdexId = <T>(payload: T): string => {
  const serialized = nonEmptyObject(payload)
    ? serializePayload<T>(payload)
    : ['string', 'number', 'boolean'].includes(typeof payload)
      ? String(payload)
      : null;

  if (!serialized) {
    return null;
  }

  return uuidv5(
    serialized?.replace(/[^A-Z0-9\x20~`!@#$%^&*()+\-_=\[\]{}<>\|:;,\.'"\/\\]/gi, ''),
    env('uuid-namespace', NIL_UUID),
  );
};

export const calcPresetCalcdexId = (
  preset: CalcdexPokemonPreset,
): string => calcCalcdexId<Partial<Record<keyof CalcdexPokemonPreset, string>>>({
  // name: preset?.name,
  source: preset?.source,
  format: preset?.format,
  gen: String(preset?.gen),
  speciesForme: preset?.speciesForme,
  level: String(preset?.level || 100),
  // shiny: String(!!preset?.shiny),
  ability: dedupeArray([preset?.ability, ...(preset?.altAbilities || [])]).sort().join(','),
  nature: preset?.nature,
  item: dedupeArray([preset?.item, ...(preset?.altItems || [])]).sort().join(','),
  // update (2023/10/11): HOLY FUCKKKKKKKKK the mystery of the sorting moves[] has been solved !!
  moves: dedupeArray([...(preset?.moves || []), ...(preset?.altMoves || [])]).sort().join(','),
  ivs: calcCalcdexId<Showdown.StatsTable>(preset?.ivs),
  evs: calcCalcdexId<Showdown.StatsTable>(preset?.evs),
  // happiness: String(preset?.happiness),
  // pokeball: preset?.pokeball,
  // hiddenPowerType: preset?.hiddenPowerType,
  // dynamaxLevel: String(preset?.dynamaxLevel),
  // gigantamax: String(!!preset?.gigantamax),
  teraTypes: [...(preset?.teraTypes || [])].sort().join(','),
});

/* eslint-disable @typescript-eslint/indent */

/**
 * Generates a unique ID used by the Calcdex to track Pokemon.
 *
 * * As part of the new IDing mechanism introduced in v1.0.3, since the resulting ID will be attached to the `Showdown.Pokemon`,
 *   `Showdown.ServerPokemon` (if applicable) & `CalcdexPokemon`, we don't really care about consistently recreating the ID,
 *   as long as it's guaranteed unique per call.
 *   - Hence the use of `uuidv4()`, which is random.
 *   - Note (2023/07/26): Holy... what a run-on from me a year ago LOL.
 *
 * @since 0.1.0
 */
export const calcPokemonCalcdexId = <
  TPokemon extends Partial<Showdown.PokemonDetails>,
>(
  pokemon: TPokemon,
  playerKey?: CalcdexPlayerKey,
): string => calcCalcdexId<Partial<Record<keyof CalcdexPokemon, string>>>({
  // ident: pokemon?.ident,

  // ident: [
  //   playerKey || detectPlayerKeyFromPokemon(pokemon),
  //   // pokemon?.name?.replace(/-.+$/, ''), // 'Ho-Oh' -> 'Ho' ? LOL
  //   // 'slot' in pokemon && typeof pokemon.slot === 'number' && pokemon.slot > -1
  //   //   ? String(pokemon.slot)
  //   //   : pokemon?.speciesForme?.replace(/-.+$/, ''),
  //   pokemon?.speciesForme && getDexForFormat()?.species.get(pokemon.speciesForme)?.baseForme,
  // ].filter(Boolean).join(': '),

  ident: [
    playerKey || (pokemon as CalcdexPokemon)?.playerKey || detectPlayerKeyFromPokemon(pokemon),
    uuidv4(), // random
  ].filter(Boolean).join(': '),

  speciesForme: pokemon?.speciesForme,
  level: String(pokemon?.level ?? 100),
  gender: pokemon?.gender || 'N', // seems like 'N'-gendered Pokemon occasionally report back with an empty string
});

/* eslint-enable @typescript-eslint/indent */

export const calcSideCalcdexId = (
  side: Partial<Showdown.Side>,
): string => calcCalcdexId<Partial<Record<keyof Showdown.Side, string>>>({
  id: side?.id,
  sideid: side?.sideid,
  name: side?.name,
  rating: side?.rating,
});

export const calcBattleCalcdexId = (
  battle: Partial<Showdown.Battle>,
): string => calcCalcdexId<Partial<Record<keyof Showdown.Battle, string>>>({
  id: battle?.id,
  gen: battle?.gen?.toString(),
  tier: battle?.tier,
  gameType: battle?.gameType,
  mySide: calcSideCalcdexId(battle?.mySide),
  nearSide: calcSideCalcdexId(battle?.nearSide),
  p1: calcSideCalcdexId(battle?.p1),
  p2: calcSideCalcdexId(battle?.p2),
  p3: calcSideCalcdexId(battle?.p3),
  p4: calcSideCalcdexId(battle?.p4),
});
