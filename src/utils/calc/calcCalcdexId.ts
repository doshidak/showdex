import { NIL as NIL_UUID, v5 as uuidv5 } from 'uuid';
import { env } from '@showdex/utils/core';
import { detectPlayerKeyFromPokemon } from '@showdex/utils/battle';
import type { CalcdexPokemon, CalcdexPokemonPreset } from '@showdex/redux/store';

export const serializePayload = <T>(payload: T): string => Object.entries(payload || {})
  .map(([key, value]) => `${key}:${value?.toString?.() ?? 'undefined'}`)
  .join('|');

/**
 * Calculatingly calculates the Calcdex ID from the calculated checksum
 * of the calculated serialized payload.
 *
 * * Primary difference between a `calcdexId` and `calcdexNonce` is that
 *   the latter (`calcdexNonce`) includes values that are potentially mutable,
 *   such as a Pokemon's `hp` value.
 *
 * @since 0.1.0
 */
export const calcCalcdexId = <T>(payload: T): string => {
  const serialized = Object.keys(payload || {}).length ?
    serializePayload<T>(payload) :
    null;

  if (!serialized) {
    return null;
  }

  return uuidv5(serialized, env('uuid-namespace', NIL_UUID));
};

export const calcPresetCalcdexId = (
  preset: CalcdexPokemonPreset,
): string => calcCalcdexId<Partial<Record<keyof CalcdexPokemonPreset, string>>>({
  name: preset?.name,
  gen: String(preset?.gen),
  format: preset?.format,
  speciesForme: preset?.speciesForme,
  level: String(preset?.level),
  // shiny: String(preset?.shiny),
  // ability: preset?.ability,
  // altAbilities: preset?.altAbilities?.join(','),
  // nature: preset?.nature,
  // item: preset?.item,
  // altItems: preset?.altItems?.join(','),
  // moves: preset?.moves?.join(','),
  // altMoves: preset?.moves?.join(','),
  // ivs: calcCalcdexId<Showdown.StatsTable>(preset?.ivs),
  // evs: calcCalcdexId<Showdown.StatsTable>(preset?.evs),
  // happiness: String(preset?.happiness),
  // pokeball: preset?.pokeball,
  // hpType: preset?.hpType,
  // gigantamax: String(preset?.gigantamax),
});

export const calcPokemonCalcdexId = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<Showdown.ServerPokemon & { slot: number; }> | DeepPartial<CalcdexPokemon> = {},
): string => calcCalcdexId<Partial<Record<keyof CalcdexPokemon, string>>>({
  // ident: pokemon?.ident,

  name: [
    detectPlayerKeyFromPokemon(pokemon),
    // pokemon?.name?.replace(/-.+$/, ''), // 'Ho-Oh' -> 'Ho' ? LOL
    'slot' in pokemon && typeof pokemon.slot === 'number' ?
      String(pokemon.slot) :
      pokemon?.speciesForme?.replace(/-.+$/, ''),
  ].filter(Boolean).join(': '),

  level: String(pokemon?.level ?? 100),
  gender: pokemon?.gender || 'N', // seems like 'N'-gendered Pokemon occasionally report back with an empty string
  // shiny: String(pokemon?.shiny), // bad idea, subject to change mid-battle
});

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
