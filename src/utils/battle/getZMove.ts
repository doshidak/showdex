import { logger } from '@showdex/utils/debug';
import type { ItemName, MoveName } from '@pkmn/data';

const PokemonZMoveTypings: Record<Showdown.TypeName, MoveName> = {
  '???': null,
  Poison: <MoveName> 'Acid Downpour',
  Fighting: <MoveName> 'All-Out Pummeling',
  Dark: <MoveName> 'Black Hole Eclipse',
  Grass: <MoveName> 'Bloom Doom',
  Normal: <MoveName> 'Breakneck Blitz',
  Rock: <MoveName> 'Continental Crush',
  Steel: <MoveName> 'Corkscrew Crash',
  Dragon: <MoveName> 'Devastating Drake',
  Electric: <MoveName> 'Gigavolt Havoc',
  Water: <MoveName> 'Hydro Vortex',
  Fire: <MoveName> 'Inferno Overdrive',
  Ghost: <MoveName> 'Never-Ending Nightmare',
  Bug: <MoveName> 'Savage Spin-Out',
  Psychic: <MoveName> 'Shattered Psyche',
  Ice: <MoveName> 'Subzero Slammer',
  Flying: <MoveName> 'Supersonic Skystrike',
  Ground: <MoveName> 'Tectonic Rage',
  Fairy: <MoveName> 'Twinkle Tackle',
};

const l = logger('@showdex/utils/app/getZMove');

/**
 * Returns the corresponding Z move for a given move.
 *
 * * As of v1.0.1, we're opting to use the global `Dex` object as opposed to the `dex` from `@pkmn/dex`
 *   since we still get back information even if we're not in the correct gen (especially in National Dex formats).
 * * Prior to v1.0.1, this would return the corresponding Z move for any Z-powerable moves, regardless of the
 *   provided `itemName`.
 *   - Now, if `itemName` is provided and `itemOnly` is `true`, only the move with the same `zMoveType` as the item will return the Z move.
 *   - Providing a falsy value for `itemOnly` (default) will function the same pre-v1.0.1.
 *   - Note that `itemOnly` only has an effect if `itemName` is valid.
 *
 * @see https://github.com/smogon/damage-calc/blob/bdf9e8c39fec7670ed0ce64e1fb58d1a4dc83b73/calc/src/move.ts#L191
 * @since 0.1.2
 */
export const getZMove = (
  // dex: Generation,
  moveName: MoveName,
  itemName?: ItemName,
  itemOnly?: boolean,
): MoveName => {
  // if (typeof dex?.moves?.get !== 'function') {
  if (typeof Dex === 'undefined') {
    if (__DEV__) {
      l.warn(
        'Global Dex object is unavailable.',
        // 'Passed-in dex object is invalid cause dex.moves.get() is not a function',
        // '\n', 'typeof dex.moves.get', typeof dex?.moves?.get,
        '\n', 'moveName', moveName,
        '\n', 'itemName', itemName,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  const move = Dex.moves.get(moveName);

  if (!move?.exists) {
    if (__DEV__) {
      l.warn(
        'Provided moveName is not a valid move!',
        '\n', 'move', move,
        '\n', 'moveName', moveName,
        '\n', 'itemName', itemName,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  // make sure the move is Z-powerable
  // (e.g., Close Combat will have a zMove.basePower of 190,
  // but Stealth Rock doesn't have a basePower property in zMove)
  if (!move?.zMove?.basePower) {
    return null;
  }

  if (move.name.includes('Hidden Power')) {
    return PokemonZMoveTypings.Normal;
  }

  const item = itemName ? Dex.items.get(itemName) : null;

  // if (!item?.megaEvolves) {
  //   return null;
  // }

  // check for speical Z moves
  if (item?.exists) {
    switch (move.name) {
      case 'Clanging Scales': {
        if (item.name === 'Kommonium Z') {
          return <MoveName> 'Clangorous Soulblaze';
        }

        break;
      }

      case 'Darkest Lariat': {
        if (item.name === 'Incinium Z') {
          return <MoveName> 'Malicious Moonsault';
        }

        break;
      }

      case 'Giga Impact': {
        if (item.name === 'Snorlium Z') {
          return <MoveName> 'Pulverizing Pancake';
        }

        break;
      }

      case 'Moongeist Beam': {
        if (item.name === 'Lunalium Z') {
          return <MoveName> 'Menacing Moonraze Maelstrom';
        }

        break;
      }

      case 'Nature\'s Madness': {
        if (item.name === 'Tapunium Z') {
          return <MoveName> 'Guardian of Alola';
        }

        break;
      }

      case 'Photon Geyser': {
        if (item.name === 'Ultranecrozium Z') {
          return <MoveName> 'Light That Burns the Sky';
        }

        break;
      }

      case 'Play Rough': {
        if (item.name === 'Mimikium Z') {
          return <MoveName> 'Let\'s Snuggle Forever';
        }

        break;
      }

      case 'Psychic': {
        if (item.name === 'Mewnium Z') {
          return <MoveName> 'Genesis Supernova';
        }

        break;
      }

      case 'Sparkling Aria': {
        if (item.name === 'Primarium Z') {
          return <MoveName> 'Oceanic Operetta';
        }

        break;
      }

      case 'Spectral Thief': {
        if (item.name === 'Marshadium Z') {
          return <MoveName> 'Soul-Stealing 7-Star Strike';
        }

        break;
      }

      case 'Spirit Shackle': {
        if (item.name === 'Decidium Z') {
          return <MoveName> 'Sinister Arrow Raid';
        }

        break;
      }

      case 'Stone Edge': {
        if (item.name === 'Lycanium Z') {
          return <MoveName> 'Splintered Stormshards';
        }

        break;
      }

      case 'Sunsteel Strike': {
        if (item.name === 'Solganium Z') {
          return <MoveName> 'Searing Sunraze Smash';
        }

        break;
      }

      case 'Thunderbolt': {
        if (item.name === 'Pikashunium Z') {
          return <MoveName> '10,000,000 Volt Thunderbolt';
        }

        if (item.name === 'Aloraichium Z') {
          return <MoveName> 'Stoked Sparksurfer';
        }

        break;
      }

      case 'Volt Tackle': {
        if (item.name === 'Pikanium Z') {
          return <MoveName> 'Catastropika';
        }

        break;
      }

      default: {
        break;
      }
    }
  }

  // if an itemName was provided and the item's Z typing doesn't match the move's typing,
  // don't bother providing the corresponding Z move (by returning null)
  if (itemOnly && item?.exists && (!item.zMoveType || move.type !== item.zMoveType)) {
    return null;
  }

  return PokemonZMoveTypings[move.type];
};
