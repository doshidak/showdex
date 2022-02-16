import { PokemonBoostNames } from '@showdex/consts';
import { logger } from '@showdex/utils/debug';
import type { CalcdexMoveState, CalcdexPokemon } from './CalcdexReducer';
import { calcPokemonCalcdexId } from './calcCalcdexId';
import { calcPokemonCalcdexNonce } from './calcCalcdexNonce';
// import { calcPokemonStats } from './calcPokemonStats';
// import { detectPokemonIdent } from './detectPokemonIdent';
// import { sanitizePokemon } from './sanitizePokemon';
import { sanitizeSpeciesForme } from './sanitizeSpeciesForme';

const l = logger('Calcdex/syncPokemon');

export const syncPokemonBoosts = (
  pokemon: CalcdexPokemon,
  mutations: Partial<Showdown.Pokemon & CalcdexPokemon>,
  // checkDirty?: boolean,
): CalcdexPokemon['boosts'] => {
  const newPokemon: CalcdexPokemon = { ...pokemon };
  // const sanitized = !!mutations?.calcdexId;

  // let didChange = false;

  l.debug(
    'syncPokemonBoosts()',
    '\n', 'pokemon', pokemon,
    '\n', 'mutations', mutations,
    // '\n', 'checkDirty?', checkDirty,
  );

  const boosts = PokemonBoostNames.reduce((prev, stat) => {
    // don't override the value if modified by the user
    // if (checkDirty && newPokemon?.dirtyBoosts?.[stat]) {
    //   if (sanitized && mutations?.boosts?.[stat] !== undefined) {
    //     prev[stat] = mutations.boosts[stat];
    //   }
    //
    //   return prev;
    // }

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

    // (pokemon?.boosts as Record<Showdown.StatNameNoHp, number>)[stat] = value;
    prev[stat] = value;

    // if (!didChange) {
    //   didChange = true;
    // }

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

  // return [pokemon, didChange];
  return boosts;
};

export const syncPokemon = (
  pokemon: CalcdexPokemon,
  mutations: Partial<Showdown.Pokemon & CalcdexPokemon>,
  // checkDirty?: boolean,
): CalcdexPokemon => {
  const newPokemon: CalcdexPokemon = { ...pokemon };

  // let didChange = false;

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

    // if ((typeof value !== 'boolean' && !value) || ((typeof value === 'string' || Array.isArray(value)) && !value.length)) {
    // if (currentValue && ((!value && !['string', 'number', 'boolean'].includes(typeof value)) || (Array.isArray(value) && !value.length))) {
    // if (value === null || value === undefined) {
    //   return;
    // }

    switch (key) {
      // case 'ability':
      // case 'item':
      case 'nature': { // could be from a ServerPokemon
        if (!value) {
          return;
        }

        break;
      }

      // case 'item': {
      //   if (checkDirty && newPokemon.dirtyItem) {
      //     return;
      //   }
      //
      //   break;
      // }

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

    // if (!didChange) {
    //   didChange = true;
    // }
  });

  const calcdexId = calcPokemonCalcdexId(newPokemon);

  if (!newPokemon?.calcdexId || newPokemon.calcdexId !== calcdexId) {
    newPokemon.calcdexId = calcdexId;
  }

  newPokemon.calcdexNonce = calcPokemonCalcdexNonce(newPokemon);

  // return [pokemon, didChange];
  return newPokemon;
};

// export const syncPokemon = (
//   player: Showdown.Side,
//   source: CalcdexPokemon[],
//   checkDirty?: boolean,
// ): CalcdexPokemon[] => {
//   // const pokemonSource = [...(source || [] as CalcdexPokemon[])];
//   const pokemonSource = Array.isArray(source) ? source : <(Showdown.Pokemon & CalcdexPokemon)[]> [];
//
//   if (!Array.isArray(pokemonSource)) {
//     l.warn('pokemonSource is not an array for some reason... w0t?', pokemonSource);
//
//     // return [] as CalcdexPokemon[];
//     return null;
//   }
//
//   if (!player?.pokemon?.length) {
//     l.warn('received no pokemon to update from battle', player?.pokemon);
//
//     // return [] as CalcdexPokemon[];
//     return null;
//   }
//
//   const { sideid } = player || {};
//
//   if (!sideid) {
//     l.warn('received no sideid from player arg', player);
//
//     // return [] as CalcdexPokemon[];
//     return null;
//   }
//
//   let didChange = false;
//
//   player.pokemon.forEach((mon, i) => {
//     // const ident = mon?.ident || [mon?.side?.sideid || player?.sideid, mon?.name || mon?.details?.split?.(', ')?.[0]].filter(Boolean).join(': ');
//     const ident = detectPokemonIdent(mon);
//
//     if (!ident) {
//       l.warn('received an invalid pokemon from battle at index', i, 'for sideid', sideid, mon);
//
//       return;
//     }
//
//     const index = pokemonSource.findIndex((p) => p?.ident === ident);
//
//     if (index < 0) {
//       // determine if we should add this new mon directly to the state
//       // (since it doesn't exist in the state yet [i.e., index is probs -1])
//       if (pokemonSource.length < 6) {
//         pokemonSource.push(sanitizePokemon(mon));
//
//         l.debug('added new pokemon with ident', ident, 'to pokemonSource; new length', pokemonSource.length);
//
//         if (!didChange) {
//           didChange = true;
//         }
//       }
//
//       return;
//     }
//
//     const pokemon = pokemonSource[index];
//
//     if (!pokemon?.ident) {
//       l.warn('pokemon at index', index, 'for sideid', sideid, 'has no ident... hmm', pokemon);
//
//       return;
//     }
//
//     // only update what's necessary, as to not overwrite any of the user's changes
//     // if (typeof mon.hp === 'number' && mon.hp !== pokemon.hp) {
//     //   // (originalCurHp will be updated by PokeCalc based on the pokemon's `hp` value)
//     //   pokemon.hp = mon.hp;
//     // }
//
//     const [statsPokemon, didChangeStats] = syncPokemonStats(pokemonSource[index], <Showdown.Pokemon & CalcdexPokemon> mon, checkDirty);
//
//     if (didChangeStats) {
//       pokemonSource[index] = statsPokemon;
//
//       if (!didChange) {
//         didChange = true;
//       }
//     }
//
//     const [boostedPokemon, didChangeBoosts] = syncPokemonBoosts(pokemonSource[index], <Showdown.Pokemon & CalcdexPokemon> mon, checkDirty);
//
//     if (didChangeBoosts) {
//       pokemonSource[index].boosts = boostedPokemon.boosts;
//
//       if (!didChange) {
//         didChange = true;
//       }
//     }
//
//     if (pokemonSource[index].statusData?.toxicTurns) {
//       pokemonSource[index].toxicCounter = pokemonSource[index].statusData.toxicTurns;
//
//       if (!didChange) {
//         didChange = true;
//       }
//     }
//
//     // pokemonSource[index] = pokemon;
//   });
//
//   l.debug(
//     'pokemonSource for sideid', sideid, pokemonSource,
//     '\n', 'didChange?', didChange,
//   );
//
//   if (!didChange) {
//     // return [] as CalcdexPokemon[];
//     return null;
//   }
//
//   // (sideid === 'p2' ? setP2Pokemon : setP1Pokemon)(pokemonSource);
//   return pokemonSource;
// };
