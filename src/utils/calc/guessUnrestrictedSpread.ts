import { type GenerationNum } from '@smogon/calc';
import {
 PokemonCommonNatures, PokemonNatureBoosts, PokemonStatNames, PokemonNatureLookup,
} from '@showdex/consts/dex';
import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { detectGenFromFormat, detectLegacyGen } from '@showdex/utils/dex';
import { calcPokemonStat } from './calcPokemonStat';

const l = logger('@showdex/utils/calc/guessUnrestrictedSpread()');

/**
 * Attempts to guess the spread (nature/EVs/IVs) of the passed-in `pokemon`.
 *
 * * Client unfortunately only gives us the *final* stats after the spread has been applied.
 * * Nature Selection is done first
 *   - If a stat is too high or too low to be achieved with a neutral nature, we know it has to be modified by nature accordingly
 *   - If no stat *needs* to be boosted, the highest *final* stat will be chosen to be boosted to save the most EVs
 *   - And accordingly the lowest stat will be hindered to lose the most EVs
 * * Stat jumps are taken into consideration, with any 10 mod 11 stat value being skipped if boosted by nature
 * * If the spread is legal with the allowed total EV count, then these choices are optimal to keep under the allowance
 * * If the spread is not legal, the stats are still derived, specifically motivated to make Hackmons Cup more functional
 *
 * @since 1.3.0
 */

const solveStat = (
  gen: GenerationNum,
  stat: Showdown.StatName,
  baseStat: number,
  observedStat: number,
  level: number,
  nature: Showdown.NatureName,
): {
  iv: number;
  ev: number;
} | null => {
  // HP change to formula
  let offset = 5;
  if (stat === 'hp') {
    offset = level + 10;
  }

  let natureMultiplier = 1;

  if (nature && nature in PokemonNatureBoosts) {
    const [
      plus,
      minus,
    ] = PokemonNatureBoosts[nature];

    if (plus && stat === plus) {
      natureMultiplier = 1.1;
    }

    if (minus && stat === minus) {
      natureMultiplier = 0.9;
    }
  }

  // target X for IV EV combo
  const internal = Math.ceil(observedStat / natureMultiplier);

  let X: number;

  if (level === 100) {
    X = Math.ceil(internal - (2 * baseStat) - offset);
  } else {
    X = Math.ceil(
      ((internal - offset) * 100) / level - (2 * baseStat),
    );
  }

  // impossible stat
  if (X < 0 || X > 94) {
    return null;
  }

  const iv = Math.min(31, X);
  const ev = Math.max(0, Math.min(252, (X - iv) * 4));

  // verify
  const reconstructed = calcPokemonStat(
    gen,
    stat,
    baseStat,
    iv,
    ev,
    level,
    nature,
  );

  if (reconstructed !== observedStat) {
    return null;
  }

  return {
    iv,
    ev,
  };
};

