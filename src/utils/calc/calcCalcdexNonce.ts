import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { sanitizeVolatiles } from '@showdex/utils/battle';
import { nonEmptyObject } from '@showdex/utils/core';
import { calcCalcdexId } from './calcCalcdexId';

/**
 * Calculates the nonce of a `Showdown.Pokemon` object,
 * used to determine changes in the `battle` state.
 *
 * * As of v0.1.3, `calcdexNonce` of `CalcdexPokemon` is deprecated.
 *   - Since this is used in `calcBattleCalcdexNonce()`, which is still being used,
 *     this function is not deprecated.
 *   - However, this function is no longer exported.
 *
 * @since 0.1.0
 */
const calcPokemonCalcdexNonce = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon>,
): string => calcCalcdexId<Partial<Record<keyof CalcdexPokemon, string>>>({
  ident: pokemon?.ident,
  name: pokemon?.name,
  speciesForme: pokemon?.speciesForme,
  hp: pokemon?.hp?.toString(),
  dirtyHp: (pokemon as CalcdexPokemon)?.dirtyHp?.toString(),
  maxhp: pokemon?.maxhp?.toString(),
  level: pokemon?.level?.toString(),
  gender: pokemon?.gender,
  ability: pokemon?.ability,
  dirtyAbility: (!!pokemon?.speciesForme && 'dirtyAbility' in pokemon && pokemon.dirtyAbility) || null,
  // altAbilities: (!!pokemon?.speciesForme && 'altAbilities' in pokemon && flattenAlts(pokemon.altAbilities)?.join(';')) || null,
  // abilityToggled: (!!pokemon?.speciesForme && 'abilityToggled' in pokemon && pokemon.abilityToggled.toString()) || null,
  baseAbility: pokemon?.baseAbility,
  // altAbilities: (!!pokemon?.speciesForme && 'altAbilities' in pokemon && pokemon.altAbilities?.join(';')) || null,
  nature: (!!pokemon?.speciesForme && 'nature' in pokemon && pokemon.nature) || null,
  types: (!!pokemon?.speciesForme && 'types' in pokemon && pokemon.types?.join('|')) || null,
  teraType: (!!pokemon?.speciesForme && 'teraType' in pokemon && pokemon.teraType)
    || (typeof pokemon?.terastallized === 'string' && pokemon.terastallized)
    || null,
  dirtyTeraType: (!!pokemon?.speciesForme && 'dirtyTeraType' in pokemon && pokemon.dirtyTeraType) || null,
  item: pokemon?.item,
  dirtyItem: (!!pokemon?.speciesForme && 'dirtyItem' in pokemon && pokemon.dirtyItem) || null,
  // altItems: (!!pokemon?.speciesForme && 'altItems' in pokemon && flattenAlts(pokemon.altItems)?.join(';')) || null,
  itemEffect: pokemon?.itemEffect,
  prevItem: pokemon?.prevItem,
  prevItemEffect: pokemon?.prevItemEffect,
  ivs: (!!pokemon?.speciesForme && 'ivs' in pokemon && calcCalcdexId(pokemon.ivs)) || null,
  evs: (!!pokemon?.speciesForme && 'evs' in pokemon && calcCalcdexId(pokemon.evs)) || null,
  status: pokemon?.status,
  dirtyStatus: (pokemon as CalcdexPokemon)?.dirtyStatus,
  statusData: calcCalcdexId(pokemon?.statusData),
  statusStage: pokemon?.statusStage?.toString(),
  volatiles: calcCalcdexId(sanitizeVolatiles(pokemon)),
  turnstatuses: calcCalcdexId(pokemon?.turnstatuses),
  sleepCounter: (!!pokemon?.speciesForme && 'sleepCounter' in pokemon && pokemon.sleepCounter?.toString())
    || (nonEmptyObject(pokemon?.statusData) && pokemon.statusData.sleepTurns?.toString())
    || null,
  toxicCounter: (!!pokemon?.speciesForme && 'toxicCounter' in pokemon && pokemon.toxicCounter?.toString())
    || (nonEmptyObject(pokemon?.statusData) && pokemon.statusData.toxicTurns?.toString())
    || null,
  hitCounter: (!!pokemon?.speciesForme && 'hitCounter' in pokemon && pokemon.hitCounter?.toString())
    || (!!pokemon?.speciesForme && 'timesAttacked' in pokemon && pokemon.timesAttacked?.toString())
    || null,
  faintCounter: (!!pokemon?.speciesForme && 'faintCounter' in pokemon && pokemon.faintCounter?.toString()) || null,
  dirtyFaintCounter: (!!pokemon?.speciesForme && 'dirtyFaintCounter' in pokemon && pokemon.dirtyFaintCounter?.toString()) || null,
  moves: pokemon?.moves?.join(';'),
  // altMoves: (!!pokemon?.speciesForme && 'altMoves' in pokemon && flattenAlts(pokemon.altMoves)?.join(';')) || null,
  moveTrack: calcCalcdexId((pokemon?.moveTrack as CalcdexPokemon['moveTrack'])?.map((t) => t?.join(':'))?.join(';')),
  // moveState: calcCalcdexId<Partial<CalcdexPokemon['moveState']>>(pokemon?.moveState),
  revealedMoves: (!!pokemon?.speciesForme && 'revealedMoves' in pokemon && calcCalcdexId(pokemon.revealedMoves)) || null,
  boosts: calcCalcdexId(pokemon?.boosts),
  dirtyBoosts: (!!pokemon?.speciesForme && 'dirtyBoosts' in pokemon && calcCalcdexId(pokemon.dirtyBoosts)) || null,
  baseStats: (!!pokemon?.speciesForme && 'baseStats' in pokemon && calcCalcdexId(pokemon.baseStats)) || null,
  dirtyBaseStats: (!!pokemon?.speciesForme && 'dirtyBaseStats' in pokemon && calcCalcdexId(pokemon.dirtyBaseStats)) || null,
  spreadStats: (!!pokemon?.speciesForme && 'spreadStats' in pokemon && calcCalcdexId(pokemon.spreadStats)) || null,
  criticalHit: (!!pokemon?.speciesForme && 'criticalHit' in pokemon && pokemon.criticalHit?.toString()) || null,
  // presetId: pokemon?.presetId,
  // presets: pokemon?.presets?.map((p) => p?.calcdexId || p?.name).join('|'),
});

