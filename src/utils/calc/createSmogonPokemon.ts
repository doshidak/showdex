import { Pokemon as SmogonPokemon } from '@smogon/calc';
import { formatId } from '@showdex/utils/app';
import {
  detectGenFromFormat,
  detectLegacyGen,
  getGenDexForFormat,
  // hasMegaForme,
  notFullyEvolved,
} from '@showdex/utils/battle';
import { logger } from '@showdex/utils/debug';
import type { ItemName, Specie } from '@smogon/calc/dist/data/interface';
import type { CalcdexBattleField, CalcdexPokemon } from '@showdex/redux/store';
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
  format: string,
  pokemon: CalcdexPokemon,
  // moveName?: MoveName,
  field?: CalcdexBattleField,
): SmogonPokemon => {
  const dex = getGenDexForFormat(format);
  const gen = detectGenFromFormat(format);

  if (!dex || gen < 1 || !pokemon?.calcdexId) {
    return null;
  }

  const legacy = detectLegacyGen(gen);

  // nullish-coalescing (`??`) here since `item` can be cleared by the user (dirtyItem) in PokeInfo
  // (note: when cleared, `dirtyItem` will be set to null, which will default to `item`)
  const item = (gen > 1 && (pokemon.dirtyItem ?? pokemon.item)) || null;

  // megas require special handling (like for the item), so make sure we detect these
  // const isMega = hasMegaForme(pokemon.speciesForme);

  // const speciesForme = SmogonPokemon.getForme(
  //   dex,
  //   pokemon.speciesForme.replace('-Gmax', ''),
  //   isMega ? null : item,
  //   moveName,
  // );

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
  const status = pokemon.hp
    ? pokemon.status === '???' ? null : pokemon.status
    : null;

  const ability = (!legacy && (pokemon.dirtyAbility ?? pokemon.ability)) || null;
  const abilityId = formatId(ability);

  // note: these are in the PokemonToggleAbilities list, but isn't technically toggleable, per se.
  // but we're allowing the effects of these abilities to be toggled on/off
  const pseudoToggleAbility = !!ability && [
    'beadsofruin',
    'multiscale',
    'protosynthesis',
    'quarkdrive',
    'shadowshield',
    'swordofruin',
    'tabletsofruin',
    'vesselofruin',
  ].includes(abilityId);

  const pseudoToggled = pseudoToggleAbility
    && pokemon.abilityToggleable
    && pokemon.abilityToggled;

  const options: SmogonPokemonOptions = {
    // note: curHP and originalCurHP in the SmogonPokemon's constructor both set the originalCurHP
    // of the class instance with curHP's value taking precedence over originalCurHP's value
    // (in other words, seems safe to specify either one, but if none, defaults to rawStats.hp)
    // ---
    // also note: seems that maxhp is internally calculated in the instance's rawStats.hp,
    // so we can't specify it here
    curHP: (() => { // js wizardry
      const shouldMultiscale = pseudoToggled
        && ['multiscale', 'shadowshield'].includes(abilityId);

      // note that spreadStats may not be available yet, hence the fallback object
      const { hp: maxHp } = pokemon.spreadStats
        || { hp: pokemon.maxhp || 100 };

      if (pokemon.serverSourced) {
        return shouldMultiscale && !pokemon.hp ? maxHp : pokemon.hp;
      }

      const hpPercentage = calcPokemonHp(pokemon);

      // if the Pokemon is dead, assume it has full HP as to not break the damage calc
      // return Math.floor((shouldMultiscale ? 0.99 : hpPercentage || 1) * hpStat);
      return Math.floor((shouldMultiscale && !pokemon.hp ? 1 : hpPercentage || 1) * maxHp);
    })(),

    level: pokemon.level,
    gender: pokemon.gender,

    teraType: (pokemon.terastallized && pokemon.teraType) || null,
    status,
    toxicCounter: pokemon.toxicCounter,

    // appears that the SmogonPokemon will automatically double both the HP and max HP if this is true,
    // which I'd imagine affects the damage calculations in the matchup
    isDynamaxed: pokemon.useMax,

    // cheeky way to allow the user to "turn off" Multiscale w/o editing the HP value
    ability: pseudoToggleAbility && !pseudoToggled ? 'Pressure' : ability,
    abilityOn: pseudoToggled,
    item,
    nature: legacy ? null : pokemon.nature,
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
      // update (2022/11/06): now allowing base stat editing as a setting
      baseStats: {
        ...(<Required<Showdown.StatsTable>> pokemon.baseStats),

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
      types: <SmogonPokemonOverrides['types']> [
        ...pokemon.types,
        null,
        null, // update (2022/11/02): hmm... don't think @smogon/calc supports 3 types lol
      ].slice(0, 3),
    },
  };

  // typically (in gen 9), the Booster Energy will be consumed in battle, so there'll be no item.
  // unfortunately, we must forcibly set the item to Booster Energy to "activate" these abilities
  if (pseudoToggled && ['protosynthesis', 'quarkdrive'].includes(abilityId) && options.item !== 'Booster Energy') {
    const {
      weather,
      terrain,
    } = field || {};

    // update (2022/12/11): no need to forcibly set the item if the field conditions activate the abilities
    const fieldActivated = (abilityId === 'protosynthesis' && ['Sun', 'Harsh Sunshine'].includes(weather))
      || (abilityId === 'quarkdrive' && terrain === 'Electric');

    if (!fieldActivated) {
      options.item = <ItemName> 'Booster Energy';
    }
  }

  // also in gen 9, Supreme Overlord! (tf who named these lol)
  // (workaround cause @smogon/damage-calc doesn't support this ability yet)
  // update: whoops nvm, looks like Showdown applies it to the move's BP instead
  // if (abilityId === 'supremeoverlord' && field?.attackerSide) {
  //   const fieldKey: keyof CalcdexBattleField = pokemon.playerKey === 'p2' ? 'defenderSide' : 'attackerSide';
  //   const { faintedCount = 0 } = field[fieldKey] || {};
  //
  //   // Supreme Overlord boosts the ATK & SPA by 10% for each fainted teammate
  //   if (faintedCount > 0) {
  //     const { atk, spa } = options.overrides.baseStats;
  //     const modifier = 1 + (0.1 * faintedCount);
  //
  //     /** @todo my lazy ass should just fix the typing at this point lol */
  //     (<DeepWritable<SmogonPokemonOverrides>> options.overrides).baseStats.atk = Math.floor(atk * modifier);
  //     (<DeepWritable<SmogonPokemonOverrides>> options.overrides).baseStats.spa = Math.floor(spa * modifier);
  //   }
  // }

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
    } = pokemon;

    (<DeepWritable<SmogonPokemonOverrides>> options.overrides).baseStats = {
      ...(<Required<Omit<Showdown.StatsTable, 'hp'>>> transformedBaseStats),
      hp: baseStats.hp,
    };
  }

  const smogonPokemon = new SmogonPokemon(
    dex,
    pokemon.speciesForme,
    options,
  );

  if (smogonPokemon?.species && typeof smogonPokemon.species?.nfe !== 'boolean') {
    (<Writable<Specie>> smogonPokemon.species).nfe = notFullyEvolved(pokemon.speciesForme);
  }

  return smogonPokemon;
};
