import { PokemonBoostNames } from '@showdex/consts';
import { calcPokemonStats, calcPresetCalcdexId, guessServerSpread } from '@showdex/utils/calc';
import { logger } from '@showdex/utils/debug';
import type {
  // AbilityName,
  Generation,
  // ItemName,
  // MoveName,
} from '@pkmn/data';
import type {
  CalcdexMoveState,
  CalcdexPokemon,
  CalcdexPokemonPreset,
} from '@showdex/redux/store';
import { sanitizePokemon } from './sanitizePokemon';

const l = logger('@showdex/utils/battle/syncPokemon');

export const syncPokemonBoosts = (
  pokemon: CalcdexPokemon,
  clientPokemon: DeepPartial<Showdown.Pokemon>,
): CalcdexPokemon['boosts'] => {
  const newPokemon: CalcdexPokemon = { ...pokemon };

  l.debug(
    'syncPokemonBoosts()',
    '\n', 'pokemon', pokemon,
    '\n', 'clientPokemon', clientPokemon,
  );

  const boosts = PokemonBoostNames.reduce((prev, stat) => {
    const currentValue = prev[stat];
    const value = clientPokemon?.boosts?.[stat] || 0;

    // l.debug(
    //   'syncPokemonBoosts()',
    //   '\n', 'comparing stat', stat, 'currentValue', currentValue, 'with value', value,
    //   '\n', 'newPokemon', newPokemon?.ident, newPokemon,
    // );

    // l.debug(pokemon.ident, 'comparing value', value, 'and currentValue', currentValue, 'for stat', stat);

    if (value === currentValue) {
      return prev;
    }

    prev[stat] = value;

    return prev;
  }, <CalcdexPokemon['boosts']> {
    atk: newPokemon?.boosts?.atk || 0,
    def: newPokemon?.boosts?.def || 0,
    spa: newPokemon?.boosts?.spa || 0,
    spd: newPokemon?.boosts?.spd || 0,
    spe: newPokemon?.boosts?.spe || 0,
  });

  l.debug(
    'syncPokemonBoosts() -> return boosts',
    '\n', 'boosts', boosts,
    '\n', 'newPokemon', newPokemon?.ident, newPokemon,
  );

  return boosts;
};

