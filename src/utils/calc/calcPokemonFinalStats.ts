import { type GenerationNum } from '@smogon/calc';
import { PokemonSpeedReductionItems } from '@showdex/consts/dex';
import { type CalcdexBattleField, type CalcdexPlayer, type CalcdexPokemon } from '@showdex/interfaces/calc';
import { countRuinAbilities, ruinAbilitiesActive } from '@showdex/utils/battle';
import { env, formatId as id, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import {
  detectGenFromFormat,
  detectLegacyGen,
  getDexForFormat,
  notFullyEvolved,
  shouldIgnoreItem,
} from '@showdex/utils/dex';
import { calcBoostedStats } from './calcBoostedStats';
import { calcPokemonHpPercentage } from './calcPokemonHp';
import { findHighestStat } from './findHighestStat';
import { type CalcdexStatModRecording, statModRecorder } from './statModRecorder';

const l = logger('@showdex/utils/calc/calcPokemonFinalStats()');

/**
 * Reimplementation of `calculateModifiedStats()` in the Showdown client's `BattleTooltip`.
 *
 * * Makes use of our custom `CalcdexPokemon` and `CalcdexBattleField` properties wherever possible
 *   to better integrate with the Calcdex's state (which many properties are user-mutable).
 * * Though the aforementioned function exists in the client, it reads directly from the battle state,
 *   preventing us from non-destructively incorporating the Calcdex's state.
 *   - In other words, would be a pain in the ass to incorporate the user's inputs into the function,
 *     which requires writing directly into the battle state, hoping that we didn't fuck something up.
 *   - Let's not forget that we gotta get our `CalcdexBattleField` in there too!
 * * Hence why I chose death.
 *
 * @see https://github.com/smogon/pokemon-showdown-client/blob/de8e7ea0d17305046c957574e52c613eeed50630/src/battle-tooltips.ts#L966-L1240
 * @since 0.1.3
 */
export const calcPokemonFinalStats = (
  format: string | GenerationNum,
  pokemon: CalcdexPokemon,
  opponentPokemon: CalcdexPokemon,
  player?: CalcdexPlayer,
  opponent?: CalcdexPlayer,
  field?: CalcdexBattleField,
  allPlayers?: CalcdexPlayer[], // primarily for FFA... like Ruin abilities... fun fun
): CalcdexStatModRecording => {
  const record = statModRecorder(pokemon);

  if (!pokemon?.speciesForme || !opponentPokemon?.speciesForme) {
    return record.export();
  }

  const dex = getDexForFormat(format);

  if (!dex) {
    if (__DEV__) {
      l.warn(
        'Global Dex is unavailable for format', format,
        '\n', 'pokemon', pokemon?.name || pokemon?.speciesForme || '???', pokemon,
        '\n', 'player', player,
        '\n', 'opponentPokemon', opponentPokemon?.name || opponentPokemon?.speciesForme || '???', opponentPokemon,
        '\n', 'opponent', opponent,
        '\n', 'field', field,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return record.export();
  }

  const gen = detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'));
  const legacy = detectLegacyGen(gen);

  const hpPercentage = calcPokemonHpPercentage(pokemon);
  const ability = id(pokemon.dirtyAbility || pokemon.ability);
  const opponentAbility = id(opponentPokemon.dirtyAbility || opponentPokemon.ability);

  const hasTransform = 'transform' in pokemon.volatiles;
  const hasFormeChange = 'formechange' in pokemon.volatiles;
  const speciesForme = hasTransform && hasFormeChange
    ? pokemon.volatiles.formechange[1]
    : pokemon.speciesForme;

  const species = dex.species.get(speciesForme);
  const baseForme = id(species?.baseSpecies);

  const types = pokemon.terastallized && (pokemon.dirtyTeraType || pokemon.teraType)
    ? [pokemon.dirtyTeraType || pokemon.teraType]
    : pokemon.types;

  // note: using optional chaining here (over logical OR) in case the user clears the item on purpose
  // (in which case the value of dirtyItem becomes an empty string, i.e., `''`)
  const item = id(pokemon.dirtyItem ?? pokemon.item);
  const ignoreItem = shouldIgnoreItem(pokemon, field);

  // swap ATK & DEF if the move "Power Trick" was used
  if ('powertrick' in pokemon.volatiles) {
    record.swap('atk', 'def', 'moves', 'Power Trick');
  }

  // swap DEF & SPD if Wonder Room is active on the field
  if (field?.isWonderRoom) {
    record.swap('def', 'spd', 'moves', 'Wonder Room');
  }

  // apply stat boosts
  // note: calcBoostedStats() writes directly to our existing record via record.apply()
  void calcBoostedStats(format, pokemon, record);

  // find out what the highest *boosted* stat is (excluding HP) for use in some abilities,
  // particularly Protosynthesis & Quark Drive (gen 9),
  // which will boost the highest stat after stage boosts are applied
  const highestBoostedStat = pokemon.dirtyBoostedStat
    || pokemon.boostedStat
    || findHighestStat(record.stats());

  // apply status condition effects
  const status = pokemon?.dirtyStatus && pokemon.dirtyStatus !== '???'
    ? pokemon.dirtyStatus === 'ok'
      ? null
      : pokemon.dirtyStatus
    : pokemon.status;

  if (status) {
    if (!legacy && ['guts', 'quickfeet'].includes(ability)) {
      // 50% ATK boost w/ non-volatile status condition due to "Guts" (gen 3+)
      if (ability === 'guts') {
        record.apply('atk', 1.5, 'abilities', 'Guts');
      }

      // 50% SPE boost w/ non-volatile status condition due to "Quick Feet" (gen 4+)
      if (ability === 'quickfeet') {
        record.apply('spe', 1.5, 'abilities', 'Quick Feet');
      }
    } else {
      // 50% ATK reduction when burned (all gens... probably)
      if (status === 'brn') {
        record.apply('atk', 0.5, 'nonvolatiles', 'Burn');
      }

      // 75% SPE reduction when paralyzed for gens 1-6, otherwise, 50% SPE reduction
      if (status === 'par') {
        record.apply('spe', gen < 7 ? 0.25 : 0.5, 'nonvolatiles', 'Paralysis');
      }
    }
  }

  // update (2023/07/27): jk, apparently screens in legacy gens boost stats, not incoming damage!
  // (of course, the only exception is Light Screen in gen 1, which boosts SPC only after taking damage)
  // (also, the BattleTooltips in the Showdown client don't show this)
  if (legacy && nonEmptyObject(player?.side)) { // note: we could be in a higher gen here, hence the check!
    // 100% DEF boost if the "Reflect" player side condition is active (gens 1-2)
    // (note: in gen 1, the side condition is actually a Pokemon volatile & only applies to the Pokemon itself, i.e., effects
    // are removed once the Pokemon faints or switches out, but we'll check the side condition as the user can toggle it)
    if (player.side.isReflect) {
      record.apply('def', 2, gen === 1 ? 'moves' : 'field', 'Reflect');
    }

    // 100% SPD boost if the "Light Screen" player side condition is active (gens 1-2)
    if (player.side.isLightScreen) {
      record.apply('spd', 2, gen === 1 ? 'moves' : 'field', 'Light Screen');

      // note: in gen 1, there no SPD, only SPC (Special), so SPA = SPD = SPC
      if (gen === 1) {
        record.apply('spa', 2, 'moves', 'Light Screen');
      }
    }
  }

  // finished gen 1 since it doesn't support items
  if (gen <= 1) {
    // gen 1 stats are capped to 999
    record.cap(999);

    return record.export();
  }

  // apply gen 2-compatible item effects
  // (at this point, we should at least be gen 2)
  if (baseForme === 'pikachu' && !ignoreItem && item === 'lightball') {
    if (gen > 4) {
      // 100% ATK boost if "Light Ball" is held by a Pikachu (gen 5+)
      record.apply('atk', 2, 'items', 'Light Ball');
    }

    // 100% SPA boost if "Light Ball" is held by a Pikachu
    record.apply('spa', 2, 'items', 'Light Ball');
  }

  if (['marowak', 'cubone'].includes(baseForme) && !ignoreItem && item === 'thickclub') {
    // 100% ATK boost if "Thick Club" is held by a Marowak/Cubone
    record.apply('atk', 2, 'items', 'Thick Club');
  }

  if (baseForme === 'ditto' && !hasTransform && !ignoreItem) {
    if (item === 'quickpowder') {
      record.apply('spe', 2, 'items', 'Quick Powder');
    } else if (item === 'metalpowder') {
      if (gen === 2) {
        // 50% DEF/SPD boost if "Metal Powder" is held by a Ditto (gen 2)
        record.apply('def', 1.5, 'items', 'Metal Powder');
        record.apply('spd', 1.5, 'items', 'Metal Powder');
      } else {
        // 100% DEF boost if "Metal Powder" is held by a Ditto (gen 3+)
        record.apply('def', 2, 'items', 'Metal Powder');
      }
    }
  }

  // finished gen 2 abilities and items
  if (gen <= 2) {
    return record.export();
  }

  // apply Dynamax effects
  const hasDynamax = 'dynamax' in pokemon.volatiles
    || pokemon.useMax;

  // 100% (2x) HP boost when Dynamaxed
  if (hasDynamax) {
    record.apply('hp', 2, 'ultimates', 'Dynamax');
  }

  // apply more item effects
  // (at this point, we should at least be gen 3)
  if (!ignoreItem) {
    // 50% ATK boost if "Choice Band" is held
    if (item === 'choiceband' && !hasDynamax) {
      record.apply('atk', 1.5, 'items', 'Choice Band');
    }

    // 50% SPA boost if "Choice Specs" is held
    if (item === 'choicespecs' && !hasDynamax) {
      record.apply('spa', 1.5, 'items', 'Choice Specs');
    }

    if (item === 'choicescarf' && !hasDynamax) {
      record.apply('spe', 1.5, 'items', 'Choice Scarf');
    }

    // 50% SPA boost if "Assault Vest" is held
    if (item === 'assaultvest') {
      record.apply('spd', 1.5, 'items', 'Assault Vest');
    }

    // 100% DEF boost if "Fur Coat" is held
    if (item === 'furcoat') {
      record.apply('def', 2, 'items', 'Fur Coat');
    }

    if (baseForme === 'clamperl') {
      if (item === 'deepseatooth') {
        // 100% SPA boost if "Deep Sea Tooth" is held by a Clamperl
        record.apply('spa', 2, 'items', 'Deep Sea Tooth');
      } else if (item === 'deepseascale') {
        // 100% SPD boost if "Deep Sea Scale" is held by a Clamperl
        record.apply('spd', 2, 'items', 'Deep Sea Scale');
      }
    }

    if (item === 'souldew' && gen < 7 && ['latios', 'latias'].includes(baseForme)) {
      // 50% SPA/SPD boost if "Soul Dew" is held by a Latios/Latias (gens 3-6)
      record.apply('spa', 1.5, 'items', 'Soul Dew');
      record.apply('spd', 1.5, 'items', 'Soul Dew');
    }

    const speedReductionItems = [
      'ironball',
      ...PokemonSpeedReductionItems.map((i) => id(i)),
    ];

    if (speedReductionItems.includes(item)) {
      record.apply('spe', 0.5, 'items', dex.items.get(item)?.name || item);
    }
  }

  // 100% ATK boost if ability is "Pure Power" or "Huge Power"
  if (['purepower', 'hugepower'].includes(ability)) {
    record.apply('atk', 2, 'abilities', dex.abilities.get(ability)?.name || ability);
  }

  // 50% ATK boost if ability is "Hustle" or "Gorilla Tactics" (and not dynamaxed, for the latter only)
  if (ability === 'hustle' || (ability === 'gorillatactics' && !hasDynamax)) {
    record.apply('atk', 1.5, 'abilities', dex.abilities.get(ability)?.name || ability);
  }

  // 100% DEF boost if ability is "Fur Coat"
  if (ability === 'furcoat') {
    record.apply('def', 2, 'abilities', dex.abilities.get(ability)?.name || ability);
  }

  // apply "Ruin" ability effects that'll ruin me (gen 9)
  // update (2022/12/14): Showdown fixed the Ruin stacking bug, so apply only once now
  // update (2023/01/23): apparently Ruin abilities will CANCEL each other out if BOTH Pokemon have it
  if (allPlayers?.length && ruinAbilitiesActive(...allPlayers.map((p) => p?.side))) {
    const ruinCounts = countRuinAbilities(...allPlayers.map((p) => p?.side));

    // 25% SPD reduction if there's at least one Pokemon with the "Beads of Ruin" ability (excluding this `pokemon`)
    const ruinBeadsCount = Math.max(ruinCounts.beads - (ability === 'beadsofruin' ? ruinCounts.beads : 0), 0);

    if (ruinBeadsCount) {
      record.apply('spd', 0.75, 'abilities', 'Beads of Ruin');
    }

    // 25% DEF reduction if there's at least one Pokemon with the "Sword of Ruin" ability (excluding this `pokemon`)
    const ruinSwordCount = Math.max(ruinCounts.sword - (ability === 'swordofruin' ? ruinCounts.sword : 0), 0);

    if (ruinSwordCount) {
      record.apply('def', 0.75, 'abilities', 'Sword of Ruin');
    }

    // 25% ATK reduction if there's at least one Pokemon with the "Tablets of Ruin" ability (excluding this `pokemon`)
    const ruinTabletsCount = Math.max(ruinCounts.tablets - (ability === 'tabletsofruin' ? ruinCounts.tablets : 0), 0);

    if (ruinTabletsCount) {
      record.apply('atk', 0.75, 'abilities', 'Tablets of Ruin');
    }

    // 25% SPA reduction if there's at least one Pokemon with the "Vessel of Ruin" ability (excluding this `pokemon`)
    const ruinVesselCount = Math.max(ruinCounts.vessel - (ability === 'vesselofruin' ? ruinCounts.vessel : 0), 0);

    if (ruinVesselCount) {
      record.apply('spa', 0.75, 'abilities', 'Vessel of Ruin');
    }
  }

  // apply weather effects
  const weather = id(field.weather);

  const ignoreWeather = [
    ability,
    opponentAbility,
  ].filter(Boolean).some((a) => ['airlock', 'cloudnine'].includes(a));

  if (weather && !ignoreWeather) {
    // note: see WeatherMap in weather consts for the sanitized value
    // (e.g., `weather` will be `'sand'`, not `'sandstorm'`)
    if (weather === 'sand') {
      // 50% SPD boost if Rock type w/ darude sandstorm (gens 4+)
      if (types.includes('Rock') && gen > 3) {
        record.apply('spd', 1.5, 'field', 'Darude Sandstorm');
      }

      // 2x SPE modifier if ability is "Sand Rush" w/ sarude dandstorm
      if (ability === 'sandrush') {
        record.apply('spe', 2, 'abilities', 'Sand Rush');
      }
    }

    // 2x SPE modifier if ability is "Slush Rush" w/ hail/snow
    if (['hail', 'snow'].includes(weather) && ability === 'slushrush') {
      record.apply('spe', 2, 'abilities', 'Slush Rush');
    }

    // 50% DEF boost if Ice type w/ "snow" only (gen 9)
    if (weather === 'snow' && types.includes('Ice')) {
      record.apply('def', 1.5, 'field', 'Snow');
    }

    if (ignoreItem || item !== 'utilityumbrella') {
      if (['sun', 'harshsunshine'].includes(weather)) {
        // 50% SPA boost if ability is "Solar Power", sunny/desolate, and Pokemon is NOT holding "Utility Umbrella"
        if (ability === 'solarpower') {
          record.apply('spa', 1.5, 'abilities', 'Solar Power');
        }

        // 2x SPE modifier if ability is "Chlorophyll", sunny/desolate, and Pokemon is NOT holding "Utility Umbrella"
        if (ability === 'chlorophyll') {
          record.apply('spe', 2, 'abilities', 'Chlorophyll');
        }

        // 30% ATK boost if ability is "Orichal Cumpulse" (hehe), sunny/desolate, and Pokemon is NOT holding "Utility Umbrella"
        if (ability === 'orichalcumpulse') { // "...uhm but actually, it's Orichalcum Pulse"
          record.apply('atk', 1.3, 'abilities', 'Orichalcum Pulse');
        }

        /**
         * @todo *Properly* implement support for ally Pokemon, notably Cherrim's "Flower Gift".
         * @see https://github.com/smogon/pokemon-showdown-client/blob/master/src/battle-tooltips.ts#L1098-L1109
         */
        // 50% ATK/SPD boost if ability is "Flower Gift" and sunny/desolate
        if (ability === 'flowergift' && (gen <= 4 || baseForme === 'cherrim')) {
          record.apply('atk', 1.5, 'abilities', 'Flower Gift');
        }
      }
    }

    // 2x SPE modifier if ability is "Swift Swim" and rain/primordial
    if (['rain', 'heavyrain'].includes(weather) && ability === 'swiftswim') {
      record.apply('spe', 2, 'abilities', 'Swift Swim');
    }
  }

  // 50% ATK/SPA reduction if ability is "Defeatist" and HP is 50% or less
  // yoo when tf did they make me into an ability lmaooo
  if (ability === 'defeatist' && hpPercentage <= 0.5) {
    record.apply('atk', 0.5, 'abilities', 'Defeatist');
    record.apply('spa', 0.5, 'abilities', 'Defeatist');
  }

  // apply additional status effects
  if (status) {
    if (ability === 'marvelscale') {
      record.apply('def', 1.5, 'abilities', 'Marvel Scale');
    }
  }

  // apply NFE (not fully evolved) effects
  const nfe = notFullyEvolved(species);

  if (nfe) {
    // 50% DEF/SPD boost if "Eviolite" is held by an NFE Pokemon
    if (!ignoreItem && item === 'eviolite') {
      record.apply('def', 1.5, 'items', 'Eviolite');
      record.apply('spd', 1.5, 'items', 'Eviolite');
    }
  }

  // apply terrain effects
  const terrain = id(field.terrain);

  // 50% DEF boost if ability is "Grass Pelt" w/ terrain of the grassy nature
  if (ability === 'grasspelt' && terrain === 'grassy') {
    record.apply('def', 1.5, 'abilities', 'Grass Pelt');
  }

  if (terrain === 'electric') {
    // 2x SPE modifier if ability is "Surge Surfer" w/ electric terrain
    if (ability === 'surgesurfer') {
      record.apply('spe', 2, 'abilities', 'Surge Surfer');
    }

    // 30% SPA boost if ability is "Hadron Engine" w/ electric terrain
    if (ability === 'hadronengine') {
      record.apply('spa', 1.3, 'abilities', 'Hadron Engine');
    }
  }

  // apply player side conditions
  // const fieldSideKey = playerKey === 'p1' ? 'attackerSide' : 'defenderSide';
  // const playerSide = field[fieldSideKey];
  const { side: playerSide } = player || {};

  // 2x SPE modifier if "Tailwind" is active on the field
  if (playerSide?.isTailwind) {
    record.apply('spe', 2, 'field', 'Tailwind');
  }

  // 0.25x SPE modifier if "Grass Pledge" is active on the field
  if (playerSide?.isGrassPledge) {
    record.apply('spe', 0.25, 'field', 'Grass Pledge');
  }

  // 10% ATK/SPA boost for each fainted Pokemon if ability is "Supreme Overlord" (gen 9)
  // update: whoops, it's actually a base power mod >:(
  // if (ability === 'supremeoverlord' && playerSide?.faintedCount > 0) {
  //   const { faintedCount } = playerSide;
  //   const modifier = 1 + (0.1 * faintedCount);
  //   const label = `Supreme Overlord ${faintedCount > 1 ? `${times}${faintedCount}` : ''}`;
  //
  //   record.apply('atk', modifier, 'abilities', label);
  //   record.apply('spa', modifier, 'abilities', label);
  // }

  // apply toggleable abilities
  if (pokemon.abilityToggled) {
    // 50% ATK/SPE reduction if ability is "Slow Start"
    if (ability === 'slowstart') {
      record.apply('atk', 0.5, 'abilities', 'Slow Start');
      record.apply('spe', 0.5, 'abilities', 'Slow Start');
    }

    // 2x SPE modifier if ability is "Unburden" and item was removed
    if (ability === 'unburden') {
      record.apply('spe', 2, 'abilities', 'Unburden');
    }

    /**
     * @todo Implement ally Pokemon support for "Minus" and "Plus" toggleable abilities.
     * @see https://github.com/smogon/pokemon-showdown-client/blob/master/src/battle-tooltips.ts#L1159-L1172
     */

    // 30% highest stat boost (or 1.5x SPE modifier) if ability is "Protosynthesis" or "Quark Drive"
    // update (2023/05/15): highest boosted stat can now be overwritten by specifying pokemon.boostedStat
    // (which it is, wherever highestBoostedStat is declared above)
    if (['protosynthesis', 'quarkdrive'].includes(ability) && highestBoostedStat) {
      // if the Pokemon has a booster volatile, use its reported stat
      // e.g., 'protosynthesisatk' -> boosterVolatileStat = 'atk'
      // const boosterVolatile = Object.keys(pokemon.volatiles || {}).find((k) => /^(?:proto|quark)/i.test(k));
      // const boosterVolatileStat = <Showdown.StatNameNoHp> boosterVolatile?.replace(/(?:protosynthesis|quarkdrive)/i, '');
      // const stat = boosterVolatileStat || highestBoostedStat;

      record.apply(
        highestBoostedStat,
        highestBoostedStat === 'spe' ? 1.5 : 1.3,
        'abilities',
        dex.abilities.get(ability)?.name || ability,
      );
    }
  }

  return record.export();
};
