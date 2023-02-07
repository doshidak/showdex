import base64 from 'base-64';
import { AllPlayerKeys } from '@showdex/consts/battle';
import { env } from '@showdex/utils/core';
import type { CalcdexBattleState } from '@showdex/redux/store';
import {
  dehydrateArray,
  dehydrateBoolean,
  dehydratePlayerSide,
  dehydrateStatsTable,
  dehydrateValue,
} from './dehydrators';

/**
 * Dehydrates (serializes) the passed-in Calcdex `state`.
 *
 * Each "root" property of the `state` is given its own "opcode":
 *
 * * `g` refers to the gen number (`state.gen`).
 * * `m` refers to the battle format (`state.format`).
 * * `p` refers to the player keys in the battle.
 * * `p#` refers to each player in the battle (e.g., `state.p1`, `state.p2`).
 * * `f` refers to the battle field (`state.field`).
 *
 * With additional properties that may be useful for debugging:
 *
 * * `v` refers to the package version (`process.env.PACKAGE_VERSION`).
 * * `b` refers to the build date (`process.env.BUILD_DATE`).
 * * `t` refers to the build target (`process.env.BUILD_TARGET`).
 * * `e` refers to the Node environment (`process.env.NODE_ENV`).
 *   - `'p'` refers to a `'production'` environment.
 *   - `'d'` refers to a `'development'` environment.
 * * `s` refers to the base-64 encoded error message, if any.
 *
 * Dehydrated `state`, whose properties are deliminated by a semi-colon (`';'`), is in the following format:
 *
 * ```
 * v:{package_version};
 * b:{build_date};
 * t:{build_target};
 * e:{node_env === 'development' ? 'd' : 'p'};
 * g:{gen};
 * m:{format};
 * p:{authPlayerKey}/{playerKey}/{opponentKey};
 * p1:{player};
 * p2:{player};
 * f:{field}
 * ```
 *
 * * Note that the output string contains no newlines (`\n`) despite being depicted in the formatting above,
 *   which is only done for readabililty purposes.
 *
 * where `{player}`, whose properties are deliminated by a pipe (`'|'`), is in the following format:
 *
 * ```
 * {name}|
 * {rating}|
 * {activeIndices[0]}[/{activeIndices[1]}...]|
 * {selectionIndex}|
 * {autoSelect}|
 * {side}|
 * {pokemon}[|{pokemon}...]
 * ```
 *
 * `{pokemon}`, whose properties are deliminated by a comma (`','`), is in the following format:
 *
 * ```
 * {slot}/{serverSourced ? 's' : 'c'},
 * {name},
 * {speciesForme}>{transformedForme},
 * {gender},
 * {level},
 * {shiny},
 * {types[0]}[/{types[1]}...]>{teraType},
 * {hp}/{maxhp}/{fainted},
 * {status}/{sleepCounter}/{toxicCounter}/{hitCounter},
 * {preset ? 'y' : 'n'},
 * {baseAbility}/{ability}~{dirtyAbility}/{abilityToggleable}/{abilityToggled},
 * {item}~{dirtyItem}/{itemEffect}/{prevItem}/{prevItemEffect},
 * {nature},
 * {baseStats.hp}/{baseStats.atk}>{transformedBaseStats.atk}/.../{baseStats.spe}~{transformedBaseStats.spe},
 * {ivs.hp}/.../{ivs.spe},
 * {evs.hp}/.../{evs.spe},
 * {serverStats.hp}/.../{serverStats.spe},
 * {boosts.atk}~{dirtyBoosts.atk}/.../{boosts.spe}~{dirtyBoosts.spe},
 * {spreadStats.hp}/.../{spreadStats.spe},
 * {useZ}/{useMax}/{terastallized}/{criticalHit},
 * {serverMoves[0]}[/{serverMoves[1]}...],
 * {moves[0]}[/{moves[1]}...],
 * {moveTrack[0][0]}+{moveTrack[0][1]}[/{moveTrack[1][0]}+{moveTrack[1][1]}...],
 * {Object.values(volatiles)[0][0]}[+{Object.values(volatiles)[0][1]}[+...]][/{Object.values(volatiles)[1][0]}[+...]...],
 * ```
 *
 * and `{field}`, whose properties are deliminated by a pipe (`'|'`), is in the following format:
 *
 * ```
 * {gameType === 'Doubles' ? 'd' : 's'}|
 * {weather}|
 * {terrain}|
 * {Object.keys(attackerSide)[0]}={Object.values(attackerSide)[0]}[/...]|
 * {Object.keys(defenderSide)[0]}={Object.values(defenderSide)[0]}[/...]
 * ```
 *
 * * For the `attackerSide` and `defenderSide` of `{field}`, only properties with truthy values are serialized.
 *   - This includes properties like `spikes`, whose value is a `number`, which wouldn't be included if its value is `0`.
 *
 * Note that for any value:
 *
 * * `null`/`undefined` are both represented by `'?'` and
 * * booleans are represented as `'y'` for `true` and `'n'` for `false`, unless otherwise noted.
 *
 * @example
 * ```ts
 * `
 * v:1.0.3;
 * b:1664325002779;
 * t:chrome;
 * e:d;
 * s:VHlwZUVycm9yOiBDYW5ub3QgcmVhZCBwcm9wZXJ0aWVzIG9mIHVuZGVmaW5lZCAocmVhZGluZyAnZGVlek51dHMnKQ==;
 * g:8;
 * m:gen8nationaldexag;
 * n:1;
 * p:p1/p1/p2;
 * p1:showdex_testee|?|0|0|y|isReflect=y/isLightScreen=y
 *   |0/s,Runerigus,Runerigus>?,F,100,n,Ground/Ghost>?,320/320/n,?/0/0/0,y,?/Wandering Spirit~?/n/n,Leftovers~?/?/?/?,Impish,58/95>?/145>?/50>?/105>?/30>?,31/31/31/31/31/31,252/0/252/0/4/0,320/226/427/122/247/96,0~?/0~?/0~?/0~?/0~?,320/226/427/122/247/96,n/n/n/n,Stealth Rock/Earthquake/Will-O-Wisp/Toxic Spikes,n/n/Stealth Rock/Earthquake/Will-O-Wisp/Toxic Spikes,Will-O-Wisp+1,
 *   |1/s,Urshifu,Urshifu-Rapid-Strike>?,M,100,n,Fighting/Water>?,341/341/n,?/0/0/0,y,?/Unseen Fist~?/n/n,Choice Band~?/?/?/?,Jolly,100/130>?/100>?/63>?/60>?/97>?,31/31/31/31/31/31,0/252/0/0/4/252,341/359/236/145/157/322,0~?/0~?/0~?/0~?/0~?,341/359/236/145/157/322,n/n/n/n,Surging Strikes/Close Combat/Aqua Jet/U-turn,n/n/Surging Strikes/Close Combat/Aqua Jet/U-turn,,
 *   |2/s,Cinderace,Cinderace>?,M,100,n,Fire>?,321/321/n,?/0/0/0,y,?/Libero~?/n/n,Heavy-Duty Boots~?/?/?/?,Jolly,80/116>?/75>?/65>?/75>?/119>?,31/31/31/31/31/31,80/164/0/0/48/216,321/309/186/149/198/360,0~?/0~?/0~?/0~?/0~?,321/309/186/149/198/360,n/n/n/n,Pyro Ball/U-turn/Court Change/Gunk Shot,n/n/Pyro Ball/U-turn/Court Change/Gunk Shot,,
 *   |3/s,Charizard,Charizard>?,F,100,n,Fire/Flying>?,297/297/n,?/0/0/0,y,?/Solar Power~?/n/n,Choice Specs~?/?/?/?,Timid,78/84>?/78>?/109>?/85>?/100>?,31/0/31/31/31/31,0/0/0/252/4/252,297/155/192/317/207/328,0~?/0~?/0~?/0~?/0~?,297/155/192/317/207/328,n/n/n/n,Weather Ball/Overheat/Focus Blast/Roost,n/n/Weather Ball/Overheat/Focus Blast/Roost,,
 *   |4/s,Gengar,Gengar>?,F,100,n,Ghost/Poison>?,261/261/n,?/0/0/0,y,?/Cursed Body~?/n/n,Black Sludge~?/?/?/?,Timid,60/65>?/60>?/130>?/75>?/110>?,31/0/31/31/31/31,0/0/0/252/4/252,261/121/156/359/187/350,0~?/0~?/0~?/0~?/0~?,261/121/156/359/187/350,n/n/n/n,Substitute/Nasty Plot/Shadow Ball/Focus Blast,n/n/Substitute/Nasty Plot/Shadow Ball/Focus Blast,,
 *   |5/s,Melmetal,Melmetal>?,N,100,n,Steel>?,443/443/n,?/0/0/0,y,?/Iron Fist~?/n/n,Assault Vest~?/?/?/?,Careful,135/143>?/143>?/80>?/65>?/34>?,31/31/31/31/31/31,128/116/0/0/252/12,443/351/322/176/251/107,0~?/0~?/0~?/0~?/0~?,443/351/322/176/251/107,n/n/n/n,Double Iron Bash/Earthquake/Ice Punch/Thunder Punch,n/n/Double Iron Bash/Earthquake/Ice Punch/Thunder Punch,,;
 * p2:showdex_tester|?|0|5|y|isAuroraVeil=y
 *   |0/c,Urshifu,Urshifu-Rapid-Strike>?,F,100,n,Fighting/Water>?,94/100/n,brn/0/0/0,y,?/?~Unseen Fist/n/n,?~Choice Band/?/?/?,Jolly,100/130>?/100>?/63>?/60>?/97>?,31/31/31/31/31/31,0/252/4/0/0/252,?/?/?/?/?/?,0~?/0~?/0~?/0~?/0~?,341/359/237/145/156/322,,n/n/n/n,Surging Strikes/Close Combat/Aqua Jet/U-turn,,
 *   |1/c,Cinderace,Cinderace>?,F,100,n,Fire>?,100/100/n,?/0/0/0,y,?/?~Blaze/n/n,?~Heavy-Duty Boots/?/?/?,Jolly,80/116>?/75>?/65>?/75>?/119>?,31/31/31/31/31/31,80/164/0/0/48/216,?/?/?/?/?/?,0~?/0~?/0~?/0~?/0~?,321/309/186/149/198/360,,n/n/n/n,Pyro Ball/U-turn/Court Change/Gunk Shot,,
 *   |2/c,Charizard,Charizard>?,F,100,n,Fire/Flying>?,1000/1000/n,?/0/0/0,y,?/?~Blaze/n/n,?~Heavy-Duty Boots/?/?/?,Timid,78/84>?/78>?/109>?/85>?/100>?,31/31/31/31/31/31,0/0/0/252/4/252,?/?/?/?/?/?,0~?/0~?/0~?/0~?/0~?,297/183/192/317/207/328,,n/n/n/n,Roost/Fire Blast/Hurricane/Defog,,
 *   |3/c,Gengar,Gengar>?,M,100,n,Ghost/Poison>?,1000/1000/n,?/0/0/0,y,?/?~Cursed Body/n/n,?~Gengarite/?/?/?,Timid,60/65>?/60>?/130>?/75>?/110>?,31/31/31/31/31/31,248/0/0/0/8/252,?/?/?/?/?/?,0~?/0~?/0~?/0~?/0~?,323/149/156/296/188/350,,n/n/n/n,Perish Song/Encore/Substitute/Destiny Bond,,
 *   |4/c,Melmetal,Melmetal>?,N,100,n,Steel>?,1000/1000/n,?/0/0/0,y,?/?~Iron Fist/n/n,?~Protective Pads/?/?/?,Adamant,135/143>?/143>?/80>?/65>?/34>?,31/31/31/31/31/31,40/252/0/0/104/112,?/?/?/?/?/?,0~?/0~?/0~?/0~?/0~?,421/423/322/176/192/132,,n/n/n/n,Double Iron Bash/Superpower/Thunder Punch/Thunder Wave,,
 *   |5/c,Venusaur,Venusaur>?,F,100,n,Grass/Poison>?,1000/1000/n,?/0/0/0,y,?/?~Chlorophyll/n/n,?~Life Orb/?/?/?,Modest,80/82>?/83>?/100>?/100>?/80>?,31/31/31/31/31/31,0/0/0/252/4/252,?/?/?/?/?/?,0~?/0~?/0~?/0~?/0~?,301/180/202/328/237/259,,n/n/n/n,Growth/Giga Drain/Weather Ball/Sludge Bomb,,;
 * f:s|Harsh Sunshine|Electric
 * `
 * ```
 * @since 1.0.3
 */
