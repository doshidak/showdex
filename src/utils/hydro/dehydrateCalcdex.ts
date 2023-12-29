import base64 from 'base-64';
import {
  type CalcdexBattleState,
  type CalcdexPlayerSide,
  CalcdexPlayerKeys as AllPlayerKeys,
} from '@showdex/interfaces/calc';
import { HydroDescriptor } from '@showdex/interfaces/hydro';
import { dehydrateHeader } from './dehydrateHeader';
import { dehydrateArray, dehydrateBoolean, dehydrateValue } from './dehydratePrimitives';
import { dehydrateStatsTable } from './dehydrateStatsTable';

/**
 * Dehydrates a player side `value`, filtering out properties with falsy values and
 * joining the resulting dehydrated property values with the `delimiter`.
 *
 * * Key and value of each property is deliminated by an equals (`'='`).
 * * Does not dehydrate the `conditions` object at the moment.
 *
 * @example
 * ```ts
 * dehydratePlayerSide({
 *   spikes: 0,
 *   isSR: true,
 *   isReflect: true,
 *   isLightScreen: false,
 *   isAuroraVeil: false,
 * });
 *
 * 'isSR=y/isReflect=y'
 * ```
 * @since 1.0.3
 */
export const dehydratePlayerSide = (
  value: CalcdexPlayerSide,
  delimiter = '/',
): string => Object.entries(value || {})
  .filter((e) => !!e?.[0] && e[0] !== 'conditions' && !!e[1])
  .map(([k, v]) => `${k}=${dehydrateValue(v)}`)
  .join(delimiter);

