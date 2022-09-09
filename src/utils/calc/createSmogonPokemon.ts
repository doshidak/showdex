import { Pokemon as SmogonPokemon } from '@smogon/calc';
import { formatId } from '@showdex/utils/app';
import { logger } from '@showdex/utils/debug';
import type { Generation, GenerationNum, MoveName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { calcPokemonHp } from './calcPokemonHp';

const l = logger('@showdex/utils/calc/createSmogonPokemon');

/* eslint-disable no-nested-ternary */

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

  // const ident = detectPokemonIdent(pokemon);

  // if (!ident) {
  //   return null;
  // }

  // optional chaining here since `item` can be cleared by the user (dirtyItem) in PokeInfo
  // (note: when cleared, `dirtyItem` will be set to null, which will default to `item`)
  const item = pokemon.dirtyItem ?? pokemon.item;

  const speciesForme = SmogonPokemon.getForme(
    dex,
    // detectSpeciesForme(pokemon),
    pokemon.transformedForme || pokemon.speciesForme,
    item,
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

  // megas require special handling (like for the item), so make sure we detect these
  const isMega = formatId(speciesForme)?.includes('mega');

  const hasMegaItem = !!item
    && /(?:ite|z$)/.test(formatId(item))
    && formatId(item) !== 'eviolite'; // oh god

  // if applicable, convert the '???' status into an empty string
  const status = pokemon.status === '???' ? '' : pokemon.status;

  // not using optional chaining here since ability cannot be cleared in PokeInfo
  const ability = pokemon.dirtyAbility ?? pokemon.ability;

  // note: Multiscale is in the PokemonToggleAbilities list, but isn't technically toggleable, per se.
  // we only allow it to be toggled on/off since it works like a Focus Sash (i.e., depends on the Pokemon's HP).
  // (to calculate() of `smogon/calc`, it'll have no idea since we'll be passing no ability if toggled off)
  const hasMultiscale = formatId(ability) === 'multiscale';

  const options: ConstructorParameters<typeof SmogonPokemon>[2] = {
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
    // (useUltimateMoves is a gen-agnostic property that's user-toggleable and syncs w/ the battle state btw)
    // isDynamaxed: pokemon.useUltimateMoves,
    isDynamaxed: pokemon.useMax,

    ability,
    abilityOn: pokemon.abilityToggleable ? pokemon.abilityToggled : undefined,
    item: isMega || hasMegaItem ? null : item,
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

  // const dexSpecies = dex.species.get(speciesForme);
  // const dexItem = dex.items.get(item);

  // const determinedDex = dexSpecies?.exists && dexItem?.exists
  //   ? dex
  //   : <GenerationNum> Math.max(
  //     Dex.species.get(speciesForme)?.gen ?? 0,
  //     Dex.items.get(item)?.gen ?? 0,
  //     0,
  //   ) || dex;

  const isGalarian = formatId(speciesForme).includes('galar');
  const missingSpecies = !dex.species.get(speciesForme)?.exists;

  const determinedDex = isMega || hasMegaItem
    ? 7
    : isGalarian
      ? 8
      : missingSpecies
        ? <GenerationNum> Dex.species.get(speciesForme)?.gen || 7
        : dex;

  l.debug(
    'determinedDex for', speciesForme, typeof determinedDex === 'number' ? determinedDex : determinedDex?.num,
    '\n', 'item', item,
    '\n', 'isMega?', isMega,
    '\n', 'hasMegaItem?', hasMegaItem,
    '\n', 'isGalarian?', isGalarian,
    '\n', 'missingSpecies?', missingSpecies,
  );

  const smogonPokemon = new SmogonPokemon(
    determinedDex,
    speciesForme,
    options,
  );

  // need to update the base HP stat for transformed Pokemon
  // (otherwise, damage calculations may be incorrect!)
  if (pokemon.transformedForme) {
    smogonPokemon.rawStats.hp = pokemon.baseStats.hp;
  }

  return smogonPokemon;
};

/* eslint-enable no-nested-ternary */
