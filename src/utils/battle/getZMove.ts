import { logger } from '@showdex/utils/debug';
import type { Generation, ItemName, MoveName } from '@pkmn/data';

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
 * @see https://github.com/smogon/damage-calc/blob/bdf9e8c39fec7670ed0ce64e1fb58d1a4dc83b73/calc/src/move.ts#L191
 * @since 0.1.2
 */
export const getZMove = (
  dex: Generation,
  moveName: MoveName,
  itemName?: ItemName,
): MoveName => {
  if (typeof dex?.moves?.get !== 'function') {
    l.warn(
      'passed-in dex object is invalid cause dex.moves.get() is not a function',
      '\n', 'typeof dex.moves.get', typeof dex?.moves?.get,
      '\n', 'moveName', moveName,
      '\n', 'itemName', itemName,
    );

    return null;
  }

  const move = dex.moves.get(moveName);

  if (!move?.name) {
    l.warn(
      'passed-in moveName is not a valid move!',
      '\n', 'move', move,
      '\n', 'moveName', moveName,
      '\n', 'itemName', itemName,
    );

    return null;
  }

  if (!move?.zMove?.basePower) {
    return null;
  }

  const item = itemName ? dex.items.get(itemName) : null;

  // if (!item?.megaEvolves) {
  //   return null;
  // }

  if (move.name.includes('Hidden Power')) {
    return PokemonZMoveTypings.Normal;
  }

  if (item?.name) {
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

  return PokemonZMoveTypings[move.type];
};