export const guessUnrestrictedSpread = (
  format: string | GenerationNum,
  pokemon: CalcdexPokemon,
  knownNature?: Showdown.NatureName,
): Partial<CalcdexPokemonPreset> => {
  const gen = typeof format === 'string'
    ? detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'))
    : format;

  if (detectLegacyGen(gen)) {
    if (__DEV__) {
      l.warn(
        'Cannot guess a legacy spread; use guessServerLegacySpread() instead.',
        '\n', 'format', format, 'gen', gen,
        '\n', 'pokemon', pokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  if (!pokemon?.speciesForme) {
    if (__DEV__) {
      l.warn(
        'Received an invalid Pokemon', pokemon?.ident || pokemon?.speciesForme,
        '\n', 'format', format, 'gen', gen,
        '\n', 'pokemon', pokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  if (!nonEmptyObject(pokemon.baseStats)) {
    if (__DEV__) {
      l.warn(
        'No baseStats were found for Pokemon', pokemon.ident || pokemon.speciesForme,
        '\n', 'format', format, 'gen', gen,
        '\n', 'pokemon', pokemon,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  if (__DEV__ && pokemon.source !== 'server') {
    l.warn(
      'Attempting to guess the spread of non-server Pokemon', pokemon.ident || pokemon.speciesForme,
      '\n', 'format', format, 'gen', gen,
      '\n', 'pokemon', pokemon,
      '\n', '(You will only see this warning on development.)',
    );
  }

  const {
    baseStats,
    serverStats,
  } = pokemon;

  // 0 HP in serverStats indicates that the server hasn't reported the Pokemon's actual maxhp
  // (probably because they're dead, which is just dandy LOL)
  const ignoreHp = !serverStats.hp;

  // this is the spread that we'll return after guessing
  const guessedSpread: Partial<CalcdexPokemonPreset> = {
    nature: knownNature || null,
    ivs: {},
    evs: {},
  };

  const natureCombinations = guessedSpread?.nature
    ? [
      guessedSpread.nature,
      ...PokemonCommonNatures.filter((n) => n !== guessedSpread.nature),
    ].filter(Boolean)
    : PokemonCommonNatures;

  // logs of each guess (only on development)
  const logs: string[] = [];

  const forcedPlus: Showdown.StatNameNoHp[] = [];
  const forcedMinus: Showdown.StatNameNoHp[] = [];
  const allowedPlus: Showdown.StatNameNoHp[] = [];
  const allowedMinus: Showdown.StatNameNoHp[] = [];

  const statMins: Showdown.StatsTable = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };

  const statMaxes: Showdown.StatsTable = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };

  const plusMaxes: Showdown.StatsTable = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };

  const minusMaxes: Showdown.StatsTable = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };

  for (const stat of PokemonStatNames) {
    if (stat === 'hp') {
      continue;
    }

    const neutralMin = calcPokemonStat(
      gen,
      stat,
      baseStats[stat],
      0,
      0,
      pokemon.level,
      'Hardy',
    );

    const neutralMax = calcPokemonStat(
      gen,
      stat,
      baseStats[stat],
      31,
      252,
      pokemon.level,
      'Hardy',
    );

    const boostedNature = natureCombinations.find(
      (n) => PokemonNatureBoosts[n][0] === stat,
    )!;

    const hinderedNature = natureCombinations.find(
      (n) => PokemonNatureBoosts[n][1] === stat,
    )!;

    const plusMax = calcPokemonStat(
      gen,
      stat,
      baseStats[stat],
      31,
      252,
      pokemon.level,
      boostedNature,
    );

    const minusMax = calcPokemonStat(
      gen,
      stat,
      baseStats[stat],
      31,
      252,
      pokemon.level,
      hinderedNature,
    );

    statMins[stat] = neutralMin;
    statMaxes[stat] = neutralMax;
    plusMaxes[stat] = plusMax;
    minusMaxes[stat] = minusMax;

    const observed = serverStats[stat];

    // forced boosted
    if (observed > neutralMax) {
      forcedPlus.push(stat);
    }

    // forced hindered
    if (observed < neutralMin) {
      forcedMinus.push(stat);
    }

    // allowed boosted
    if (observed <= plusMax) {
      allowedPlus.push(stat);
    }

    // allowed hindered
    if (observed <= minusMax) {
      allowedMinus.push(stat);
    }
  }

  if (forcedPlus.length > 1 || forcedMinus.length > 1) {
    return null;
  }

  const plusStat = forcedPlus[0];
  const minusStat = forcedMinus[0];

  let chosenNature: Showdown.NatureName = 'Hardy';

  if (plusStat && minusStat) {
    const lookup = PokemonNatureLookup[`${plusStat}:${minusStat}`];

    if (!lookup) {
      return null;
    }

    chosenNature = lookup;
  } else if (plusStat) {
    const candidateMinus = allowedMinus
      .filter((s) => s !== plusStat)
      .sort((a, b) => serverStats[a] - serverStats[b])[0];

    if (!candidateMinus) {
      return null;
    }

    const lookup = PokemonNatureLookup[`${plusStat}:${candidateMinus}`];

    if (!lookup) {
      return null;
    }

    chosenNature = lookup;
  } else if (minusStat) {
    const candidatePlus = allowedPlus
      .filter(
        (s) => s !== minusStat &&
          // Stat jumps for enhanced stats always skip 10 mod 11
          (serverStats[s] + 1) % 11 !== 0,
      )
      .sort((a, b) => serverStats[b] - serverStats[a])[0];

    if (!candidatePlus) {
      return null;
    }

    const lookup = PokemonNatureLookup[`${candidatePlus}:${minusStat}`];

    if (!lookup) {
      return null;
    }

    chosenNature = lookup;
  }

  guessedSpread.nature = chosenNature;

  for (const stat of PokemonStatNames) {
    if (ignoreHp && stat === 'hp') {
      continue;
    }

    const spread = solveStat(
      gen,
      stat,
      baseStats[stat],
      serverStats[stat],
      pokemon.level,
      guessedSpread.nature,
    );
    if (spread) {
      guessedSpread.ivs[stat] = spread.iv;
      guessedSpread.evs[stat] = spread.ev;
    }
  }

  if (!nonEmptyObject({ ...guessedSpread.ivs, ...guessedSpread.evs })) {
      l.debug(
        'Failed to find the actual spread for Pokemon', pokemon.ident || pokemon.speciesForme,
        '\n', 'guessedSpread', guessedSpread,
        '\n', 'serverStats', serverStats,
        '\n', 'pokemon', pokemon,
        '\n', 'logs', logs,
      );
    }

    // } else {
    //   l.debug(
    //     'Returning the best guess of the spread for Pokemon', pokemon.ident || pokemon.speciesForme,
    //     '\n', 'guessedSpread', guessedSpread,
    //     '\n', 'serverStats', serverStats,
    //     '\n', 'pokemon', pokemon,
    //   );
    // }

    return guessedSpread;
};
