import {
  PokemonInitialStats,
  PokemonSpeedReductionItems,
  PokemonStatNames,
} from '@showdex/consts/pokemon';
import { formatId as id } from '@showdex/utils/app';
import {
  countRuinAbilities,
  detectGenFromFormat,
  detectLegacyGen,
  findHighestStat,
  getDexForFormat,
  notFullyEvolved,
  ruinAbilitiesActive,
  shouldIgnoreItem,
} from '@showdex/utils/battle';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexBattleField, CalcdexPlayerKey, CalcdexPokemon } from '@showdex/redux/store';
import { calcPokemonHp } from './calcPokemonHp';

const l = logger('@showdex/utils/calc/calcPokemonFinalStats');

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
 * @see https://github.com/smogon/pokemon-showdown-client/blob/master/src/battle-tooltips.ts#L959-L1213
 * @since 0.1.3
 */
export const calcPokemonFinalStats = (
  format: GenerationNum | string,
  pokemon: DeepPartial<CalcdexPokemon>,
  opponentPokemon: DeepPartial<CalcdexPokemon>,
  field: CalcdexBattleField,
  playerKey: CalcdexPlayerKey,
): Showdown.StatsTable => {
  if (!pokemon?.speciesForme || !opponentPokemon?.speciesForme) {
    return { ...PokemonInitialStats };
  }

  const dex = getDexForFormat(format);

  // if (typeof dex?.stats?.calc !== 'function' || typeof dex?.species?.get !== 'function') {
  if (!dex) {
    if (__DEV__) {
      l.warn(
        // 'Cannot calculate stats since dex.stats.calc() and/or dex.species.get() are not available.',
        'Global Dex is unavailable for format', format,
        '\n', 'pokemon', pokemon,
        '\n', 'field', field,
        '\n', 'playerKey', playerKey,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return { ...PokemonInitialStats };
  }

  const gen = typeof format === 'string'
    ? detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'))
    : format;

  const legacy = detectLegacyGen(gen);

  const hpPercentage = calcPokemonHp(pokemon);
  const ability = id(pokemon.dirtyAbility ?? pokemon.ability);
  const opponentAbility = id(opponentPokemon.dirtyAbility ?? opponentPokemon.ability);

  const boostTable = legacy
    ? [1, 100 / 66, 2, 2.5, 100 / 33, 100 / 28, 4]
    : [1, 1.5, 2, 2.5, 3, 3.5, 4];

  const boosts: Showdown.StatsTable = {
    atk: (pokemon?.dirtyBoosts?.atk ?? pokemon?.boosts?.atk) || 0,
    def: (pokemon?.dirtyBoosts?.def ?? pokemon?.boosts?.def) || 0,
    spa: (pokemon?.dirtyBoosts?.spa ?? pokemon?.boosts?.spa) || 0,
    spd: (pokemon?.dirtyBoosts?.spd ?? pokemon?.boosts?.spd) || 0,
    spe: (pokemon?.dirtyBoosts?.spe ?? pokemon?.boosts?.spe) || 0,
  };

  const hasTransform = 'transform' in pokemon.volatiles;

  const serverStats = {
    ...(!hasTransform && pokemon.serverStats),
    hp: pokemon.serverStats?.hp,
  };

  if (!serverStats.hp) {
    delete serverStats.hp;
  }

  const currentStats: Showdown.StatsTable = {
    ...PokemonInitialStats,
    ...pokemon.baseStats,
    ...(hasTransform && pokemon.transformedBaseStats),
    ...serverStats,

    // this recalculates based on changes in the UI, so should be last!
    ...pokemon.spreadStats,
  };

  const hasFormeChange = 'formechange' in pokemon.volatiles;
  const speciesForme = hasTransform && hasFormeChange
    ? pokemon.volatiles.formechange[1]
    : pokemon.speciesForme;

  const species = dex.species.get(speciesForme);
  const baseForme = id(species?.baseSpecies);

  const types = pokemon.terastallized && pokemon.teraType
    ? [pokemon.teraType]
    : pokemon.types;

  // note: using optional chaining here (over logical OR) in case the user clears the item on purpose
  // (in which case the value of dirtyItem becomes an empty string, i.e., `''`)
  const item = id(pokemon.dirtyItem ?? pokemon.item);
  const ignoreItem = shouldIgnoreItem(pokemon, field);

  // keeps track of all speed modifiers
  // (the product of all number elements will be multiplied with SPE at the end)
  const speedMods: number[] = [];

  // swap ATK and DEF if the move "Power Trick" was used
  if ('powertrick' in pokemon.volatiles) {
    const { atk, def } = currentStats;

    currentStats.atk = def;
    currentStats.def = atk;
  }

  // apply stat boosts
  const boostedStats: Showdown.StatsTable = PokemonStatNames.reduce((stats, stat) => {
    // apply effects to non-HP stats
    if (stat === 'hp') {
      return stats;
    }

    // apply stat boosts if not 0 (cause it'd do nothing)
    const stage = boosts[stat];

    if (stage) {
      const boostValue = boostTable[Math.abs(stage)];
      const multiplier = stage > 0 ? boostValue : (1 / boostValue);

      stats[stat] = Math.floor(stats[stat] * multiplier);
    }

    return stats;
  }, { ...currentStats });

  // find out what the highest *boosted* stat is (excluding HP) for use in some abilities,
  // particularly Protosynthesis & Quark Drive (gen 9),
  // which will boost the highest stat after stage boosts are applied
  const highestBoostedStat = findHighestStat(boostedStats);

  // this will be our final return value
  const finalStats: Showdown.StatsTable = { ...boostedStats };

  // apply status condition effects
  if (pokemon.status) {
    if (!legacy && ['guts', 'quickfeet'].includes(ability)) {
      // 50% ATK boost w/ non-volatile status condition due to "Guts" (gen 3+)
      if (ability === 'guts') {
        finalStats.atk = Math.floor(finalStats.atk * 1.5);
      }

      // 50% SPE boost w/ non-volatile status condition due to "Quick Feet" (gen 4+)
      if (ability === 'quickfeet') {
        finalStats.spe = Math.floor(finalStats.spe * 1.5);
      }
    } else {
      // 50% ATK reduction when burned (all gens... probably)
      if (pokemon.status === 'brn') {
        finalStats.atk = Math.floor(finalStats.atk * 0.5);
      }

      // 75% SPE reduction when paralyzed for gens 1-6, otherwise, 50% SPE reduction
      if (pokemon.status === 'par') {
        finalStats.spe = Math.floor(finalStats.spe * (gen < 7 ? 0.25 : 0.5));
      }
    }
  }

  // finished gen 1 since it doesn't support items
  if (gen <= 1) {
    // gen 1 stats are capped to 999
    Object.entries(finalStats)
      .filter(([, value]) => value > 999)
      .forEach(([stat]) => { finalStats[stat] = 999; });

    return finalStats;
  }

  // apply gen 2-compatible item effects
  // (at this point, we should at least be gen 2)
  if (baseForme === 'pikachu' && !ignoreItem && item === 'lightball') {
    if (gen > 4) {
      // 100% ATK boost if "Light Ball" is held by a Pikachu (gen 5+)
      finalStats.atk = Math.floor(finalStats.atk * 2);
    }

    // 100% SPA boost if "Light Ball" is held by a Pikachu
    finalStats.spa = Math.floor(finalStats.spa * 2);
  }

  if (['marowak', 'cubone'].includes(baseForme) && !ignoreItem && item === 'thickclub') {
    // 100% ATK boost if "Thick Club" is held by a Marowak/Cubone
    finalStats.atk = Math.floor(finalStats.atk * 2);
  }

  if (baseForme === 'ditto' && !hasTransform && !ignoreItem) {
    if (item === 'quickpowder') {
      speedMods.push(2);
    } else if (item === 'metalpowder') {
      if (gen === 2) {
        // 50% DEF/SPD boost if "Metal Powder" is held by a Ditto (gen 2)
        finalStats.def = Math.floor(finalStats.def * 1.5);
        finalStats.spd = Math.floor(finalStats.spd * 1.5);
      } else {
        // 100% DEF boost if "Metal Powder" is held by a Ditto (gen 3+)
        finalStats.def = Math.floor(finalStats.def * 2);
      }
    }
  }

  // finished gen 2 abilities and items
  if (gen <= 2) {
    return finalStats;
  }

  // apply Dynamax effects
  const hasDynamax = 'dynamax' in pokemon.volatiles
    || pokemon.useMax;

  // 100% (2x) HP boost when Dynamaxed
  if (hasDynamax) {
    finalStats.hp *= 2;
  }

  // apply more item effects
  // (at this point, we should at least be gen 3)
  if (!ignoreItem) {
    // 50% ATK boost if "Choice Band" is held
    if (item === 'choiceband' && !hasDynamax) {
      finalStats.atk = Math.floor(finalStats.atk * 1.5);
    }

    // 50% SPA boost if "Choice Specs" is held
    if (item === 'choicespecs' && !hasDynamax) {
      finalStats.spa = Math.floor(finalStats.spa * 1.5);
    }

    if (item === 'choicescarf' && !hasDynamax) {
      speedMods.push(1.5);
    }

    // 50% SPA boost if "Assault Vest" is held
    if (item === 'assaultvest') {
      finalStats.spd = Math.floor(finalStats.spd * 1.5);
    }

    // 100% DEF boost if "Fur Coat" is held
    if (item === 'furcoat') {
      finalStats.def = Math.floor(finalStats.def * 2);
    }

    if (baseForme === 'clamperl') {
      if (item === 'deepseatooth') {
        // 100% SPA boost if "Deep Sea Tooth" is held by a Clamperl
        finalStats.spa = Math.floor(finalStats.spa * 2);
      } else if (item === 'deepseascale') {
        // 100% SPD boost if "Deep Sea Scale" is held by a Clamperl
        finalStats.spd = Math.floor(finalStats.spd * 2);
      }
    }

    if (item === 'souldew' && gen < 7 && ['latios', 'latias'].includes(baseForme)) {
      // 50% SPA/SPD boost if "Soul Dew" is held by a Latios/Latias (gens 3-6)
      finalStats.spa = Math.floor(finalStats.spa * 1.5);
      finalStats.spd = Math.floor(finalStats.spd * 1.5);
    }

    const speedReductionItems = [
      'ironball',
      ...PokemonSpeedReductionItems.map((i) => id(i)),
    ];

    if (speedReductionItems.includes(item)) {
      speedMods.push(0.5);
    }
  }

  // 100% ATK boost if ability is "Pure Power" or "Huge Power"
  if (['purepower', 'hugepower'].includes(ability)) {
    finalStats.atk = Math.floor(finalStats.atk * 2);
  }

  // 50% ATK boost if ability is "Hustle" or "Gorilla Tactics" (and not dynamaxed, for the latter only)
  if (ability === 'hustle' || (ability === 'gorillatactics' && !hasDynamax)) {
    finalStats.atk = Math.floor(finalStats.atk * 1.5);
  }

  // apply "Ruin" ability effects that'll ruin me (gen 9)
  if (ruinAbilitiesActive(field)) {
    const ruinCounts = countRuinAbilities(field);

    // 25% SPD reduction for each active Pokemon with the "Beads of Ruin" ability (excluding this `pokemon`)
    const ruinBeadsCount = Math.max(ruinCounts.beads - (ability === 'beadsofruin' ? 1 : 0), 0);

    if (ruinBeadsCount) {
      finalStats.spd = Math.floor(finalStats.spd * (0.75 ** ruinBeadsCount));
    }

    // 25% DEF reduction for each active Pokemon with the "Sword of Ruin" ability (excluding this `pokemon`)
    const ruinSwordCount = Math.max(ruinCounts.sword - (ability === 'swordofruin' ? 1 : 0), 0);

    if (ruinSwordCount) {
      finalStats.def = Math.floor(finalStats.def * (0.75 ** ruinSwordCount));
    }

    // 25% ATK reduction for each active Pokemon with the "Tablets of Ruin" ability (excluding this `pokemon`)
    const ruinTabletsCount = Math.max(ruinCounts.tablets - (ability === 'tabletsofruin' ? 1 : 0), 0);

    if (ruinTabletsCount) {
      finalStats.atk = Math.floor(finalStats.atk * (0.75 ** ruinTabletsCount));
    }

    // 25% SPA reduction for each active Pokemon with the "Vessel of Ruin" ability (excluding this `pokemon`)
    const ruinVesselCount = Math.max(ruinCounts.vessel - (ability === 'vesselofruin' ? 1 : 0), 0);

    if (ruinVesselCount) {
      finalStats.spa = Math.floor(finalStats.spa * (0.75 ** ruinVesselCount));
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
      // 50% SPD boost if Rock type w/ darude sandstorm
      if (types.includes('Rock')) {
        finalStats.spd = Math.floor(finalStats.spd * 1.5);
      }

      // 2x SPE modifier if ability is "Sand Rush" w/ sarude dandstorm
      if (ability === 'sandrush') {
        speedMods.push(2);
      }
    }

    // note: snow in gen 9 will still be 'hail' in the data, just displayed as "Snow" in the UI lmao
    if (weather === 'hail') {
      // 50% DEF boost if Ice type w/ "snow" only (gen 9)
      if (gen > 8 && types.includes('Ice')) {
        finalStats.def = Math.floor(finalStats.def * 1.5);
      }

      // 2x SPE modifier if ability is "Slush Rush" w/ hail/"snow"
      if (ability === 'slushrush') {
        speedMods.push(2);
      }
    }

    if (ignoreItem || item !== 'utilityumbrella') {
      if (['sun', 'harshsunshine'].includes(weather)) {
        // 50% SPA boost if ability is "Solar Power", sunny/desolate, and Pokemon is NOT holding "Utility Umbrella"
        if (ability === 'solarpower') {
          finalStats.spa = Math.floor(finalStats.spa * 1.5);
        }

        // 2x SPE modifier if ability is "Chlorophyll", sunny/desolate, and Pokemon is NOT holding "Utility Umbrella"
        if (ability === 'chlorophyll') {
          speedMods.push(2);
        }

        // 30% ATK boost if ability is "Orichal Cumpulse" (hehe), sunny/desolate, and Pokemon is NOT holding "Utility Umbrella"
        if (ability === 'orichalcumpulse') { // "...uhm but actually, it's Orichalcum Pulse"
          finalStats.atk = Math.floor(finalStats.atk * 1.3);
        }

        /**
         * @todo *Properly* implement support for ally Pokemon, notably Cherrim's "Flower Gift".
         * @see https://github.com/smogon/pokemon-showdown-client/blob/master/src/battle-tooltips.ts#L1098-L1109
         */
        // 50% ATK/SPD boost if ability is "Flower Gift" and sunny/desolate
        if (ability === 'flowergift' && (gen <= 4 || baseForme === 'cherrim')) {
          finalStats.atk = Math.floor(finalStats.atk * 1.5);
          finalStats.spd = Math.floor(finalStats.spd * 1.5);
        }
      }
    }

    // 2x SPE modifier if ability is "Swift Swim" and rain/primordial
    if (['rain', 'heavyrain'].includes(weather) && ability === 'swiftswim') {
      speedMods.push(2);
    }
  }

  // 50% ATK/SPA reduction if ability is "Defeatist" and HP is 50% or less
  // yoo when tf did they make me into an ability lmaooo
  if (ability === 'defeatist' && hpPercentage <= 0.5) {
    finalStats.atk = Math.floor(finalStats.atk * 0.5);
    finalStats.spa = Math.floor(finalStats.spa * 0.5);
  }

  // apply additional status effects
  if (pokemon.status) {
    if (ability === 'marvelscale') {
      // 50% DEF boost if ability is "Marvel Scale" and Pokemon is statused
      finalStats.def = Math.floor(finalStats.def * 1.5);
    }
  }

  // apply NFE (not fully evolved) effects
  const nfe = notFullyEvolved(species);

  if (nfe) {
    // 50% DEF/SPD boost if "Eviolite" is held by an NFE Pokemon
    if (!ignoreItem && item === 'eviolite') {
      finalStats.def = Math.floor(finalStats.def * 1.5);
      finalStats.spd = Math.floor(finalStats.spd * 1.5);
    }
  }

  // apply terrain effects
  const terrain = id(field.terrain);

  // 50% DEF boost if ability is "Grass Pelt" w/ terrain of the grassy nature
  if (ability === 'grasspelt' && terrain === 'grassy') {
    finalStats.def = Math.floor(finalStats.def * 1.5);
  }

  if (terrain === 'electric') {
    // 2x SPE modifier if ability is "Surge Surfer" w/ electric terrain
    if (ability === 'surgesurfer') {
      speedMods.push(2);
    }

    // 30% SPA boost if ability is "Hadron Engine" w/ electric terrain
    if (ability === 'hadronengine') {
      finalStats.spa = Math.floor(finalStats.spa * 1.3);
    }
  }

  // apply player side conditions
  const fieldSideKey = playerKey === 'p1' ? 'attackerSide' : 'defenderSide';
  const playerSide = field[fieldSideKey];

  // 2x SPE modifier if "Tailwind" is active on the field
  if (playerSide?.isTailwind) {
    speedMods.push(2);
  }

  // 0.25x SPE modifier if "Grass Pledge" is active on the field
  if (playerSide?.isGrassPledge) {
    speedMods.push(0.25);
  }

  // apply toggleable abilities
  if (pokemon.abilityToggled) {
    // 50% ATK/SPE reduction if ability is "Slow Start"
    if (ability === 'slowstart') {
      finalStats.atk = Math.floor(finalStats.atk * 0.5);
      speedMods.push(0.5);
    }

    // 2x SPE modifier if ability is "Unburden" and item was removed
    if (ability === 'unburden') {
      speedMods.push(2);
    }

    /**
     * @todo Implement ally Pokemon support for "Minus" and "Plus" toggleable abilities.
     * @see https://github.com/smogon/pokemon-showdown-client/blob/master/src/battle-tooltips.ts#L1159-L1172
     */

    // 30% highest stat boost (or 1.5x SPE modifier) if ability is "Protosynthesis" or "Quark Drive"
    if (['protosynthesis', 'quarkdrive'].includes(ability) && highestBoostedStat) {
      if (highestBoostedStat === 'spe') {
        speedMods.push(1.5);
      } else {
        finalStats[highestBoostedStat] = Math.floor(finalStats[highestBoostedStat] * 1.3);
      }
    }
  }

  // calculate the product of all the speedMods
  const speedMod = speedMods.reduce((acc, mod) => acc * mod, 1);

  // apply the speedMod, rounding down on 0.5 and below
  // (unlike Math.round(), which rounds up on 0.5 and above)
  finalStats.spe *= speedMod;
  finalStats.spe = finalStats.spe % 1 > 0.5 ? Math.ceil(finalStats.spe) : Math.floor(finalStats.spe);

  return finalStats;
};