/**
 * Dehydrates (serializes) the passed-in Calcdex `state`.
 *
 * Each "root" property of the `state` is given its own "opcode":
 *
 * * `s` refers to the base-64 encoded error message, if any.
 * * `o` refers to the operating mode (`state.operatingMode`).
 * * `g` refers to the gen number (`state.gen`), battle format (`state.format`) & game type (`state.gameType`).
 * * `p` refers to the player keys in the battle.
 * * `p#` refers to each player in the battle (e.g., `state.p1`, `state.p2`).
 * * `f` refers to the battle field (`state.field`).
 *
 * Dehydrated `state`, whose properties are deliminated by a semi-colon (`';'`), is in the following format:
 *
 * ```
 * {...header};
 * s:{error};
 * o:{operatingMode};
 * g:{gen}/{format}/{gameType};
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
 * {slot}/{source},
 * {name},
 * {speciesForme}>{transformedForme},
 * {gender},
 * {level},
 * {shiny},
 * {types[0]}[/{types[1]}...]~{dirtyTypes[0]}[/{dirtyTypes[1]}...]>{teraType}~{dirtyTeraType},
 * {hp}~{dirtyHp}/{maxhp}/{fainted},
 * {status}~{dirtyStatus}/{sleepCounter}/{toxicCounter}/{hitCounter}/{faintCounter}~{dirtyFaintCounter},
 * {presetId ? 'y' : 'n'}/{presetSource},
 * {baseAbility}/{ability}~{dirtyAbility}/{abilityToggled},
 * {item}~{dirtyItem}>{itemEffect}/{prevItem}>{prevItemEffect},
 * {nature},
 * {baseStats.hp}~{dirtyBaseStats.hp}/{baseStats.atk}~{dirtyBaseStats.atk}>{transformedBaseStats.atk}/...
 * {ivs.hp}/.../{ivs.spe},
 * {evs.hp}/.../{evs.spe},
 * {serverStats.hp}/.../{serverStats.spe},
 * {boosts.atk}~{dirtyBoosts.atk}/.../{boosts.spe}~{dirtyBoosts.spe},
 * {spreadStats.hp}/.../{spreadStats.spe},
 * {useZ}/{useMax}/{terastallized}/{criticalHit},
 * {serverMoves[0]}[/{serverMoves[1]}...],
 * {moves[0]}[/{moves[1]}...],
 * {revealedMoves[0]}[/{revealedMoves[1]}...],
 * {transformedMoves[0]}[/{transformedMoves[1]}...],
 * {Object.values(volatiles)[0][0]}[+{Object.values(volatiles)[0][1]}[+...]][/{Object.values(volatiles)[1][0]}[+...]...],
 * ```
 *
 * and `{field}`, whose properties are deliminated by a pipe (`'|'`), is in the following format:
 *
 * ```
 * {weather}|
 * {terrain}
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
 * ```
 * v:1.1.7;
 * \@:showdex-v1.1.7-b18B4216EF49-dev.chrome;
 * #:18B43D81603;
 * $:calcdex;
 * s:Q2Fubm90IHJlYWQgcHJvcGVydGllcyBvZiB1bmRlZmluZWQgKHJlYWRpbmcgJ2FiaWxpdHlUb2dnbGVkJyk=;
 * o:battle;
 * g:7/gen7randombattle/Singles;
 * p:p1/p1/p2/n;
 * n:1;
 * p1:showdex_testee|?|0|0|y|
 *   |0/s,Mienshao,Mienshao>?,M,84,n,Fighting>?~?,246~?/246/n,?~?/0/0/0/0~?,n,?/Reckless~?/n,Life Orb~?>?/?>?,Timid,65~?/125~?>?/60~?>?/95~?>?/60~?>?/105~?>?,31/31/31/31/31/31,85/85/85/85/85/85,246/258/149/208/149/225,0~?/0~?/0~?/0~?/0~?,246/232/149/208/149/247,High Jump Kick/Knock Off/Poison Jab/Swords Dance,n/n/n/n,,,,
 *   |1/s,Galvantula,Galvantula>?,M,82,n,Bug/Electric>?~?,249~?/249/n,?~?/0/0/0/0~?,n,?/Compound Eyes~?/n,Life Orb~?>?/?>?,Timid,70~?/77~?>?/60~?>?/97~?>?/60~?>?/108~?>?,31/31/31/31/31/31,85/85/85/85/85/85,249/131/146/206/146/224,0~?/0~?/0~?/0~?/0~?,249/155/146/206/146/246,Thunder/Volt Switch/Bug Buzz/Sticky Web,n/n/n/n,,,,
 *   |2/s,Accelgor,Accelgor>?,F,88,n,Bug>?~?,284~?/284/n,?~?/0/0/0/0~?,n,?/Sticky Hold~?/n,Leftovers~?>?/?>?,Timid,80~?/70~?>?/40~?>?/100~?>?/60~?>?/145~?>?,31/31/31/31/31/31,85/85/85/85/85/85,284/128/121/226/156/305,0~?/0~?/0~?/0~?/0~?,284/155/121/226/156/335,Energy Ball/Bug Buzz/Toxic Spikes/Encore,n/n/n/n,,,,
 *   |3/s,Altaria,Altaria>?,F,81,n,Dragon/Flying>?~?,254~?/254/n,?~?/0/0/0/0~?,n,?/Natural Cure~?/n,Altarianite~?>?/?>?,Timid,75~?/70~?>?/90~?>?/70~?>?/105~?>?/80~?>?,31/31/31/31/31/31,85/85/85/85/85/85,254/160/192/160/217/176,0~?/0~?/0~?/0~?/0~?,254/144/192/160/217/193,Earthquake/Return/Roost/Dragon Dance,n/n/n/n,,,,
 *   |4/s,Weavile,Weavile>?,F,79,n,Dark/Ice>?~?,240~?/240/n,?~?/0/0/0/0~?,n,?/Pickpocket~?/n,Life Orb~?>?/?>?,Timid,70~?/120~?>?/65~?>?/45~?>?/85~?>?/125~?>?,31/31/31/31/31/31,85/85/85/85/85/85,240/235/148/117/180/243,0~?/0~?/0~?/0~?/0~?,240/211/148/117/180/267,Knock Off/Low Kick/Swords Dance/Icicle Crash,n/n/n/n,,,,
 *   |5/s,Zebstrika,Zebstrika>?,F,88,n,Electric>?~?,275~?/275/n,?~?/0/0/0/0~?,n,?/Sap Sipper~?/n,Expert Belt~?>?/?>?,Timid,75~?/100~?>?/63~?>?/80~?>?/63~?>?/116~?>?,31/31/31/31/31/31,85/85/85/85/85/85,275/225/160/191/161/254,0~?/0~?/0~?/0~?/0~?,275/203/161/191/161/279,Hidden Power Ice/Volt Switch/Wild Charge/Overheat,n/n/n/n,,,,;
 * p2:sumfuk|?|0|0|y|
 *   |0/c,Oricorio,Oricorio-Sensu>?,M,88,n,Ghost/Flying>?~?,100~?/100/n,?~?/0/0/0/0~?,n,?/?~Dancer/n,?~?>?/?>?,Timid,75~?/70~?>?/70~?>?/98~?>?/70~?>?/93~?>?,31/31/31/31/31/31,85/85/85/85/85/85,?/?/?/?/?/?,0~?/0~?/0~?/0~?/0~?,275/155/173/223/173/235,,n/n/n/n,,,,;
 * f:?|?
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
    operatingMode,
    gen,
    format,
    turn,
    authPlayerKey,
    playerKey,
    opponentKey,
    switchPlayers,
    field,
  } = state;

  const output: string[] = [
    dehydrateHeader(HydroDescriptor.Calcdex),
    `s:${error?.message ? base64.encode(error.message) : '?'}`,
    `o:${dehydrateValue(operatingMode)}`,
    `g:${dehydrateValue(gen)}/${dehydrateValue(format)}/${dehydrateValue(state.gameType)}`,
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
      activeIndices,
      selectionIndex = -1,
      autoSelect,
      pokemon: playerPokemon = [],
      side,
    } = player;

    const playerOutput: string[] = [
      dehydrateValue(playerName),
      dehydrateValue(rating),
      dehydrateArray(activeIndices),
      typeof selectionIndex === 'number' ? String(selectionIndex) : '-1',
      dehydrateBoolean(autoSelect),
      dehydratePlayerSide(side),
    ];

    for (const pokemon of playerPokemon) {
      const {
        slot = -1,
        source,
        name: pokemonName,
        speciesForme,
        transformedForme,
        gender,
        level,
        shiny,
        types = [],
        teraType,
        dirtyTeraType,
        hp,
        dirtyHp,
        maxhp,
        fainted,
        status,
        dirtyStatus,
        sleepCounter,
        toxicCounter,
        hitCounter,
        faintCounter,
        dirtyFaintCounter,
        presetId,
        presetSource,
        baseAbility,
        ability,
        dirtyAbility,
        abilityToggled,
        item,
        dirtyItem,
        itemEffect,
        prevItem,
        prevItemEffect,
        nature,
        baseStats,
        dirtyBaseStats,
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
        revealedMoves,
        transformedMoves,
        volatiles,
      } = pokemon || {};

      const pokemonOutput: string[] = [
        dehydrateArray([slot, source]),
        dehydrateValue(pokemonName),
        dehydrateArray([speciesForme, transformedForme], '>'),
        dehydrateValue(gender),
        dehydrateValue(level),
        dehydrateBoolean(shiny),
        dehydrateArray([
          dehydrateArray(types),
          dehydrateArray([teraType, dirtyTeraType], '~'),
        ], '>'),
        dehydrateArray([
          dehydrateArray([hp, dirtyHp], '~'),
          maxhp,
          fainted,
        ]),
        dehydrateArray([
          dehydrateArray([status, dirtyStatus], '~'),
          sleepCounter,
          toxicCounter,
          hitCounter,
          dehydrateArray([faintCounter, dirtyFaintCounter], '~'),
        ]),
        dehydrateArray([
          dehydrateBoolean(!!presetId),
          dehydrateValue(presetSource),
        ]),
        dehydrateArray([
          baseAbility,
          dehydrateArray([ability, dirtyAbility], '~'),
          abilityToggled,
        ]),
        dehydrateArray([
          dehydrateArray([
            dehydrateArray([item, dirtyItem], '~'),
            itemEffect,
          ], '>'),
          dehydrateArray([prevItem, prevItemEffect], '>'),
        ]),
        dehydrateValue(nature),
        dehydrateArray([
          dehydrateArray([baseStats?.hp, dirtyBaseStats?.hp], '~'),
          dehydrateArray([
            dehydrateArray([baseStats?.atk, dirtyBaseStats?.atk], '~'),
            transformedBaseStats?.atk,
          ], '>'),
          dehydrateArray([
            dehydrateArray([baseStats?.def, dirtyBaseStats?.def], '~'),
            transformedBaseStats?.def,
          ], '>'),
          dehydrateArray([
            dehydrateArray([baseStats?.spa, dirtyBaseStats?.spa], '~'),
            transformedBaseStats?.spa,
          ], '>'),
          dehydrateArray([
            dehydrateArray([baseStats?.spd, dirtyBaseStats?.spd], '~'),
            transformedBaseStats?.spd,
          ], '>'),
          dehydrateArray([
            dehydrateArray([baseStats?.spe, dirtyBaseStats?.spe], '~'),
            transformedBaseStats?.spe,
          ], '>'),
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
        dehydrateArray(revealedMoves),
        dehydrateArray(transformedMoves),
        dehydrateArray(Object.values(volatiles || {}).map((v) => dehydrateArray(v, '+'))),
      ];

      playerOutput.push(pokemonOutput.join(','));
    }

    output.push(`${sideid}:${playerOutput.join('|')}`);
  }

  const {
    weather,
    terrain,
  } = field || {};

  const fieldOutput: string[] = [
    dehydrateValue(weather),
    dehydrateValue(terrain),
  ];

  output.push(`f:${fieldOutput.join('|')}`);

  return output.filter(Boolean).join(';');
};
