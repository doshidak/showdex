import { formatId } from '@showdex/utils/app';
import { getDexForFormat } from '@showdex/utils/battle';
import type { GenerationNum } from '@smogon/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon, CalcdexMoveOverride } from '@showdex/redux/store';
import { alwaysCriticalHits } from './alwaysCriticalHits';
import { calcHiddenPower } from './calcHiddenPower';
import { determineMoveTargets } from './determineMoveTargets';

/**
 * Returns a `CalcdexMoveOverride` containing the default values for the passed-in `moveName`.
 *
 * * `pokemon` argument is only used to pass into `determineMoveTargets()`.
 * * If any of the arguments are invalid, `null` will be returned.
 *
 * @since 1.0.6
 */
export const getMoveOverrideDefaults = (
  pokemon: CalcdexPokemon,
  moveName: MoveName,
  format: string | GenerationNum,
): CalcdexMoveOverride => {
  if (!pokemon?.speciesForme || !moveName || !format) {
    return null;
  }

  const dex = getDexForFormat(format);

  const {
    type,
    category,
    basePower: basePowerFromDex,
    zMove,
    maxMove,
  } = dex?.moves.get(moveName) || {};

  const basePower = formatId(moveName).includes('hiddenpower')
    ? calcHiddenPower(format, pokemon)
    : basePowerFromDex;

  const criticalHit = alwaysCriticalHits(moveName, format);

  const {
    ignoreDefensive,
    overrideDefensiveStat,
    overrideOffensiveStat,
  } = determineMoveTargets(pokemon, moveName, format) || {};

  return {
    type,
    category,
    basePower,
    zBasePower: zMove?.basePower,
    maxBasePower: maxMove?.basePower,
    alwaysCriticalHits: criticalHit,
    defensiveStat: ignoreDefensive ? 'ignore' : overrideDefensiveStat,
    offensiveStat: overrideOffensiveStat,
  };
};