export const dehydrateCalcdex = (
  state: CalcdexBattleState,
  error?: Error,
): string => {
  if (!state?.format) {
    return null;
  }

  const {
    gen,
    turn,
    format,
    authPlayerKey,
    playerKey,
    opponentKey,
    switchPlayers,
    field,
  } = state;

  const output: string[] = [
    `v:${env('package-version', '?')}`,
    `b:${env('build-date', '?')}`,
    `t:${env('build-target', '?')}`,
    `e:${__DEV__ ? 'd' : 'p'}`,
    `s:${error?.message ? base64.encode(error.message) : '?'}`,
    `g:${dehydrateValue(gen)}`,
    `m:${dehydrateValue(format)}`,
    'p:' + dehydrateArray([
      authPlayerKey,
      playerKey,
      opponentKey,
      switchPlayers,
    ]),
    `n:${dehydrateValue(turn)}`,
  ];

  for (const key of AllPlayerKeys) {
    const player = state[key];

    if (!player?.active) {
      continue;
    }

    const {
      sideid,
      name: playerName,
      rating,
      // activeIndex = -1,
      activeIndices,
      selectionIndex = -1,
      autoSelect,
      pokemon: playerPokemon = [],
      side,
    } = player;

    const playerOutput: string[] = [
      dehydrateValue(playerName),
      dehydrateValue(rating),
      // typeof activeIndex === 'number' ? String(activeIndex) : '-1',
      dehydrateArray(activeIndices),
      typeof selectionIndex === 'number' ? String(selectionIndex) : '-1',
      dehydrateBoolean(autoSelect),
      dehydratePlayerSide(side),
    ];

    for (const pokemon of playerPokemon) {
      const {
        slot = -1,
        serverSourced,
        name: pokemonName,
        speciesForme,
        transformedForme,
        gender,
        level,
        shiny,
        types = [],
        teraType,
        hp,
        maxhp,
        fainted,
        status,
        // statusData,
        sleepCounter,
        toxicCounter,
        hitCounter,
        preset,
        baseAbility,
        ability,
        dirtyAbility,
        abilityToggleable,
        abilityToggled,
        item,
        dirtyItem,
        itemEffect,
        prevItem,
        prevItemEffect,
        nature,
        baseStats,
        transformedBaseStats,
        ivs,
        evs,
        serverStats,
        boosts,
        dirtyBoosts,
        spreadStats,
        serverMoves,
        useZ,
        useMax,
        terastallized,
        criticalHit,
        moves,
        moveTrack,
        volatiles,
      } = pokemon || {};

      const pokemonOutput: string[] = [
        dehydrateArray([slot, serverSourced ? 's' : 'c']),
        dehydrateValue(pokemonName),
        dehydrateArray([speciesForme, transformedForme], '>'),
        dehydrateValue(gender),
        dehydrateValue(level),
        dehydrateBoolean(shiny),
        dehydrateArray([dehydrateArray(types), dehydrateValue(teraType)], '>'),
        dehydrateArray([hp, maxhp, fainted]),
        dehydrateArray([
          status,
          sleepCounter,
          toxicCounter,
          hitCounter,
        ]),
        dehydrateBoolean(!!preset),
        dehydrateArray([
          baseAbility,
          dehydrateArray([ability, dirtyAbility], '~'),
          abilityToggleable,
          abilityToggled,
        ]),
        dehydrateArray([
          dehydrateArray([item, dirtyItem], '~'),
          itemEffect,
          prevItem,
          prevItemEffect,
        ]),
        dehydrateValue(nature),
        dehydrateArray([
          baseStats?.hp,
          dehydrateArray([baseStats?.atk, transformedBaseStats?.atk], '>'),
          dehydrateArray([baseStats?.def, transformedBaseStats?.def], '>'),
          dehydrateArray([baseStats?.spa, transformedBaseStats?.spa], '>'),
          dehydrateArray([baseStats?.spd, transformedBaseStats?.spd], '>'),
          dehydrateArray([baseStats?.spe, transformedBaseStats?.spe], '>'),
        ]),
        dehydrateStatsTable(ivs),
        dehydrateStatsTable(evs),
        dehydrateStatsTable(serverStats),
        dehydrateArray([
          dehydrateArray([boosts?.atk, dirtyBoosts?.atk], '~'),
          dehydrateArray([boosts?.def, dirtyBoosts?.def], '~'),
          dehydrateArray([boosts?.spa, dirtyBoosts?.spa], '~'),
          dehydrateArray([boosts?.spd, dirtyBoosts?.spd], '~'),
          dehydrateArray([boosts?.spe, dirtyBoosts?.spe], '~'),
        ]),
        dehydrateStatsTable(spreadStats),
        dehydrateArray(serverMoves),
        dehydrateArray([useZ, useMax, terastallized, criticalHit]),
        dehydrateArray(moves),
        dehydrateArray(moveTrack?.map((t) => dehydrateArray(t, '+'))),
        dehydrateArray(Object.values(volatiles || {}).map((v) => dehydrateArray(v, '+'))),
      ];

      playerOutput.push(pokemonOutput.join(','));
    }

    output.push(`${sideid}:${playerOutput.join('|')}`);
  }

  // update (2023/02/06): attackerSide & defenderSide (of type CalcdexPlayerSide) are now attached to
  // the individual players (of type CalcdexPlayer), i.e., they're no longer in the CalcdexBattleField
  const {
    gameType,
    weather,
    terrain,
    // attackerSide,
    // defenderSide,
  } = field || {};

  const fieldOutput: string[] = [
    gameType === 'Doubles' ? 'd' : 's',
    dehydrateValue(weather),
    dehydrateValue(terrain),
    // dehydrateFieldSide(attackerSide),
    // dehydrateFieldSide(defenderSide),
  ];

  output.push(`f:${fieldOutput.join('|')}`);

  return output.filter(Boolean).join(';');
};
