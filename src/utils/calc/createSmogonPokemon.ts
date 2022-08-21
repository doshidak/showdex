import { Pokemon as SmogonPokemon } from '@smogon/calc';
import { PokemonToggleAbilities } from '@showdex/consts';
import { detectPokemonIdent, detectSpeciesForme } from '@showdex/utils/battle';
import { logger } from '@showdex/utils/debug';
import type { Generation, MoveName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { calcPokemonHp } from './calcPokemonHp';

const l = logger('@showdex/utils/calc/createSmogonPokemon');

export const createSmogonPokemon = (
  dex: Generation,
  pokemon: CalcdexPokemon,
  moveName?: MoveName,
): SmogonPokemon => {
  // don't bother logging in this and the `ident` check below cause the Calcdex components
  // may get partial data (or even nothing) in the beginning, so these logs would get pretty spammy
  if (typeof dex?.num !== 'number' || dex.num < 1) {
    return null;
  }

  const ident = detectPokemonIdent(pokemon);

  if (!ident) {
    return null;
  }

  // optional chaining here since `item` can be cleared by the user (dirtyItem) in PokeInfo
  // (note: when cleared, `dirtyItem` will be set to null, which will default to `item`)
  const item = pokemon?.dirtyItem ?? pokemon?.item;

  const speciesForme = SmogonPokemon.getForme(
    dex,
    detectSpeciesForme(pokemon),
    item,
    moveName,
  );

  // shouldn't happen, but just in case, ja feel
  if (!speciesForme) {
    if (__DEV__) {
      l.warn(
        'Failed to detect speciesForme from Pokemon with ident', ident,
        '\n', 'speciesForme', speciesForme,
        '\n', 'gen', dex.num,
        '\n', 'pokemon', pokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  // not using optional chaining here since ability cannot be cleared in PokeInfo
  const ability = pokemon.dirtyAbility || pokemon.ability;

  // note: Multiscale is in the PokemonToggleAbilities list, but isn't technically toggleable, per se.
  // we only allow it to be toggled on/off since it works like a Focus Sash (i.e., depends on the Pokemon's HP).
  // (to calculate() of `smogon/calc`, it'll have no idea since we'll be passing no ability if toggled off)
  const hasMultiscale = ability?.toLowerCase?.() === 'multiscale';
  const toggleAbility = !hasMultiscale && PokemonToggleAbilities.includes(ability);

  const options: ConstructorParameters<typeof SmogonPokemon>[2] = {
    // note: curHP and originalCurHP in the SmogonPokemon's constructor both set the originalCurHP
    // of the class instance with curHP's value taking precedence over originalCurHP's value
    // (in other words, seems safe to specify either one, but if none, defaults to rawStats.hp)
    // ---
    // also note: seems that maxhp is internally calculated in the instance's rawStats.hp,
    // so we can't specify it here
    curHP: pokemon.serverSourced ? pokemon.hp : (() => { // js wizardry
      // note that spreadStats may not be available yet, hence the fallback object
      const hpPercentage = calcPokemonHp(pokemon);
      const { hp: hpStat } = pokemon.spreadStats || { hp: pokemon?.maxhp || 1 };

      // cheeky way to allow the user to "turn off" Multiscale w/o editing the HP value
      // (if true, we'll tell the Smogon calc that it's at 99% HP)
      // (also, the ability toggle button in PokeInfo will disable if the HP isn't 100%)
      const shouldMultiscale = hasMultiscale && hpPercentage === 1 && !pokemon?.abilityToggled;

      // if the Pokemon fainted, assume it has full HP as to not break the damage calc
      return (shouldMultiscale ? 0.99 : hpPercentage || 1) * hpStat;
    })(),

    level: pokemon.level,
    gender: pokemon.gender,

    // appears that the SmogonPokemon will automatically double both the HP and max HP if this is true,
    // which I'd imagine affects the damage calculations in the matchup
    // (useUltimateMoves is a gen-agnostic property that's user-toggleable and syncs w/ the battle state btw)
    isDynamaxed: pokemon.useUltimateMoves,

    ability,
    abilityOn: toggleAbility ? pokemon.abilityToggled : undefined,
    item: pokemon.dirtyItem || pokemon.item,
    nature: pokemon.nature,
    moves: pokemon.moves,

    ivs: {
      hp: pokemon.ivs?.hp ?? 31,
      atk: pokemon.ivs?.atk ?? 31,
      def: pokemon.ivs?.def ?? 31,
      spa: pokemon.ivs?.spa ?? 31,
      spd: pokemon.ivs?.spd ?? 31,
      spe: pokemon.ivs?.spe ?? 31,
    },

    evs: {
      hp: pokemon.evs?.hp ?? 0,
      atk: pokemon.evs?.atk ?? 0,
      def: pokemon.evs?.def ?? 0,
      spa: pokemon.evs?.spa ?? 0,
      spd: pokemon.evs?.spd ?? 0,
      spe: pokemon.evs?.spe ?? 0,
    },

    boosts: {
      atk: pokemon.dirtyBoosts?.atk ?? pokemon.boosts?.atk ?? 0,
      def: pokemon.dirtyBoosts?.def ?? pokemon.boosts?.def ?? 0,
      spa: pokemon.dirtyBoosts?.spa ?? pokemon.boosts?.spa ?? 0,
      spd: pokemon.dirtyBoosts?.spd ?? pokemon.boosts?.spd ?? 0,
      spe: pokemon.dirtyBoosts?.spe ?? pokemon.boosts?.spe ?? 0,
    },
  };

  return new SmogonPokemon(
    dex,
    speciesForme,
    options,
  );
};
