import { Move as SmogonMove } from '@smogon/calc';
import { formatId } from '@showdex/utils/app';
import {
  getGenDexForFormat,
  getMaxMove,
  getZMove,
  detectGenFromFormat,
} from '@showdex/utils/battle';
import { env } from '@showdex/utils/core';
import type { GenerationNum } from '@smogon/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { alwaysCriticalHits } from './alwaysCriticalHits';
import { calcHiddenPower } from './calcHiddenPower';

export const createSmogonMove = (
  format: string,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
): SmogonMove => {
  // using the Dex global for the gen arg of SmogonMove seems to work here lol
  const dex = getGenDexForFormat(format);
  const gen = detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'));

  if (!dex || !format || !pokemon?.speciesForme || !moveName) {
    return null;
  }

  const ability = pokemon.dirtyAbility ?? pokemon.ability;
  const item = pokemon.dirtyItem ?? pokemon.item;

  // may need to perform an additional lookup using @smogon/calc's internal Generation dex
  // (which is used when passing in a type number for the first constructor parameter)
  const lookupMove = new SmogonMove(gen, moveName);

  return new SmogonMove(dex, moveName, {
    species: pokemon.speciesForme,

    ability,
    item,

    // only apply one of them, not both!
    useZ: pokemon.useZ && !pokemon.useMax,
    useMax: pokemon.useMax,

    // for moves that always crit, we need to make sure the crit doesn't apply when Z/Max'd
    isCrit: (
      alwaysCriticalHits(moveName, format)
        && (!pokemon.useZ || !getZMove(moveName, item))
        && (!pokemon.useMax || !getMaxMove(moveName, ability, pokemon.speciesForme))
    ) || pokemon.criticalHit,

    overrides: {
      // recalculate the base power if the move is Hidden Power
      ...(formatId(moveName).includes('hiddenpower') && {
        basePower: calcHiddenPower(format, pokemon) || undefined,
      }),

      // if an invalid move, `type` here will be `undefined`
      ...(!!lookupMove?.type && {
        overrideDefensivePokemon: lookupMove.overrideDefensivePokemon,
        overrideDefensiveStat: lookupMove.overrideDefensiveStat,
        overrideOffensivePokemon: lookupMove.overrideOffensivePokemon,
        overrideOffensiveStat: lookupMove.overrideOffensiveStat,
      }),
    },
  });
};
