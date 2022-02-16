import { logger } from '@showdex/utils/debug';
import type {
  // AbilityName,
  Generation,
  // GenerationNum,
  // ID as PkmnID,
  // ItemName,
  // MoveName,
} from '@pkmn/data';
// import type { Smogon as PkmnSmogon } from '@pkmn/smogon';
import type { CalcdexPokemon } from './CalcdexReducer';
import type { PresetCacheHookInterface } from './usePresetCache';
import { calcPokemonStats } from './calcPokemonStats';
import { detectGenFromFormat } from './detectGenFromFormat';
// import { detectPlayerKeyFromPokemon } from './detectPlayerKey';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';
// import { fetchSmogonPresets } from './fetchSmogonPresets';
// import { fetchSmogonRandomPresets } from './fetchSmogonRandomPresets';
// import { sanitizePresets } from './sanitizePresets';

const l = logger('Calcdex/fetchPokemonPresets');

export const fetchPokemonPresets = async (
  dex: Generation,
  // smogon: PkmnSmogon,
  cache: PresetCacheHookInterface,
  pokemon: Partial<CalcdexPokemon>,
  format: string,
): Promise<Partial<CalcdexPokemon>> => {
  const ident = detectPokemonIdent(pokemon);
  const speciesForme = detectSpeciesForme(pokemon);
  // const playerKey = detectPlayerKeyFromPokemon(pokemon);

  // const newPokemon = { ...pokemon };
  const newPokemon: Partial<CalcdexPokemon> = {
    // ident: pokemon?.ident,
    speciesForme, // required for calcPokemonStats()

    altAbilities: pokemon?.altAbilities ?? [],
    altItems: pokemon?.altItems ?? [],
    altMoves: pokemon?.altMoves ?? [],

    // moveState: {
    //   revealed: pokemon?.moveState?.revealed ?? [],
    //   learnset: pokemon?.moveState?.learnset ?? [],
    //   other: pokemon?.moveState?.other ?? [],
    // },

    presets: pokemon?.presets ?? [],
  };

  // if ('moves' in newPokemon) {
  //   delete newPokemon.moves;
  // }

  // if (typeof dex?.learnsets?.learnable === 'function') {
  //   l.debug(
  //     'fetchPokemonPresets() -> await dex.learnsets.learnable(', pokemon.speciesForme, ')',
  //     '\n', 'ident', ident,
  //   );
  //
  //   const learnset = await dex.learnsets.learnable(pokemon.speciesForme);
  //
  //   newPokemon.moveState.learnset = Object.keys(learnset || {})
  //     .map((moveid) => dex.moves.get(moveid)?.name)
  //     .filter((name) => !!name && !newPokemon.moveState.revealed.includes(name))
  //     .sort();
  //
  //   l.debug(
  //     'fetchPokemonPresets() <- await dex.learnsets.learnable(', pokemon.speciesForme, ')',
  //     '\n', 'learnset for', ident, 'set to', newPokemon.moveState.learnset,
  //   );
  // }

  // build `other`, only if we have no `learnsets` or the `format` has something to do with hacks
  // if (!newPokemon.moveState.learnset.length || (format && /anythinggoes|hackmons/i.test(format))) {
  //   l.debug(
  //     'fetchPokemonPresets() -> BattleMovedex',
  //     '\n', 'ident', ident,
  //   );
  //
  //   newPokemon.moveState.other = Object.keys(BattleMovedex)
  //     .map((moveid) => dex.moves.get(moveid)?.name)
  //     .filter((name) => !!name && !newPokemon.moveState.revealed.includes(name))
  //     .sort();
  //
  //   l.debug(
  //     'fetchPokemonPresets() <- BattleMovedex',
  //     '\n', 'other moves for', ident, 'set to', newPokemon.moveState.other,
  //     '\n', 'ident', ident,
  //   );
  // }

  // if (!newPokemon.presets.length) {
  //   delete newPokemon.presets;
  //
  //   dispatch({
  //     type: `@${playerKey}/pokemon:put`,
  //     payload: newPokemon,
  //   });
  // }

  // find available presets
  // const presetPokemon: Partial<CalcdexPokemon> = {
  //   ...newPokemon,
  //   ident,
  //   speciesForme: newPokemon.speciesForme,
  // };

  // if (typeof smogon?.sets !== 'function') {
  //   l.warn(
  //     'fetchPokemonPresets() -> smogon.sets()',
  //     '\n', 'failed to download Smogon sets for pokemon', ident, 'since smogon.sets() is unavailable',
  //   );
  // } else

  if (!newPokemon.presets.length) {
    // const gen = detectGenFromFormat(format);

    /**
     * @todo add support for random battles via `@pkmn/randbats`
     * @see https://github.com/pkmn/randbats
     */
    // const isRandom = !!format?.includes?.('random');

    // l.debug(
    //   'fetchPokemonPresets() -> await smogon.sets()',
    //   '\n', 'species', pokemon.speciesForme,
    //   '\n', 'isRandom?', isRandom,
    //   '\n', 'format', isRandom ? null : format,
    //   '\n', 'ident', ident,
    // );

    // const newPresets = await smogon.sets(
    //   dex,
    //   pokemon.speciesForme,
    //   isRandom ? null : format as PkmnID, /** @todo */
    // );

    // l.debug(
    //   'fetchPokemonPresets() <- await smogon.sets()',
    //   '\n', 'downloaded Smogon sets for pokemon', ident,
    //   '\n', 'newPresets', newPresets,
    // );

    // if (!cache.available(format) && !cache.loading) {
    //   l.debug(
    //     'fetchPokemonPresets() -> await cache.fetch()',
    //     '\n', 'fetching presets from Smogon since none are available',
    //     '\n', 'format', format,
    //     '\n', 'speciesForme', speciesForme,
    //   );
    //
    //   await cache.fetch(format);
    // }

    const newPresets = cache.get(format, speciesForme);

    // const newPresets = isRandom ?
    //   await fetchSmogonRandomPresets(newPokemon.speciesForme, format) :
    //   await fetchSmogonPresets(newPokemon.speciesForme, gen);

    newPokemon.autoPreset = !!newPresets?.length;

    if (newPresets?.length) {
      // l.debug(
      //   'fetchPokemonPresets() -> sanitizePresets()',
      //   '\n', 'newPresets', newPresets,
      //   '\n', 'newPokemon', newPokemon,
      //   '\n', 'ident', ident,
      // );

      // newPokemon.presets = sanitizePresets(newPresets);
      newPokemon.presets = newPresets;

      // l.debug(
      //   'fetchPokemonPresets() <- sanitizePresets()',
      //   '\n', 'sanitizedPresets', newPokemon.presets,
      //   '\n', 'newPokemon', newPokemon,
      //   '\n', 'ident', ident,
      // );

      if (pokemon.autoPreset) {
        // const [firstPreset] = newPresets;
        const [firstPreset] = newPokemon.presets;

        l.debug(
          'auto-setting preset for Pokemon', ident, 'to', firstPreset?.name,
          '\n', 'calcdexId', firstPreset?.calcdexId,
          '\n', 'firstPreset', firstPreset,
          '\n', 'newPokemon', newPokemon,
        );

        /**
         * @todo
         * do something about duplicate preset names
         * (across gens, like "Gen 8 OU Swords Dance" and "Gen 7 OU Swords Dance",
         * which both have the name "Swords Dance")
         */
        newPokemon.preset = firstPreset?.calcdexId;

        if (firstPreset?.item) {
          // newPokemon.item = firstPreset.item;
          newPokemon.dirtyItem = firstPreset.item;
          newPokemon.altItems = firstPreset.altItems;
        }

        // newPokemon.dirtyItem = !!firstPreset?.item;

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

  l.debug(
    'fetchPokemonPresets() -> calcPokemonStats()',
    '\n', 'newPokemon', newPokemon,
    '\n', 'ident', ident,
  );

  // calculate the stats based on what we know atm
  newPokemon.calculatedStats = calcPokemonStats(dex, newPokemon);

  l.debug(
    'fetchPokemonPresets() <- calcPokemonStats()',
    '\n', 'calculatedStats', newPokemon.calculatedStats,
    '\n', 'newPokemon', newPokemon,
    '\n', 'ident', ident,
  );

  // l.debug(
  //   'fetchPokemonPresets() -> dispatch()',
  //   '\n', 'dispatching put action for pokemon', ident,
  //   '\n', 'presetPokemon', presetPokemon,
  // );

  // d({
  //   type: `@${playerKey}/pokemon:put`,
  //   payload: presetPokemon,
  // });

  l.debug(
    'fetchPokemonPresets() -> return newPokemon',
    '\n', 'newPokemon', newPokemon,
    '\n', 'ident', ident,
  );

  // return presetPokemon;
  return newPokemon;
};