/**
 * Calculates the nonce of a `Showdown.Side` object,
 * used to determine changes in the `battle` state.
 *
 * * As of v0.1.3, `calcdexNonce` of `CalcdexPlayerSide` is deprecated.
 *   - Since this is used in `calcBattleCalcdexNonce()`, which is still being used,
 *     this function is not deprecated.
 *   - However, this function is no longer exported.
 *
 * @since 0.1.0
 */
const calcSideCalcdexNonce = (
  side: Partial<Showdown.Side>,
): string => calcCalcdexId<Partial<Record<keyof Showdown.Side, string>>>({
  id: side?.id,
  sideid: side?.sideid,
  name: side?.name,
  rating: side?.rating,
  totalPokemon: side?.totalPokemon?.toString(),
  active: side?.active?.map((mon) => calcPokemonCalcdexNonce(mon as unknown as CalcdexPokemon)).join(';'), // TypeScript can't infer that string[] is the same as MoveName[] (of type string[])
  pokemon: side?.pokemon?.map((mon) => calcPokemonCalcdexNonce(mon as unknown as CalcdexPokemon)).join(';'), // once you think you're good, naw, AbilityName is NOT the same thing as string, even tho it's a string. fantastic!
  sideConditions: Object.keys(side?.sideConditions || {}).join(';'),
});

/**
 * Calculates the nonce of the battle state.
 *
 * @todo Would probably be more performant to read from the `stepQueue`,
 *   but make sure doing so doesn't prevent any updates.
 * @since 0.1.0
 */
export const calcBattleCalcdexNonce = (
  battle: Partial<Showdown.Battle>,
  request?: Partial<Showdown.BattleRequest>,
): string => {
  // inactive timeout messages may interfere with the activeIndex currently set by the user
  // excludes steps: '|inactive|', '|inactiveoff|', '|-message|' '|c|' (chat), '|j|' (join), and '|l|' (leave)
  // includes steps: '|c| <username>|/raw <html>' (response stepQueue from the !showteam chat command)
  const stepQueue = battle?.stepQueue
    ?.filter?.((q) => !!q && !/^\|(?:inactive|-message|c(?!.+\|\/raw)|j|l|player)/i.test(q))
    || [];

  return calcCalcdexId<Partial<Record<(keyof Showdown.Battle) | (keyof Showdown.BattleRequest), string>>>({
    id: battle?.id,
    gen: battle?.gen?.toString(),
    tier: battle?.tier,
    gameType: battle?.gameType,
    myPokemon: battle?.myPokemon?.length ? calcCalcdexId(
      battle.myPokemon.map((p) => calcPokemonCalcdexNonce(p as unknown as CalcdexPokemon)).join(';') || 'empty',
    ) : null,
    mySide: calcSideCalcdexNonce(battle?.mySide),
    nearSide: calcSideCalcdexNonce(battle?.nearSide),
    p1: calcSideCalcdexNonce(battle?.p1),
    p2: calcSideCalcdexNonce(battle?.p2),
    p3: calcSideCalcdexNonce(battle?.p3),
    p4: calcSideCalcdexNonce(battle?.p4),
    // currentStep: battle?.currentStep?.toString(),
    stepQueue: calcCalcdexId(stepQueue.join(';')),
    rqid: request?.rqid?.toString(),
    requestType: request?.requestType,
    side: [
      request?.side?.id,
      (request as Showdown.BattleMoveRequest)?.active?.map((a) => a?.maxMoves?.gigantamax)?.join('|'),
    ].filter(Boolean).join(': '),
  });
};
