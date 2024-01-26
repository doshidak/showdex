import {
  type GameType,
  type MoveName,
  type Specie,
  Pokemon as SmogonPokemon,
} from '@smogon/calc';
import {
  PokemonBoostNames,
  PokemonPseudoToggleAbilities,
  PokemonRuinAbilities,
  PokemonSturdyAbilities,
} from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { clamp, formatId, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import {
  detectGenFromFormat,
  detectLegacyGen,
  // getDefaultSpreadValue,
  getGenDexForFormat,
  notFullyEvolved,
} from '@showdex/utils/dex';
import { calcPokemonHpPercentage } from './calcPokemonHp';
import { calcStatAutoBoosts } from './calcStatAutoBoosts';

export type SmogonPokemonOptions = ConstructorParameters<typeof SmogonPokemon>[2];
export type SmogonPokemonOverrides = SmogonPokemonOptions['overrides'];

const l = logger('@showdex/utils/calc/createSmogonPokemon()');

/**
 * Factory that essentially converts a `CalcdexPokemon` into an instantiated `Pokemon` class from `@smogon/calc`.
 *
 * * This is basically the thing that "plugs-in" all the parameters for a Pokemon in the damage calculator.
 * * Includes special handling for situations such as legacy gens, mega items, and type changes.
 *
 * @since 0.1.0
 */
export const createSmogonPokemon = (
  format: string,
  gameType: GameType,
  pokemon: CalcdexPokemon,
  moveName?: MoveName,
  opponentPokemon?: CalcdexPokemon,
): SmogonPokemon => {
  const dex = getGenDexForFormat(format);
  const gen = detectGenFromFormat(format);

  if (!dex || gen < 1 || !gameType || !pokemon?.calcdexId || !pokemon.speciesForme) {
    return null;
  }

  const legacy = detectLegacyGen(gen);
  // const defaultIv = getDefaultSpreadValue('iv', format);
  // const defaultEv = getDefaultSpreadValue('ev', format);

  // nullish-coalescing (`??`) here since `item` can be cleared by the user (dirtyItem) in PokeInfo
  // (note: when cleared, `dirtyItem` will be set to null, which will default to `item`)
  const item = (gen > 1 && (pokemon.dirtyItem ?? pokemon.item)) || null;

  // shouldn't happen, but just in case, ja feel
  if (!pokemon.speciesForme) {
    if (__DEV__) {
      l.warn(
        'Failed to detect speciesForme from Pokemon', pokemon.ident,
        '\n', 'speciesForme', pokemon.speciesForme,
        '\n', 'gen', gen,
        '\n', 'pokemon', pokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  // const hasMegaItem = !!item
  //   && /(?:ite|z$)/.test(formatId(item))
  //   && formatId(item) !== 'eviolite'; // oh god

  // if applicable, convert the '???' status into an empty string
  // (don't apply the status if the Pokemon is fainted tho)
  const status = pokemon.dirtyStatus && pokemon.dirtyStatus !== '???'
    ? pokemon.dirtyStatus === 'ok'
      ? null
      : pokemon.dirtyStatus
    : pokemon.status === '???'
      ? null
      : pokemon.status;

  const ability = (!legacy && (pokemon.dirtyAbility || pokemon.ability)) || null;
  const abilityId = formatId(ability);

  // note: these are in the PokemonToggleAbilities list, but isn't technically toggleable, per se.
  // but we're allowing the effects of these abilities to be toggled on/off
  // update (2023/01/31): Ruin abilities aren't designed to be toggleable in Singles, only Doubles.
  const pseudoToggleAbility = !!ability
  //   && PokemonToggleAbilities
  //     .map((a) => (formatId(a).endsWith('ofruin') && !doubles ? null : formatId(a)))
  //     .filter(Boolean)
  //     .includes(abilityId);
      && [
        ...PokemonPseudoToggleAbilities,
        ...(gameType === 'Doubles' ? PokemonRuinAbilities : []),
      ].includes(ability);

  const pseudoToggled = pseudoToggleAbility && pokemon.abilityToggled;

  const options: SmogonPokemonOptions = {
    // note: curHP and originalCurHP in the SmogonPokemon's constructor both set the originalCurHP
    // of the class instance with curHP's value taking precedence over originalCurHP's value
    // (in other words, seems safe to specify either one, but if none, defaults to rawStats.hp)
    // ---
    // also note: seems that maxhp is internally calculated in the instance's rawStats.hp,
    // so we can't specify it here
    curHP: (() => { // js wizardry
      const shouldMultiscale = pseudoToggled && PokemonSturdyAbilities.includes(ability);

      // note that spreadStats may not be available yet, hence the fallback object
      const maxHp = pokemon.spreadStats?.hp || pokemon.maxhp || 100;
      const hp = pokemon.dirtyHp ?? (pokemon.hp || 0);

      if (pokemon.source === 'server') {
        return shouldMultiscale && !hp ? maxHp : hp;
      }

      const hpPercentage = calcPokemonHpPercentage(pokemon);

      // if the Pokemon is dead, assume it has full HP as to not break the damage calc
      // return Math.floor((shouldMultiscale ? 0.99 : hpPercentage || 1) * hpStat);
      return Math.floor((shouldMultiscale && !hp ? 1 : hpPercentage || 1) * maxHp);
    })(),

    level: pokemon.level,
    gender: pokemon.gender,

    teraType: (pokemon.terastallized && (pokemon.dirtyTeraType || pokemon.teraType)) || null,
    status,
    toxicCounter: pokemon.toxicCounter,

    // if the move has been manually overridden, don't specify this property
    // (e.g., don't apply Supreme Overlord boosts when user overrides a move's base power)
    alliesFainted: (
      (!moveName || !nonEmptyObject(pokemon.moveOverrides?.[moveName]))
        && (pokemon.dirtyFaintCounter ?? (pokemon.faintCounter || 0))
    ),

    // appears that the SmogonPokemon will automatically double both the HP and max HP if this is true,
    // which I'd imagine affects the damage calculations in the matchup
    isDynamaxed: pokemon.useMax,
    isSaltCure: 'saltcure' in pokemon.volatiles,

    // cheeky way to allow the user to "turn off" Multiscale w/o editing the HP value
    ability: pseudoToggleAbility && !pseudoToggled ? 'Pressure' : ability,
    abilityOn: pokemon.abilityToggled,
    item,
    nature: legacy ? null : pokemon.nature,
    moves: pokemon.moves,

    // update (2023/10/10): this is a special property I added into the @smogon/calc patch that when specified,
    // will bypass @smogon/calc's internal spread stats calculator (which is required by Showdex to properly handle Ditto)
    // update: fuck nvm keeps getting recalculated based on its species baseStats >:(
    // update (2023/10/11): trying the new rawStats param, which overrides rawStats instead of stats
    // (internally in the mechanics files, computeFinalStats() seems to write to `stats` based on `rawStats`)
    // update: actually, `stats` would've worked (since I internally passed it to this.rawStats of the Pokemon class anyway),
    // but I just had forgot purge the webpack cache for Showdex ... sooo don't forget to run `yarn cache:purge` when you
    // change anything in node_modules lol
    rawStats: { ...pokemon.spreadStats } as SmogonPokemonOptions['rawStats'],

    // ivs: {
    //   hp: pokemon.ivs?.hp ?? defaultIv,
    //   atk: pokemon.ivs?.atk ?? defaultIv,
    //   def: pokemon.ivs?.def ?? defaultIv,
    //   spa: pokemon.ivs?.spa ?? defaultIv,
    //   spd: pokemon.ivs?.spd ?? defaultIv,
    //   spe: pokemon.ivs?.spe ?? defaultIv,
    // },

    // evs: {
    //   hp: pokemon.evs?.hp ?? defaultEv,
    //   atk: pokemon.evs?.atk ?? defaultEv,
    //   def: pokemon.evs?.def ?? defaultEv,
    //   spa: pokemon.evs?.spa ?? defaultEv,
    //   spd: pokemon.evs?.spd ?? defaultEv,
    //   spe: pokemon.evs?.spe ?? defaultEv,
    // },

    // update (2024/01/24): by this point, the EVs & IVs should be fully populated, so no need to repeat this logic
    ivs: { ...pokemon.ivs },
    evs: { ...pokemon.evs },

    // update (2023/05/15): typically only used to provide the client-reported stat from Protosynthesis & Quark Drive
    // (populated in syncPokemon() via `volatiles`)
    // update (2024/01/03): apparently 'auto' is an accepted value, which is ok to fallback on since this property is
    // only exclusively used for the aformentioned abilities LOL
    boostedStat: pokemon.dirtyBoostedStat || pokemon.boostedStat || 'auto',

    // boosts: {
    //   atk: pokemon.dirtyBoosts?.atk ?? pokemon.boosts?.atk ?? 0,
    //   def: pokemon.dirtyBoosts?.def ?? pokemon.boosts?.def ?? 0,
    //   spa: pokemon.dirtyBoosts?.spa ?? pokemon.boosts?.spa ?? 0,
    //   spd: pokemon.dirtyBoosts?.spd ?? pokemon.boosts?.spd ?? 0,
    //   spe: pokemon.dirtyBoosts?.spe ?? pokemon.boosts?.spe ?? 0,
    // },

    boosts: PokemonBoostNames.reduce((prev, stat) => {
      const autoBoost = calcStatAutoBoosts(pokemon, stat) || 0;
      const boost = typeof pokemon.dirtyBoosts?.[stat] === 'number'
        ? (pokemon.dirtyBoosts[stat] || 0)
        : ((pokemon.boosts?.[stat] || 0) + autoBoost);

      prev[stat] = clamp(-6, boost, 6);

      return prev;
    }, {} as Showdown.StatsTableNoHp),

    overrides: {
      // update (2022/11/06): now allowing base stat editing as a setting
      baseStats: {
        ...(pokemon.baseStats as Required<Showdown.StatsTable>),

        // only spread non-negative numerical values
        ...Object.entries(pokemon.dirtyBaseStats || {}).reduce((prev, [stat, value]) => {
          if (typeof value !== 'number' || value < 0) {
            return prev;
          }

          prev[stat] = value;

          return prev;
        }, {}),
      },

      // note: there's a cool utility called expand() that merges two objects together,
      // which also merges array values, keeping the array length of the source object.
      // for instance, Greninja, who has the types ['Water', 'Dark'] and the Protean ability
      // can 'typechange' into ['Poison'], but passing in only ['Poison'] here causes expand()
      // to merge ['Water', 'Dark'] and ['Poison'] into ['Poison', 'Dark'] ... oh noo :o
      types: [
        ...(pokemon.dirtyTypes?.length ? pokemon.dirtyTypes : pokemon.types),
        null,
        null, // update (2022/11/02): hmm... don't think @smogon/calc supports 3 types lol
      ].slice(0, 2) as SmogonPokemonOverrides['types'],
    },
  };

  // in legacy gens, make sure that the SPD DVs match the SPA DVs
  // (even though gen 1 doesn't have SPD [or even SPA, technically], doesn't hurt to set it anyways)
  if (legacy) {
    options.ivs.spd = options.ivs.spa;
  }

  // in gen 1, we must set any SPA boosts to SPD as well
  // (in gen 2, they're separate boosts)
  if (gen === 1) {
    options.evs.spd = options.evs.spa;
    options.boosts.spd = options.boosts.spa;

    if (options.overrides.baseStats.spd !== options.overrides.baseStats.spa) {
      (options.overrides as DeepWritable<SmogonPokemonOverrides>).baseStats.spd = options.overrides.baseStats.spa;
    }
  }

  // calc will apply STAB boosts for ALL moves regardless of the Pokemon's changed type and the move's type
  // if the Pokemon has Protean or Libero; we don't want this to happen since the client reports the changed typings
  // update (2023/05/17): it appears people want this back, so allowing it unless the 'typechange' volatile exists
  // (note: there's no volatile for when the Pokemon Terastallizes, so we're good on that front; @smogon/calc will
  // also ignore Protean STAB once Terastallized, so we're actually doubly good)
  // update (2023/06/02): imagine working on this for 2 weeks. naw I finally have some time at 4 AM to do this lol
  // if (['protean', 'libero'].includes(abilityId) && !pokemon.abilityToggled) {
  //   options.ability = 'Pressure';
  // }

  // calc will auto +1 ATK/SPA, which the client will have already reported the boosts,
  // so we won't report these abilities to the calc to avoid unintentional double boostage
  // update (2024/01/24): these are all being handled by Showdex now via the pokemon's autoBoostMap
  // if (['intrepidsword', 'dauntlessshield', 'download'].includes(abilityId)) {
  //   options.ability = 'Pressure';
  // }

  // for Ruin abilities (gen 9), if BOTH Pokemon have the same type of Ruin ability, they'll cancel each other out
  // (@smogon/calc does not implement this mechanic yet, applying stat drops to BOTH Pokemon)
  if (!legacy && abilityId?.endsWith('ofruin') && opponentPokemon?.speciesForme) {
    const opponentAbilityId = formatId(opponentPokemon.dirtyAbility || opponentPokemon.ability);

    if (opponentAbilityId?.endsWith('ofruin') && opponentAbilityId === abilityId) {
      options.ability = 'Pressure';
    }
  }

  // need to update the base HP stat for transformed Pokemon
  // (otherwise, damage calculations may be incorrect!)
  if (pokemon.transformedForme) {
    const {
      baseStats,
      transformedBaseStats,
    } = pokemon;

    (options.overrides as DeepWritable<SmogonPokemonOverrides>).baseStats = {
      ...(transformedBaseStats as Required<Omit<Showdown.StatsTable, 'hp'>>),
      hp: baseStats.hp,
    };
  }

  // update (2023/07/27): TIL @smogon/calc doesn't implement 'Power Trick' at all LOL
  // (I'm assuming most people were probably manually switching ATK/DEF in the calc to workaround this)
  if (nonEmptyObject(pokemon.volatiles) && 'powertrick' in pokemon.volatiles) {
    const { atk, def } = options.overrides.baseStats;

    (options.overrides as DeepWritable<SmogonPokemonOverrides>).baseStats.atk = def;
    (options.overrides as DeepWritable<SmogonPokemonOverrides>).baseStats.def = atk;
  }

  const smogonPokemon = new SmogonPokemon(
    dex,
    pokemon.speciesForme,
    options,
  );

  if (typeof smogonPokemon?.species?.nfe !== 'boolean') {
    (smogonPokemon.species as Writable<Specie>).nfe = notFullyEvolved(pokemon.speciesForme, format);
  }

  return smogonPokemon;
};
