import { PokemonBoostNames } from '@showdex/consts';
import { logger } from '@showdex/utils/debug';
import type { CalcdexMoveState, CalcdexPokemon } from './CalcdexReducer';
import { calcPokemonCalcdexId } from './calcCalcdexId';
import { calcPokemonCalcdexNonce } from './calcCalcdexNonce';
import { sanitizeSpeciesForme } from './sanitizeSpeciesForme';

const l = logger('Calcdex/syncPokemon');

export const syncPokemonBoosts = (
  pokemon: CalcdexPokemon,
  mutations: Partial<Showdown.Pokemon & CalcdexPokemon>,
): CalcdexPokemon['boosts'] => {
  const newPokemon: CalcdexPokemon = { ...pokemon };

  l.debug(
    'syncPokemonBoosts()',
    '\n', 'pokemon', pokemon,
    '\n', 'mutations', mutations,
  );

  const boosts = PokemonBoostNames.reduce((prev, stat) => {
    const currentValue = prev[stat];
    const value = mutations?.boosts?.[stat] || 0;

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
  mutations: Partial<Showdown.Pokemon & CalcdexPokemon>,
): CalcdexPokemon => {
  const newPokemon: CalcdexPokemon = { ...pokemon };

  ([
    // 'serverSourced',
    'speciesForme',
    'hp',
    'maxhp',
    'status',
    'statusData',
    // 'types',
    'ability',
    'baseAbility',
    // 'abilities',
    'nature',
    // 'natures',
    'item',
    // 'dirtyItem',
    'itemEffect',
    'prevItem',
    'prevItemEffect',
    // 'ivs',
    // 'evs',
    // 'moves',
    'moveTrack',
    // 'moveState',
    'volatiles',
    'turnstatuses',
    'boosts',
    // 'dirtyBoosts',
    // 'calculatedStats',
    // 'preset',
    // 'presets',
    // 'autoPreset',
    // 'criticalHit',
    // 'toxicCounter',
  ] as (keyof CalcdexPokemon)[]).forEach((key) => {
    const currentValue = newPokemon[key];
    let value = mutations?.[key];

    switch (key) {
      case 'nature': { // could be from a ServerPokemon
        if (!value) {
          return;
        }

        break;
      }

      case 'speciesForme': {
        if (mutations?.volatiles?.formechange?.[1]) {
          [, value] = mutations.volatiles.formechange;
        }

        value = sanitizeSpeciesForme(<CalcdexPokemon['speciesForme']> value);

        break;
      }

      case 'boosts': {
        // value = syncPokemonBoosts(newPokemon, mutations, checkDirty);
        value = syncPokemonBoosts(newPokemon, mutations);

        break;
      }

      case 'moves': {
        if (!(<CalcdexPokemon['moves']> value)?.length) {
          return;
        }

        break;
      }

      case 'moveTrack': {
        // l.debug('mutations.moveTrack', mutations?.moveTrack);

        if (mutations?.moveTrack?.length) {
          newPokemon.moveState = <CalcdexMoveState> {
            ...newPokemon.moveState,
            revealed: mutations.moveTrack.map((track) => track?.[0]),
          };

          // l.debug('value of type CalcdexMoveState set to', newPokemon.moveState);
        }

        break;
      }

      case 'presets': {
        if (!Array.isArray(value) || !value.length) {
          value = currentValue;
        }

        break;
      }

      default: break;
    }

    if (JSON.stringify(value) === JSON.stringify(currentValue)) { // kekw
      return;
    }

    /** @see https://github.com/microsoft/TypeScript/issues/31663#issuecomment-518603958 */
    (newPokemon as Record<keyof CalcdexPokemon, unknown>)[key] = value;
  });

  const calcdexId = calcPokemonCalcdexId(newPokemon);

  if (!newPokemon?.calcdexId || newPokemon.calcdexId !== calcdexId) {
    newPokemon.calcdexId = calcdexId;
  }

  newPokemon.calcdexNonce = calcPokemonCalcdexNonce(newPokemon);

  return newPokemon;
};