export const syncPokemon = (
  pokemon: CalcdexPokemon,
  clientPokemon: DeepPartial<Showdown.Pokemon>,
  serverPokemon?: DeepPartial<Showdown.ServerPokemon>,
  dex?: Generation,
  format?: string,
): CalcdexPokemon => {
  const newPokemon: CalcdexPokemon = { ...pokemon };

  (<(keyof Showdown.Pokemon)[]> [
    'name',
    'speciesForme',
    // 'rawSpeciesForme',
    'hp',
    'maxhp',
    'status',
    'statusData',
    'ability',
    'baseAbility',
    // 'nature',
    'item',
    'itemEffect',
    'prevItem',
    'prevItemEffect',
    'moveTrack',
    'volatiles',
    // 'abilityToggled', // should be after volatiles
    'turnstatuses',
    'boosts',
  ]).forEach((key) => {
    const currentValue = newPokemon[<keyof CalcdexPokemon> key]; // `newPokemon` is the final synced Pokemon that will be returned at the end
    let value = clientPokemon?.[key]; // `clientPokemon` is what was changed and may not be a full Pokemon object

    if (value === undefined) {
      return;
    }

    switch (key) {
      case 'ability': {
        if (!value) {
          return;
        }

        if (value === newPokemon.dirtyAbility) {
          newPokemon.dirtyAbility = null;
        }

        break;
      }

      case 'item': {
        // ignore any unrevealed item (resulting in a falsy value) that hasn't been knocked-off/consumed/etc.
        // (this can be checked since when the item be consumed, prevItem would NOT be falsy)
        if ((!value || value === '(exists)') && !clientPokemon?.prevItem) {
          return;
        }

        // clear the dirtyItem if it's what the Pokemon actually has
        // (otherwise, if the item hasn't been revealed yet, `value` would be falsy,
        // but that's ok cause we have dirtyItem, i.e., no worries about clearing the user's input)
        if (value === newPokemon.dirtyItem) {
          newPokemon.dirtyItem = null;
        }

        break;
      }

      case 'prevItem': {
        // check if the item was knocked-off and is the same as dirtyItem
        // if so, clear the dirtyItem
        // (note that `value` here is prevItem, NOT item!)
        if (clientPokemon?.prevItemEffect === 'knocked off' && value === newPokemon.dirtyItem) {
          newPokemon.dirtyItem = null;
        }

        break;
      }

      case 'speciesForme': {
        if (clientPokemon?.volatiles?.formechange?.[1]) {
          [, value] = clientPokemon.volatiles.formechange;
        }

        /** @todo */
        // value = sanitizeSpeciesForme(<CalcdexPokemon['speciesForme']> value);

        break;
      }

      // case 'rawSpeciesForme': {
      //   value = clientPokemon?.speciesForme ?? newPokemon?.rawSpeciesForme ?? newPokemon?.speciesForme;
      //
      //   if (!value) {
      //     return;
      //   }
      //
      //   break;
      // }

      case 'boosts': {
        value = syncPokemonBoosts(newPokemon, clientPokemon);

        break;
      }

      case 'moves': {
        if (!(<CalcdexPokemon['moves']> value)?.length) {
          return;
        }

        break;
      }

      case 'moveTrack': {
        // l.debug('clientPokemon.moveTrack', clientPokemon?.moveTrack);

        if (clientPokemon?.moveTrack?.length) {
          newPokemon.moveState = <CalcdexMoveState> {
            ...newPokemon.moveState,
            revealed: clientPokemon.moveTrack.map((track) => track?.[0]),
          };

          // l.debug('value of type CalcdexMoveState set to', newPokemon.moveState);
        }

        break;
      }

      // case 'presets': {
      //   if (!Array.isArray(value) || !value.length) {
      //     value = currentValue;
      //   }
      //
      //   break;
      // }

      // case 'abilityToggled': {
      //   value = detectToggledAbility(clientPokemon);
      //
      //   break;
      // }

      default: break;
    }

    /** @todo this line breaks when Ditto transforms since `volatiles.transformed[1]` is `Showdown.Pokemon` (NOT `string`) */
    if (JSON.stringify(value) === JSON.stringify(currentValue)) { // kekw
      return;
    }

    /** @see https://github.com/microsoft/TypeScript/issues/31663#issuecomment-518603958 */
    (newPokemon as Record<keyof CalcdexPokemon, unknown>)[key] = <typeof value> JSON.parse(JSON.stringify(value));
  });

  // only using sanitizePokemon() to get some values back
  const sanitizedPokemon = sanitizePokemon(newPokemon);

  // update some info if the Pokemon's speciesForme changed
  // (since moveState requires async, we update that in syncBattle())
  if (pokemon.speciesForme !== newPokemon.speciesForme) {
    newPokemon.baseStats = { ...sanitizedPokemon.baseStats };
    newPokemon.types = sanitizedPokemon.types;
    newPokemon.ability = sanitizedPokemon.ability;
    newPokemon.dirtyAbility = null;
    newPokemon.abilities = sanitizedPokemon.abilities;
  }

  newPokemon.abilityToggled = sanitizedPokemon.abilityToggled;

  // fill in some additional fields if the serverPokemon was provided
  if (serverPokemon) {
    newPokemon.serverSourced = true;

    if (serverPokemon.ability) {
      const dexAbility = dex.abilities.get(serverPokemon.ability);

      if (dexAbility?.name) {
        newPokemon.ability = dexAbility.name;
        newPokemon.dirtyAbility = null;
      }
    }

    if (serverPokemon.item) {
      const dexItem = dex.items.get(serverPokemon.item);

      if (dexItem?.name) {
        newPokemon.item = dexItem.name;
        newPokemon.dirtyItem = null;
      }
    }

    // build a preset around the serverPokemon
    const guessedSpread = guessServerSpread(
      dex,
      newPokemon,
      serverPokemon,
      format?.includes('random') ? 'Hardy' : undefined,
    );

    const serverPreset: CalcdexPokemonPreset = {
      name: 'Yours',
      gen: dex.num,
      format,
      speciesForme: newPokemon.speciesForme || serverPokemon.speciesForme,
      level: newPokemon.level || serverPokemon.level,
      gender: newPokemon.gender || serverPokemon.gender || null,
      ability: newPokemon.ability,
      item: newPokemon.item,
      ...guessedSpread,
    };

    newPokemon.nature = serverPreset.nature;
    newPokemon.ivs = { ...serverPreset.ivs };
    newPokemon.evs = { ...serverPreset.evs };

    // need to do some special processing for moves
    // e.g., serverPokemon.moves = ['calmmind', 'moonblast', 'flamethrower', 'thunderbolt']
    // what we want: ['Calm Mind', 'Moonblast', 'Flamethrower', 'Thunderbolt']
    if (serverPokemon.moves?.length) {
      serverPreset.moves = serverPokemon.moves.map((moveName) => {
        const dexMove = dex.moves.get(moveName);

        if (!dexMove?.name) {
          return null;
        }

        return dexMove.name;
      }).filter(Boolean);

      newPokemon.moves = [...serverPreset.moves];
    }

    // calculate the stats with the EVs/IVs from the server preset
    // (note: same thing happens in applyPreset() in PokeInfo since the EVs/IVs from the preset are now available)
    if (typeof dex?.stats?.calc === 'function') {
      newPokemon.calculatedStats = calcPokemonStats(dex, newPokemon);
    }

    serverPreset.calcdexId = calcPresetCalcdexId(serverPreset);

    const serverPresetIndex = newPokemon.presets.findIndex((p) => p.calcdexId === serverPreset.calcdexId);

    if (serverPresetIndex > -1) {
      newPokemon.presets[serverPresetIndex] = serverPreset;
    } else {
      newPokemon.presets.unshift(serverPreset);
    }

    // disabling autoPreset since we already set the preset here
    // (also tells PokeInfo not to apply the first preset)
    newPokemon.preset = serverPreset.calcdexId;
    newPokemon.autoPreset = false;
  }

  // const calcdexId = calcPokemonCalcdexId(newPokemon);

  // if (!newPokemon?.calcdexId || newPokemon.calcdexId !== calcdexId) {
  //   newPokemon.calcdexId = calcdexId;
  // }

  // newPokemon.calcdexNonce = sanitizedPokemon.calcdexNonce;

  return newPokemon;
};
