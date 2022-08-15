import { Pokemon as SmogonPokemon } from '@smogon/calc';
import { PokemonToggleAbilities } from '@showdex/consts';
import { detectPokemonIdent, detectSpeciesForme } from '@showdex/utils/battle';
import { logger } from '@showdex/utils/debug';
import type { Generation, MoveName } from '@pkmn/data';
import type { State as SmogonState } from '@smogon/calc';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { calcPokemonHp } from './calcPokemonHp';
// import { calcPokemonStats } from './calcPokemonStats';

const l = logger('@showdex/pages/Calcdex/createSmogonPokemon');

export const createSmogonPokemon = (
  dex: Generation,
  pokemon: CalcdexPokemon,
  moveName?: MoveName,
): SmogonPokemon => {
  if (typeof dex?.num !== 'number' || dex.num < 1) {
    // l.warn(
    //   'received an invalid gen value',
    //   '\n', 'gen', gen,
    //   '\n', 'pokemon', pokemon,
    // );

    return null;
  }

  const ident = detectPokemonIdent(pokemon);

  if (!ident) {
    // l.debug(
    //   'createSmogonPokemon() <- detectPokemonIdent()',
    //   '\n', 'failed to detect Pokemon\'s ident',
    //   '\n', 'ident', ident,
    //   '\n', 'gen', gen,
    //   '\n', 'pokemon', pokemon,
    // );

    return null;
  }

  const speciesForme = SmogonPokemon.getForme(
    dex,
    detectSpeciesForme(pokemon),
    pokemon?.dirtyItem || pokemon?.item,
    moveName,
  );

  // shouldn't happen, but just in case, ja feel
  if (!speciesForme) {
    l.warn(
      'createSmogonPokemon() <- detectSpeciesForme()',
      '\n', 'failed to detect speciesForme from Pokemon with ident', ident,
      '\n', 'speciesForme', speciesForme,
      '\n', 'gen', dex.num,
      '\n', 'pokemon', pokemon,
    );

    return null;
  }

  let ability = pokemon?.dirtyAbility ?? pokemon?.ability;

  // note: Multiscale is in the PokemonToggleAbilities list, but isn't technically toggleable, per se.
  // we only allow it to be toggled on/off since it works like a Focus Sash (i.e., depends on the Pokemon's HP).
  // (to calculate() of `smogon/calc`, it'll have no idea since we'll be passing no ability if toggled off)
  const hasMultiscale = ability?.toLowerCase?.() === 'multiscale';
  const toggleAbility = !hasMultiscale && PokemonToggleAbilities.includes(ability);

  if (hasMultiscale && !pokemon?.abilityToggled) {
    ability = null;
  }

  const options: ConstructorParameters<typeof SmogonPokemon>[2] = {
    ...(<SmogonState.Pokemon> pokemon),

    ability,
    abilityOn: toggleAbility ? pokemon?.abilityToggled : undefined,

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
  // const calculatedStats = calcPokemonStats(dex, pokemon);

  // if (typeof calculatedStats?.hp === 'number') {
  //   const currentHp = calcPokemonHp(pokemon);
  //   const { hp: hpStat } = calculatedStats;
  //
  //   // if the Pokemon fainted, assume it has full HP as to not break the damage calc
  //   options.curHP = (currentHp || 1) * hpStat;
  // }

  const smogonPokemon = new SmogonPokemon(
    dex,
    speciesForme,
    options,
  );

  if (typeof smogonPokemon?.rawStats?.hp === 'number') {
    const currentHp = calcPokemonHp(pokemon);
    const { hp: hpStat } = smogonPokemon.rawStats;

    // if the Pokemon fainted, assume it has full HP as to not break the damage calc
    smogonPokemon.originalCurHP = (currentHp || 1) * hpStat;
  }

  return smogonPokemon;
};
