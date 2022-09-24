import { Pokemon as SmogonPokemon } from '@smogon/calc';
import { formatId } from '@showdex/utils/app';
import { detectLegacyGen, hasMegaForme } from '@showdex/utils/battle';
import { logger } from '@showdex/utils/debug';
import type { Generation, GenerationNum, MoveName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { calcPokemonHp } from './calcPokemonHp';

export type SmogonPokemonOptions = ConstructorParameters<typeof SmogonPokemon>[2];
export type SmogonPokemonOverrides = SmogonPokemonOptions['overrides'];

const l = logger('@showdex/utils/calc/createSmogonPokemon');

/**
 * Factory that essentially converts a `CalcdexPokemon` into an instantiated `Pokemon` class from `@smogon/calc`.
 *
 * * This is basically the thing that "plugs-in" all the parameters for a Pokemon in the damage calculator.
 * * Includes special handling for situations such as legacy gens, mega items, and type changes.
 *
 * @since 0.1.0
 */
export const createSmogonPokemon = (
  dex: Generation,
  pokemon: CalcdexPokemon,
  moveName?: MoveName,
): SmogonPokemon => {
  // don't bother logging in this and the `ident` check below cause the Calcdex components
  // may get partial data (or even nothing) in the beginning, so these logs would get pretty spammy
  if (typeof dex?.num !== 'number' || dex.num < 1 || !pokemon?.calcdexId) {
    return null;
  }

  const legacy = detectLegacyGen(dex);

  /**
   * @todo Remove the `dex` and use the `Dex` global instead.
   */
  if (typeof Dex === 'undefined') {
    if (__DEV__) {
      l.warn(
        'Global Dex object is unavailable.',
        '\n', 'pokemon', pokemon,
        '\n', 'moveName', moveName,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  // optional chaining here since `item` can be cleared by the user (dirtyItem) in PokeInfo
  // (note: when cleared, `dirtyItem` will be set to null, which will default to `item`)
  const item = dex.num > 1
    ? pokemon.dirtyItem ?? pokemon.item
    : null;

  // megas require special handling (like for the item), so make sure we detect these
  const isMega = hasMegaForme(pokemon.speciesForme);

  const speciesForme = SmogonPokemon.getForme(
    dex,
    pokemon.speciesForme,
    isMega ? null : item,
    moveName,
  );

  // shouldn't happen, but just in case, ja feel
  if (!speciesForme) {
    if (__DEV__) {
      l.warn(
        'Failed to detect speciesForme from Pokemon', pokemon.ident,
        '\n', 'speciesForme', speciesForme,
        '\n', 'gen', dex.num,
        '\n', 'pokemon', pokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  const hasMegaItem = !!item
    && /(?:ite|z$)/.test(formatId(item))
    && formatId(item) !== 'eviolite'; // oh god

  // if applicable, convert the '???' status into an empty string
  // (don't apply the status if the Pokemon is fainted tho)
  const status = pokemon.hp
    ? pokemon.status === '???' ? null : pokemon.status
    : null;

  // not using optional chaining here since ability cannot be cleared in PokeInfo
  const ability = !legacy
    ? pokemon.dirtyAbility ?? pokemon.ability
    : null;

  // note: Multiscale is in the PokemonToggleAbilities list, but isn't technically toggleable, per se.
  // we only allow it to be toggled on/off since it works like a Focus Sash (i.e., depends on the Pokemon's HP).
  // (to calculate() of `smogon/calc`, it'll have no idea since we'll be passing no ability if toggled off)
  const hasMultiscale = !!ability
    && formatId(ability) === 'multiscale';

  const options: SmogonPokemonOptions = {
    // note: curHP and originalCurHP in the SmogonPokemon's constructor both set the originalCurHP
    // of the class instance with curHP's value taking precedence over originalCurHP's value
    // (in other words, seems safe to specify either one, but if none, defaults to rawStats.hp)
    // ---
    // also note: seems that maxhp is internally calculated in the instance's rawStats.hp,
    // so we can't specify it here
    curHP: (() => { // js wizardry
      // cheeky way to allow the user to "turn off" Multiscale w/o editing the HP value
      const shouldMultiscale = hasMultiscale
        && pokemon.abilityToggleable
        && pokemon.abilityToggled;

      if (pokemon.serverSourced) {
        const maxHp = pokemon.spreadStats.hp || pokemon.maxhp || 100;

        const hp = !pokemon.hp || pokemon.hp === maxHp // check 0% or 100% HP for Multiscale
          ? Math.floor((pokemon.hp || maxHp) * (!hasMultiscale || shouldMultiscale ? 1 : 0.99))
          : (shouldMultiscale ? maxHp : pokemon.hp);

        return hp;
      }

      const hpPercentage = calcPokemonHp(pokemon);

      // note that spreadStats may not be available yet, hence the fallback object
      const { hp: hpStat } = pokemon.spreadStats
        || { hp: pokemon.maxhp || 100 };

      // if the Pokemon is dead, assume it has full HP as to not break the damage calc
      return Math.floor((shouldMultiscale ? 0.99 : hpPercentage || 1) * hpStat);
    })(),

    level: pokemon.level,
    gender: pokemon.gender,
    status,
    toxicCounter: pokemon.toxicCounter,

    // appears that the SmogonPokemon will automatically double both the HP and max HP if this is true,
    // which I'd imagine affects the damage calculations in the matchup
    isDynamaxed: pokemon.useMax,

    ability,
    abilityOn: pokemon.abilityToggleable ? pokemon.abilityToggled : undefined,
    item: isMega || hasMegaItem ? null : item,
    nature: legacy ? undefined : pokemon.nature,
    moves: pokemon.moves,

    ivs: {
      hp: pokemon.ivs?.hp ?? 31,
      atk: pokemon.ivs?.atk ?? 31,
      def: pokemon.ivs?.def ?? 31,
      spa: pokemon.ivs?.spa ?? 31,
      spd: pokemon.ivs?.spd ?? 31,
      spe: pokemon.ivs?.spe ?? 31,
    },

    evs: legacy ? undefined : {
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

    overrides: {
      types: <SmogonPokemonOverrides['types']> pokemon.types,
    },
  };

  // calc will auto +1 ATK/SPA, which the client will have already reported the boosts,
  // so we won't report these abilities to the calc to avoid unintentional double boostage
  if (['intrepidsword', 'download'].includes(formatId(ability))) {
    options.ability = 'Pressure';
  }

  // need to update the base HP stat for transformed Pokemon
  // (otherwise, damage calculations may be incorrect!)
  if (pokemon.transformedForme) {
    const {
      baseStats,
      transformedBaseStats,
    } = pokemon || {};

    (<DeepWritable<SmogonPokemonOverrides>> options.overrides).baseStats = {
      ...(<Required<Omit<Showdown.StatsTable, 'hp'>>> transformedBaseStats),
      hp: baseStats.hp,
    };
  }

  // const dexSpecies = dex.species.get(speciesForme);
  // const dexItem = dex.items.get(item);

  // const determinedDex = dexSpecies?.exists && dexItem?.exists
  //   ? dex
  //   : <GenerationNum> Math.max(
  //     Dex.species.get(speciesForme)?.gen ?? 0,
  //     Dex.items.get(item)?.gen ?? 0,
  //     0,
  //   ) || dex;

  const baseGen = <GenerationNum> Dex.species.get(speciesForme)?.gen;
  const isGalarian = formatId(speciesForme).includes('galar');
  const missingSpecies = !dex.species.get(speciesForme)?.exists;

  const determinedDex = legacy
    ? dex
    : isGalarian
      ? <GenerationNum> 8
      : isMega || hasMegaItem
        ? <GenerationNum> Math.max(7, baseGen || 0)
        : missingSpecies
          ? <GenerationNum> Math.max(baseGen || 0, 4)
          : dex;

  // l.debug(
  //   'determinedDex for', speciesForme, typeof determinedDex === 'number' ? determinedDex : determinedDex?.num,
  //   '\n', 'item', item,
  //   '\n', 'isMega?', isMega, 'hasMegaItem?', hasMegaItem,
  //   '\n', 'missingSpecies?', missingSpecies, 'isGalarian?', isGalarian,
  // );

  const smogonPokemon = new SmogonPokemon(
    determinedDex,
    speciesForme,
    options,
  );

  return smogonPokemon;
};
