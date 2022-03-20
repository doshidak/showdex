import { Pokemon as SmogonPokemon } from '@smogon/calc';
import { logger } from '@showdex/utils/debug';
import type { Generation } from '@pkmn/data';
import type { GenerationNum, State as SmogonState } from '@smogon/calc';
import type { CalcdexPokemon } from './CalcdexReducer';
import { calcPokemonHp } from './calcPokemonHp';
import { calcPokemonStats } from './calcPokemonStats';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';

const l = logger('Calcdex/createSmogonPokemon');

export const createSmogonPokemon = (
  gen: GenerationNum,
  dex: Generation,
  pokemon: CalcdexPokemon,
): SmogonPokemon => {
  if (typeof gen !== 'number' || gen < 1) {
    l.warn(
      'received an invalid gen value',
      '\n', 'gen', gen,
      '\n', 'pokemon', pokemon,
    );

    return null;
  }

  const ident = detectPokemonIdent(pokemon);

  if (!ident) {
    l.debug(
      'createSmogonPokemon() <- detectPokemonIdent()',
      '\n', 'failed to detect Pokemon\'s ident',
      '\n', 'ident', ident,
      '\n', 'gen', gen,
      '\n', 'pokemon', pokemon,
    );

    return null;
  }

  const speciesForme = detectSpeciesForme(pokemon);

  // shouldn't happen, but just in case, ja feel
  if (!speciesForme) {
    l.warn(
      'createSmogonPokemon() <- detectSpeciesForme()',
      '\n', 'failed to detect speciesForme from Pokemon with ident', ident,
      '\n', 'speciesForme', speciesForme,
      '\n', 'gen', gen,
      '\n', 'pokemon', pokemon,
    );

    return null;
  }

  const options: ConstructorParameters<typeof SmogonPokemon>[2] = {
    ...(<SmogonState.Pokemon> pokemon),
    ability: pokemon?.dirtyAbility ?? pokemon?.ability,
    item: pokemon?.dirtyItem ?? pokemon?.item,
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
      atk: pokemon?.dirtyBoosts?.atk ?? pokemon?.boosts?.atk ?? 0,
      def: pokemon?.dirtyBoosts?.def ?? pokemon?.boosts?.def ?? 0,
      spa: pokemon?.dirtyBoosts?.spa ?? pokemon?.boosts?.spa ?? 0,
      spd: pokemon?.dirtyBoosts?.spd ?? pokemon?.boosts?.spd ?? 0,
      spe: pokemon?.dirtyBoosts?.spe ?? pokemon?.boosts?.spe ?? 0,
    },
  };

  // calculate the Pokemon's current HP
  const calculatedStats = calcPokemonStats(dex, pokemon);

  if (typeof calculatedStats?.hp === 'number') {
    const currentHp = calcPokemonHp(pokemon);
    const { hp: hpStat } = calculatedStats;

    // if the Pokemon fainted, assume it has full HP as to not break the damage calc
    options.curHP = (currentHp || 1) * hpStat;
  }

  const smogonPokemon = new SmogonPokemon(
    gen,
    speciesForme,
    options,
  );

  return smogonPokemon;
};
