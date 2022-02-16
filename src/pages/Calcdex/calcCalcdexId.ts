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
  name: pokemon?.name,
  // speciesForme: pokemon?.speciesForme,
  // hp: pokemon?.hp?.toString(),
  // maxhp: pokemon?.maxhp?.toString(),
  level: pokemon?.level?.toString(),
  gender: pokemon?.gender,
  // ability: pokemon?.ability,
  // baseAbility: pokemon?.baseAbility || pokemon?.ability,
  // item: pokemon?.item,
  // itemEffect: pokemon?.itemEffect,
  // prevItem: pokemon?.prevItem,
  // prevItemEffect: pokemon?.prevItemEffect,
  // boosts: calcCalcdexId<Partial<Showdown.Pokemon['boosts']>>(pokemon?.boosts),
  // status: pokemon?.status,
  // statusStage: pokemon?.statusStage?.toString(),
  // volatiles: calcCalcdexId<Partial<Showdown.Pokemon['volatiles']>>(pokemon?.volatiles),
  // moveTrack: calcCalcdexId<Partial<Record<string, number>>>(pokemon?.moveTrack?.reduce((prev, track) => {
  //   if (track?.[0] && !(track[0] in prev)) {
  //     prev[track[0]] = track[1]; // eslint-disable-line prefer-destructuring
  //   }
  //
  //   return prev;
  // }, <Partial<Record<string, number>>>{})),
});

export const calcSideCalcdexId = (
  side: Partial<Showdown.Side>,
): string => calcCalcdexId<Partial<Record<keyof Showdown.Side, string>>>({
  id: side?.id,
  sideid: side?.sideid,
  name: side?.name,
  rating: side?.rating,
  // totalPokemon: side?.totalPokemon?.toString(),
  // active: side?.active?.map((mon) => calcPokemonCalcdexId(mon)).join('|'),
  // pokemon: side?.pokemon?.map((mon) => calcPokemonCalcdexId(mon)).join('|'),
  // sideConditions: Object.keys(side?.sideConditions || {}).join('|'),
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
  // currentStep: battle?.currentStep?.toString(),
  // stepQueue: Array.isArray(battle?.stepQueue) && battle.stepQueue.length ?
  //   uuidv5(battle.stepQueue.join('|'), process.env.UUID_NAMESPACE || NIL_UUID) :
  //   null,
});
