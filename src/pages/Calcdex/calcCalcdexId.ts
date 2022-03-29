import { NIL as NIL_UUID, v5 as uuidv5 } from 'uuid';
import type { CalcdexPokemon, CalcdexPokemonPreset } from './CalcdexReducer';

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

  return uuidv5(serialized, process.env.UUID_NAMESPACE || NIL_UUID);
};

export const calcPresetCalcdexId = (
  preset: CalcdexPokemonPreset,
): string => calcCalcdexId<Partial<Record<keyof CalcdexPokemonPreset, string>>>({
  name: preset?.name,
  species: preset?.species,
  level: preset?.level?.toString(),
  shiny: preset?.shiny?.toString(),
  ability: preset?.ability,
  item: preset?.item,
  moves: preset?.moves?.join(','),
  nature: preset?.nature,
  ivs: calcCalcdexId<Partial<Showdown.StatsTable>>(preset?.ivs),
  evs: calcCalcdexId<Partial<Showdown.StatsTable>>(preset?.evs),
  happiness: preset?.happiness?.toString(),
  pokeball: preset?.pokeball,
  hpType: preset?.hpType,
  gigantamax: preset?.gigantamax?.toString(),
});

export const calcPokemonCalcdexId = (
  pokemon: Partial<Showdown.Pokemon>,
): string => calcCalcdexId<Partial<Record<keyof CalcdexPokemon, string>>>({
  ident: pokemon?.ident,
  // name: pokemon?.name,
  level: pokemon?.level?.toString(),
  gender: pokemon?.gender,
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
