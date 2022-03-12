import { logger } from '@showdex/utils/debug';
import type { Generation } from '@pkmn/data';
import type { CalcdexPokemon } from './CalcdexReducer';
import type { PresetCacheHookInterface } from './usePresetCache';
// import { calcPokemonStats } from './calcPokemonStats';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';

const l = logger('Calcdex/fetchPokemonPresets');

export const fetchPokemonPresets = async (
  _dex: Generation, /** @todo refactor this out since it's no longer being used */
  cache: PresetCacheHookInterface,
  pokemon: Partial<CalcdexPokemon>,
  format: string,
): Promise<Partial<CalcdexPokemon>> => {
  const ident = detectPokemonIdent(pokemon);
  const speciesForme = detectSpeciesForme(pokemon);

  const newPokemon: Partial<CalcdexPokemon> = {
    // speciesForme, // required for calcPokemonStats()

    altAbilities: pokemon?.altAbilities ?? [],
    altItems: pokemon?.altItems ?? [],
    altMoves: pokemon?.altMoves ?? [],

    presets: pokemon?.presets ?? [],
  };

  if (!newPokemon.presets.length) {
    const newPresets = cache.get(format, speciesForme);

    newPokemon.autoPreset = !!newPresets?.length;

    if (newPresets?.length) {
      newPokemon.presets.push(...newPresets);

      if (pokemon.autoPreset) {
        const [firstPreset] = newPokemon.presets;

        l.debug(
          'auto-setting preset for Pokemon', ident, 'to', firstPreset?.name,
          '\n', 'calcdexId', firstPreset?.calcdexId,
          '\n', 'firstPreset', firstPreset,
          '\n', 'newPokemon', newPokemon,
        );

        newPokemon.preset = firstPreset?.calcdexId;

        if (firstPreset?.item) {
          // newPokemon.item = firstPreset.item;
          newPokemon.dirtyItem = firstPreset.item;
          newPokemon.altItems = firstPreset.altItems;
        }

        if (firstPreset?.ability) {
          // newPokemon.ability = firstPreset.ability;
          newPokemon.dirtyAbility = firstPreset.ability;
          newPokemon.altAbilities = firstPreset.altAbilities;
        }

        if (firstPreset?.nature) {
          newPokemon.nature = firstPreset.nature;
        }

        if (firstPreset.moves?.length) {
          newPokemon.moves = firstPreset.moves;
          newPokemon.altMoves = firstPreset.altMoves;
        }

        if (Object.keys(firstPreset?.ivs || {}).length) {
          newPokemon.ivs = { ...newPokemon.ivs, ...firstPreset.ivs };
        }

        if (Object.keys(firstPreset?.evs || {}).length) {
          newPokemon.evs = { ...newPokemon.evs, ...firstPreset.evs };
        }

        l.debug(
          'auto-set complete for Pokemon', ident,
          '\n', 'newPokemon.preset', newPokemon.preset,
          '\n', 'newPokemon', newPokemon,
        );
      }
    }
  }

  // l.debug(
  //   'fetchPokemonPresets() -> calcPokemonStats()',
  //   '\n', 'newPokemon', newPokemon,
  //   '\n', 'ident', ident,
  // );

  // calculate the stats based on what we know atm
  // update (2022/03/10): calculatedStats is now being calculated (and memoized) on the fly in PokeCalc
  // newPokemon.calculatedStats = calcPokemonStats(dex, newPokemon);

  // l.debug(
  //   'fetchPokemonPresets() <- calcPokemonStats()',
  //   '\n', 'calculatedStats', newPokemon.calculatedStats,
  //   '\n', 'newPokemon', newPokemon,
  //   '\n', 'ident', ident,
  // );

  l.debug(
    'fetchPokemonPresets() -> return newPokemon',
    '\n', 'newPokemon', newPokemon,
    '\n', 'ident', ident,
  );

  return newPokemon;
};
