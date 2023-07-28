import { type MoveName } from '@smogon/calc';
import { type CalcdexPokemon, type CalcdexMoveOverride } from '@showdex/redux/store';
import {
  alwaysCriticalHits,
  determineMoveTargets,
  getDexForFormat,
  getDynamicMoveType,
  getMaxMove,
} from '@showdex/utils/dex';
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
): CalcdexMoveOverride => {
  if (!pokemon?.speciesForme || !moveName || !format) {
    return null;
  }

  const dex = getDexForFormat(format);

  const {
    type: typeFromDex,
    category,
    zMove,
    maxMove,
  } = dex?.moves.get(moveName) || {};

  // update (2023/07/27): running the type through getDynamicMoveType() now to handle moves like Raging Bull & Revelation Dance
  const type = getDynamicMoveType(pokemon, moveName) || typeFromDex;

  // update (2023/02/02): came across G-Max Fireball on a Cinderace-Gmax, which showed 140 BP.
  // turns out we need to separately lookup G-Max moves since maxMove.basePower refers to Max Flare.
  const gmaxMoveName = (
    pokemon.speciesForme.endsWith('-Gmax')
      && getMaxMove(moveName, pokemon.dirtyAbility || pokemon.ability, pokemon.speciesForme)
  ) || null;

  const gmaxBasePower = (
    gmaxMoveName?.startsWith('G-Max')
      && dex.moves.get(gmaxMoveName)?.basePower
  ) || 0;

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
    maxBasePower: gmaxBasePower || maxMove?.basePower,
    alwaysCriticalHits: criticalHit,
    defensiveStat: (ignoreDefensive ? 'ignore' : overrideDefensiveStat) || defaultDefensiveStat,
    offensiveStat: overrideOffensiveStat || defaultOffensiveStat,
  };
};
