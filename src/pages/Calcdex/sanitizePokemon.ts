import type { CalcdexPokemon } from './CalcdexReducer';
import { calcPokemonCalcdexId } from './calcCalcdexId';
import { calcPokemonCalcdexNonce } from './calcCalcdexNonce';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';
// import { detectToggledAbility } from './detectToggledAbility';
import { sanitizeSpeciesForme } from './sanitizeSpeciesForme';

export const sanitizePokemon = (
  pokemon: Partial<Showdown.Pokemon & CalcdexPokemon>,
): CalcdexPokemon => {
  const sanitizedPokemon: CalcdexPokemon = {
    calcdexId: pokemon?.calcdexId,
    calcdexNonce: pokemon?.calcdexNonce,

    ident: detectPokemonIdent(pokemon),
    searchid: pokemon?.searchid,
    speciesForme: pokemon?.speciesForme ?
      sanitizeSpeciesForme(pokemon.speciesForme) :
      detectSpeciesForme(pokemon),
    rawSpeciesForme: pokemon?.speciesForme,

    name: pokemon?.name,
    details: pokemon?.details,
    level: pokemon?.level || 0,
    gender: pokemon?.gender,

    types: pokemon?.types ?? [],

    ability: pokemon?.ability,
    dirtyAbility: pokemon?.dirtyAbility ?? null,
    abilityToggled: pokemon?.abilityToggled ?? false,
    baseAbility: pokemon?.baseAbility,
    abilities: pokemon?.abilities ?? [],
    altAbilities: pokemon?.altAbilities ?? [],

    item: pokemon?.item,
    dirtyItem: pokemon?.dirtyItem ?? null,
    altItems: pokemon?.altItems ?? [],
    itemEffect: pokemon?.itemEffect,
    prevItem: pokemon?.prevItem,
    prevItemEffect: pokemon?.prevItemEffect,

    nature: pokemon?.nature,

    ivs: {
      hp: pokemon?.ivs?.hp ?? 31,
      atk: pokemon?.ivs?.atk ?? 31,
      def: pokemon?.ivs?.def ?? 31,
      spa: pokemon?.ivs?.spa ?? 31,
      spd: pokemon?.ivs?.spd ?? 31,
      spe: pokemon?.ivs?.spe ?? 31,
    },

    evs: {
      hp: pokemon?.evs?.hp ?? 0,
      atk: pokemon?.evs?.atk ?? 0,
      def: pokemon?.evs?.def ?? 0,
      spa: pokemon?.evs?.spa ?? 0,
      spd: pokemon?.evs?.spd ?? 0,
      spe: pokemon?.evs?.spe ?? 0,
    },

    boosts: {
      atk: typeof pokemon?.boosts?.atk === 'number' ? pokemon.boosts.atk : 0,
      def: typeof pokemon?.boosts?.def === 'number' ? pokemon.boosts.def : 0,
      spa: typeof pokemon?.boosts?.spa === 'number' ? pokemon.boosts.spa : 0,
      spd: typeof pokemon?.boosts?.spd === 'number' ? pokemon.boosts.spd : 0,
      spe: typeof pokemon?.boosts?.spe === 'number' ? pokemon.boosts.spe : 0,
    },

    dirtyBoosts: {
      atk: pokemon?.dirtyBoosts?.atk,
      def: pokemon?.dirtyBoosts?.def,
      spa: pokemon?.dirtyBoosts?.spa,
      spd: pokemon?.dirtyBoosts?.spd,
      spe: pokemon?.dirtyBoosts?.spe,
    },

    status: pokemon?.status,
    statusData: {
      sleepTurns: pokemon?.statusData?.sleepTurns || 0,
      toxicTurns: pokemon?.statusData?.toxicTurns || 0,
    },

    volatiles: pokemon?.volatiles,
    turnstatuses: pokemon?.turnstatuses,
    toxicCounter: pokemon?.statusData?.toxicTurns,

    hp: pokemon?.hp || 0,
    maxhp: pokemon?.maxhp || 1,
    fainted: pokemon?.fainted || !pokemon?.hp,

    moves: pokemon?.moves || [],
    altMoves: pokemon?.altMoves || [],
    useUltimateMoves: pokemon?.useUltimateMoves ?? false,
    lastMove: pokemon?.lastMove,
    moveTrack: pokemon?.moveTrack || [],
    moveState: {
      revealed: pokemon?.moveState?.revealed ?? [],
      learnset: pokemon?.moveState?.learnset ?? [],
      other: pokemon?.moveState?.other ?? [],
    },

    criticalHit: pokemon?.criticalHit ?? false,

    preset: pokemon?.preset,
    presets: pokemon?.presets ?? [],
    autoPreset: pokemon?.autoPreset ?? true,
  };

  const calcdexId = calcPokemonCalcdexId(sanitizedPokemon);

  if (!sanitizedPokemon?.calcdexId) {
    sanitizedPokemon.calcdexId = calcdexId;
  }

  sanitizedPokemon.calcdexNonce = calcPokemonCalcdexNonce(sanitizedPokemon);

  return sanitizedPokemon;
};
