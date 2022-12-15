// import { formatId } from '@showdex/utils/app';
import { getDexForFormat } from '@showdex/utils/battle';
// import type { GenerationNum } from '@smogon/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon, CalcdexMoveOverride } from '@showdex/redux/store';
import { alwaysCriticalHits } from './alwaysCriticalHits';
// import { calcHiddenPower } from './calcHiddenPower';
import { calcMoveBasePower } from './calcMoveBasePower';
// import { calcRageFist } from './calcRageFist';
import { determineMoveTargets } from './determineMoveTargets';

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
): CalcdexMoveOverride => {
  if (!pokemon?.speciesForme || !moveName || !format) {
    return null;
  }

  const dex = getDexForFormat(format);

  const {
    // id,
    // name,
    type,
    category,
    // basePower: basePowerFromDex,
    zMove,
    maxMove,
  } = dex?.moves.get(moveName) || {};

  // const moveId = id || formatId(name || moveName);

  // const basePower = moveId.startsWith('hiddenpower')
  //   ? calcHiddenPower(format, pokemon)
  //   : moveId === 'ragefist'
  //     ? calcRageFist(pokemon)
  //     : basePowerFromDex;

  const basePower = calcMoveBasePower(format, pokemon, moveName, opponentPokemon);
  const criticalHit = alwaysCriticalHits(moveName, format);

  const defaultDefensiveStat: Showdown.StatNameNoHp = (category === 'Physical' && 'def')
    || (category === 'Special' && 'spd')
    || null;

  const defaultOffensiveStat: Showdown.StatNameNoHp = (category === 'Physical' && 'atk')
    || (category === 'Special' && 'spa')
    || null;

  const {
    ignoreDefensive,
    overrideDefensiveStat,
    overrideOffensiveStat,
  } = determineMoveTargets(format, pokemon, moveName) || {};

  return {
    type,
    category,
    basePower,
    zBasePower: zMove?.basePower,
    maxBasePower: maxMove?.basePower,
    alwaysCriticalHits: criticalHit,
    defensiveStat: (ignoreDefensive ? 'ignore' : overrideDefensiveStat) || defaultDefensiveStat,
    offensiveStat: overrideOffensiveStat || defaultOffensiveStat,
  };
};
