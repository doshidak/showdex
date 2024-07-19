import { type AbilityName, type ItemName, type MoveName } from '@smogon/calc';
import { type CalcdexBattleField, type CalcdexPokemon, type CalcdexMoveOverride } from '@showdex/interfaces/calc';
import { clamp } from '@showdex/utils/core';
import {
  alwaysCriticalHits,
  determineMoveTargets,
  getDexForFormat,
  getDynamicMoveType,
  getMaxMove,
} from '@showdex/utils/dex';
import { calcBoostedStats } from './calcBoostedStats';
import { calcMoveBasePower } from './calcMoveBasePower';
import { calcMoveHitBasePowers } from './calcMoveHitBasePowers';

/**
 * Returns a `CalcdexMoveOverride` containing the default values for the passed-in `moveName`.
 *
 * * `pokemon` argument is only used to pass into `determineMoveTargets()`.
 * * If any of the arguments are invalid, `null` will be returned.
 *
 * @todo Fix *Photon Geyser*, which requires reading from the Pokemon's final stats, which isn't available in `pokemon` atm.
 *   Definitely a thinky boi.
 * @since 1.0.6
 */
export const getMoveOverrideDefaults = (
  format: string,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
  opponentPokemon?: CalcdexPokemon,
  field?: CalcdexBattleField,
): CalcdexMoveOverride => {
  if (!pokemon?.speciesForme || !moveName || !format) {
    return null;
  }

  const dex = getDexForFormat(format);
  const dexMove = dex?.moves.get(moveName);

  if (!dexMove?.exists) {
    return null;
  }

  const {
    speciesForme,
    teraType: revealedTeraType,
    dirtyTeraType,
    terastallized,
    ability: revealedAbility,
    dirtyAbility,
    item: revealedItem,
    dirtyItem,
    stellarMoveMap,
  } = pokemon;

  const teraType = dirtyTeraType || revealedTeraType;
  const stellarastallized = teraType === 'Stellar' && terastallized;
  const ability = dirtyAbility || revealedAbility;
  const item = dirtyItem ?? revealedItem;

  const {
    type: typeFromDex,
    category: categoryFromDex,
    zMove,
    maxMove,
    multihit,
  } = dexMove;

  const output: CalcdexMoveOverride = {};

  // update (2023/07/27): running the type through getDynamicMoveType() now to handle moves like Raging Bull & Revelation Dance
  output.type = getDynamicMoveType(pokemon, moveName, {
    format,
    field,
  }) || typeFromDex;

  output.category = categoryFromDex;
  output.stellar = (stellarastallized && !stellarMoveMap?.[output.type]) || null;

  // only doing this for 1 move atm, so not making it into a function... yet o_O
  if (moveName === 'Tera Blast' as MoveName && stellarastallized) {
    const { atk, spa } = calcBoostedStats(format, pokemon);

    if (atk > spa) {
      output.category = 'Physical';
    }
  }

  output.zBasePower = zMove?.basePower;

  // update (2023/02/02): came across G-Max Fireball on a Cinderace-Gmax, which showed 140 BP.
  // turns out we need to separately lookup G-Max moves since maxMove.basePower refers to Max Flare.
  const gmaxMoveName = (
    speciesForme.includes('-Gmax')
      && getMaxMove(moveName, {
        moveType: output.type,
        speciesForme,
        ability,
      })
  ) || null;

  output.maxBasePower = (
    gmaxMoveName?.startsWith('G-Max')
      && dex.moves.get(gmaxMoveName)?.basePower
  ) || maxMove?.basePower;

  output.basePower = calcMoveBasePower(format, pokemon, moveName, {
    opponentPokemon,
    field,
  });

  output.alwaysCriticalHits = alwaysCriticalHits(moveName, format);
  output.minHits = (typeof multihit === 'number' && multihit) || (Array.isArray(multihit) && multihit[0]) || null;
  output.maxHits = (typeof multihit === 'number' && multihit) || (Array.isArray(multihit) && multihit[1]) || null;
  output.hits = (typeof multihit === 'number' && multihit) || clamp(
    0,
    !!output.minHits && !!output.maxHits && (
      (ability === 'Skill Link' as AbilityName && clamp(output.minHits, 5, output.maxHits))
        || (item === 'Loaded Dice' as ItemName && clamp(output.minHits, 4, output.maxHits))
        || Math.floor((output.minHits + output.maxHits) / 2)
    ),
  ) || null;

  if (output.hits > 1) {
    output.hitBasePowers = calcMoveHitBasePowers(format, moveName, output);
  }

  output.defensiveStat = (
    (output.category === 'Physical' && 'def')
      || (output.category === 'Special' && 'spd')
  ) || null;

  output.offensiveStat = (
    (output.category === 'Physical' && 'atk')
      || (output.category === 'Special' && 'spa')
  ) || null;

  const {
    // ignoreDefensive,
    overrideDefensiveStat,
    overrideOffensiveStat,
  } = { ...determineMoveTargets(format, pokemon, moveName) };

  if (overrideDefensiveStat) {
    output.defensiveStat = overrideDefensiveStat;
  }

  if (overrideOffensiveStat) {
    output.offensiveStat = overrideOffensiveStat;
  }

  return output;
};
