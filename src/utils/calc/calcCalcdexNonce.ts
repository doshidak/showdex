import { NIL as NIL_UUID, v5 as uuidv5 } from 'uuid';
import { env } from '@showdex/utils/core';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { calcCalcdexId } from './calcCalcdexId';

export const calcPokemonCalcdexNonce = (
  pokemon: Partial<Showdown.Pokemon & CalcdexPokemon>,
): string => calcCalcdexId<Partial<Record<keyof CalcdexPokemon, string>>>({
  ident: pokemon?.ident,
  name: pokemon?.name,
  speciesForme: pokemon?.speciesForme,
  rawSpeciesForme: pokemon?.rawSpeciesForme ?? pokemon?.speciesForme,
  hp: pokemon?.hp?.toString(),
  maxhp: pokemon?.maxhp?.toString(),
  level: pokemon?.level?.toString(),
  gender: pokemon?.gender,
  ability: pokemon?.ability,
  dirtyAbility: pokemon?.dirtyAbility,
  abilityToggled: pokemon?.abilityToggled?.toString(),
  baseAbility: pokemon?.baseAbility,
  altAbilities: pokemon?.altAbilities?.join('|'),
  nature: pokemon?.nature,
  types: pokemon?.types?.join('|'),
  item: pokemon?.item,
  dirtyItem: pokemon?.dirtyItem,
  altItems: pokemon?.altItems?.join('|'),
  itemEffect: pokemon?.itemEffect,
  prevItem: pokemon?.prevItem,
  prevItemEffect: pokemon?.prevItemEffect,
  ivs: calcCalcdexId<Partial<CalcdexPokemon['ivs']>>(pokemon?.ivs),
  evs: calcCalcdexId<Partial<CalcdexPokemon['evs']>>(pokemon?.evs),
  status: pokemon?.status,
  statusData: calcCalcdexId<Partial<CalcdexPokemon['statusData']>>(pokemon?.statusData),
  statusStage: pokemon?.statusStage?.toString(),
  volatiles: calcCalcdexId<Partial<Showdown.Pokemon['volatiles']>>(pokemon?.volatiles),
  turnstatuses: calcCalcdexId<Partial<Showdown.Pokemon['turnstatuses']>>(pokemon?.turnstatuses),
  toxicCounter: pokemon?.toxicCounter?.toString(),
  moves: pokemon?.moves?.join('|'),
  altMoves: pokemon?.altMoves?.join('|'),
  useUltimateMoves: pokemon?.useUltimateMoves?.toString(),
  moveTrack: calcCalcdexId<Partial<Record<string, number>>>(pokemon?.moveTrack?.reduce((prev, track) => {
    if (track?.[0] && !(track[0] in prev)) {
      prev[track[0]] = track[1]; // eslint-disable-line prefer-destructuring
    }

    return prev;
  }, <Partial<Record<string, number>>>{})),
  moveState: calcCalcdexId<Partial<CalcdexPokemon['moveState']>>(pokemon?.moveState),
  boosts: calcCalcdexId<Partial<Showdown.Pokemon['boosts']>>(pokemon?.boosts),
  dirtyBoosts: calcCalcdexId<Partial<CalcdexPokemon['dirtyBoosts']>>(pokemon?.dirtyBoosts),
  baseStats: calcCalcdexId<Partial<CalcdexPokemon['baseStats']>>(pokemon?.baseStats),
  calculatedStats: calcCalcdexId<Partial<CalcdexPokemon['calculatedStats']>>(pokemon?.calculatedStats),
  criticalHit: pokemon?.criticalHit?.toString(),
  preset: pokemon?.preset,
  presets: pokemon?.presets?.map((p) => p?.calcdexId || p?.name).join('|'),
  autoPreset: pokemon?.autoPreset?.toString(),
});

export const calcSideCalcdexNonce = (
  side: Partial<Showdown.Side>,
): string => calcCalcdexId<Partial<Record<keyof Showdown.Side, string>>>({
  id: side?.id,
  sideid: side?.sideid,
  name: side?.name,
  rating: side?.rating,
  totalPokemon: side?.totalPokemon?.toString(),
  active: side?.active?.map((mon) => calcPokemonCalcdexNonce(<CalcdexPokemon> (<unknown> mon))).join('|'), // TypeScript can't infer that string[] is the same as MoveName[] (of type string[])
  pokemon: side?.pokemon?.map((mon) => calcPokemonCalcdexNonce(<CalcdexPokemon> (<unknown> mon))).join('|'), // once you think you're good, naw, AbilityName is NOT the same thing as string, even tho it's a string. fantastic!
  sideConditions: Object.keys(side?.sideConditions || {}).join('|'),
});

export const calcBattleCalcdexNonce = (
  battle: Partial<Showdown.Battle>,
): string => calcCalcdexId<Partial<Record<keyof Showdown.Battle, string>>>({
  id: battle?.id,
  gen: battle?.gen?.toString(),
  tier: battle?.tier,
  gameType: battle?.gameType,
  mySide: calcSideCalcdexNonce(battle?.mySide),
  nearSide: calcSideCalcdexNonce(battle?.nearSide),
  p1: calcSideCalcdexNonce(battle?.p1),
  p2: calcSideCalcdexNonce(battle?.p2),
  p3: calcSideCalcdexNonce(battle?.p3),
  p4: calcSideCalcdexNonce(battle?.p4),
  currentStep: battle?.currentStep?.toString(),
  stepQueue: Array.isArray(battle?.stepQueue) && battle.stepQueue.length ?
    uuidv5(battle.stepQueue.join('|'), env('uuid-namespace', NIL_UUID)) :
    null,
});
