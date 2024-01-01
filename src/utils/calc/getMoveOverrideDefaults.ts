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
  const ability = dirtyAbility || revealedAbility;
  const item = dirtyItem ?? revealedItem;

  const {
    type: typeFromDex,
    category: categoryFromDex,
    zMove,
    maxMove,
    multihit,
  } = dexMove;

  // update (2023/07/27): running the type through getDynamicMoveType() now to handle moves like Raging Bull & Revelation Dance
  const type = getDynamicMoveType(pokemon, moveName, {
    format,
    field,
  }) || typeFromDex;

  // only doing this for 1 move atm, so not making it into a function... yet o_O
  const stellarastallized = teraType === 'Stellar' && terastallized;
  let category = categoryFromDex;

  if (moveName === 'Tera Blast' as MoveName && stellarastallized) {
    const { atk, spa } = calcBoostedStats(format, pokemon);

    if (atk > spa) {
      category = 'Physical';
    }
  }

  // update (2023/02/02): came across G-Max Fireball on a Cinderace-Gmax, which showed 140 BP.
  // turns out we need to separately lookup G-Max moves since maxMove.basePower refers to Max Flare.
  const gmaxMoveName = (
    speciesForme.includes('-Gmax')
      && getMaxMove(moveName, {
        moveType: type,
        speciesForme,
        ability,
      })
  ) || null;

  const gmaxBasePower = (
    gmaxMoveName?.startsWith('G-Max')
      && dex.moves.get(gmaxMoveName)?.basePower
  ) || 0;

  const basePower = calcMoveBasePower(format, pokemon, moveName, {
    opponentPokemon,
    field,
  });

  const criticalHit = alwaysCriticalHits(moveName, format);

  const minHits = (typeof multihit === 'number' && multihit) || (Array.isArray(multihit) && multihit[0]) || null;
  const maxHits = (typeof multihit === 'number' && multihit) || (Array.isArray(multihit) && multihit[1]) || null;
  const hits = (typeof multihit === 'number' && multihit)
    || clamp(
      0,
      !!minHits
        && !!maxHits
        && (
          (ability === 'Skill Link' as AbilityName && clamp(minHits, 5, maxHits))
            || (item === 'Loaded Dice' as ItemName && clamp(minHits, 4, maxHits))
            || Math.floor((minHits + maxHits) / 2)
        ),
    )
    || null;

  const defaultDefensiveStat: Showdown.StatNameNoHp = (
    (category === 'Physical' && 'def')
      || (category === 'Special' && 'spd')
  ) || null;

  const defaultOffensiveStat: Showdown.StatNameNoHp = (
    (category === 'Physical' && 'atk')
      || (category === 'Special' && 'spa')
  ) || null;

  const {
    // ignoreDefensive,
    overrideDefensiveStat,
    overrideOffensiveStat,
  } = determineMoveTargets(format, pokemon, moveName) || {};

  return {
    type,
    category,
    basePower,
    zBasePower: zMove?.basePower,
    maxBasePower: gmaxBasePower || maxMove?.basePower,
    hits,
    minHits,
    maxHits,
    alwaysCriticalHits: criticalHit,
    stellar: (stellarastallized && !stellarMoveMap?.[type]) || null,
    defensiveStat: overrideDefensiveStat || defaultDefensiveStat,
    offensiveStat: overrideOffensiveStat || defaultOffensiveStat,
  };
};
