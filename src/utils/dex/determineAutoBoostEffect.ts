import {
  type AbilityName,
  type GenerationNum,
  type ItemName,
  type Terrain,
} from '@smogon/calc';
import { type CalcdexAutoBoostEffect, type CalcdexBattleField, type CalcdexPokemon } from '@showdex/interfaces/calc';
// import { logger } from '@showdex/utils/debug';
import { detectGenFromFormat } from './detectGenFromFormat';

// const l = logger('@showdex/utils/dex/determineAutoBoostEffect()');

/**
 * Determines the `boosts` for a `CalcdexAutoBoostEffect`.
 *
 * * `sourcePokemon` is not always necessarily the `config.targetPokemon`.
 *   - e.g., *Intimidate* from a *Landorous-Therian* (source) to a *Zacian-Crowned* (target).
 * * `config.activePokemon` should include ALL active Pokemon for ALL players.
 *   - This is specifically used to determine the boosts for the *Download* ability.
 *   - This array should include the `config.targetPokemon` if active, but should NOT include the `sourcePokemon`.
 * * Doesn't consider the `sourcePokemon`'s previous `autoBoostMap` but rather rebuilds it from scratch.
 * * There's a flaw in that when used outside of a battle sync, this won't pick up on *multiple* effects & will return
 *   the last applicable one instead due to this originally being designed with the battle's `stepQueue[]` in mind.
 *   - Seems to work more-or-less tho in the case where it applies (i.e., Honkdex), so fucc it yolo.
 * * Guaranteed to return an object containing an empty `boosts` object & `null`-valued properties.
 *
 * @since 1.2.3
 */
export const determineAutoBoostEffect = (
  sourcePokemon: CalcdexPokemon,
  config?: {
    format?: string | GenerationNum;
    targetPokemon?: CalcdexPokemon;
    activePokemon?: CalcdexPokemon[];
    field?: CalcdexBattleField;
  },
): CalcdexAutoBoostEffect => {
  const output: CalcdexAutoBoostEffect = {
    name: null,
    boosts: {},
    dict: null,
    sourceKey: null,
    sourcePid: null,
    reffect: null,
    reffectDict: null,
    turn: null,
    once: false,
    active: false,
  };

  if (!sourcePokemon?.speciesForme) {
    return output;
  }

  const {
    calcdexId: sourcePid,
    playerKey: sourceKey,
    speciesForme: sourceSpeciesForme,
    transformedForme: sourceTransformedForme,
    terastallized: sourceTerastallized,
    ability: revealedSourceAbility,
    dirtyAbility: dirtySourceAbility,
    item: revealedSourceItem,
    dirtyItem: dirtySourceItem,
  } = sourcePokemon;

  const sourceForme = sourceTransformedForme || sourceSpeciesForme;
  const sourceAbility = dirtySourceAbility || revealedSourceAbility;
  const sourceItem = dirtySourceItem ?? revealedSourceItem;

  const {
    format,
    targetPokemon,
    activePokemon,
    field,
  } = config || {};

  const gen = detectGenFromFormat(format);

  const {
    ability: revealedTargetAbility,
    dirtyAbility: dirtyTargetAbility,
    item: revealedTargetItem,
    dirtyItem: dirtyTargetItem,
  } = targetPokemon || {};

  const targetAbility = dirtyTargetAbility || revealedTargetAbility;
  const targetItem = dirtyTargetItem ?? revealedTargetItem;

  const {
    // weather: currentWeather,
    // autoWeather,
    // dirtyWeather,
    terrain: currentTerrain,
    autoTerrain,
    dirtyTerrain,
  } = field || {};

  // const weather = (dirtyWeather ?? (autoWeather || currentWeather)) || null;
  const terrain = (dirtyTerrain ?? (autoTerrain || currentTerrain)) || null;

  switch (sourceAbility) {
    case 'Dauntless Shield': {
      output.name = sourceAbility;
      output.dict = 'abilities';
      output.boosts.def = 1;
      output.once = gen > 8;

      break;
    }

    // source Pokemon is typically Genesect; config.targetPokemon isn't used here, but rather config.activePokemon
    case 'Download': {
      output.name = sourceAbility;
      output.dict = 'abilities';

      // either ATK or SPA gets boosted, depending on the target's lowest DEF or SPD stat, respectively
      // when the target's DEF = SPD, SPA is boosted; Wonder Room is ignored, so if enabled, flip the DEF/SPD again
      // in formats like doubles, triples, FFA, etc., the lowest average DEF or SPD of ALL active Pokemon is used
      // (I believe ally Pokemon also are considered in the averages)
      // in gen 4 only, Pokemon behind a sub aren't considered in the averages (fails if ALL pokemon are sub'd up)
      const eligible = activePokemon?.filter((p) => (
        !!p?.speciesForme
          // && p.active
          && (p.baseStats?.def || 0) > 0
          && (p.baseStats?.spd || 0) > 0
          && (gen !== 4 || !('substitute' in (p.volatiles || {})))
      )) || [];

      if (!eligible.length) {
        break;
      }

      // note: Wonder Room is only visually swapped in calcPokemonFinalStats() & fully handled by @smogon/calc
      // (so at this point here, it's not actually swapped, similar to how Showdex handles Power Trick)
      // const defStat: Showdown.StatNameNoHp = field?.isWonderRoom ? 'spd' : 'def';
      // const spdStat: Showdown.StatNameNoHp = field?.isWonderRoom ? 'def' : 'spd';

      const avgDef = Math.floor(eligible.reduce((prev, p) => prev + (p.dirtyBaseStats?.def || p.baseStats.def), 0) / eligible.length);
      const avgSpd = Math.floor(eligible.reduce((prev, p) => prev + (p.dirtyBaseStats?.spd || p.baseStats.spd), 0) / eligible.length);
      const boostedStat: Showdown.StatNameNoHp = avgDef < avgSpd ? 'atk' : 'spa';

      // l.debug('eligible', eligible, '\n', 'avgDef', avgDef, 'avgSpd', avgSpd, 'boostedStat', boostedStat);

      output.boosts[boostedStat] = 1;

      break;
    }

    case 'Embody Aspect (Cornerstone)': {
      output.name = sourceAbility;
      output.dict = 'abilities';

      if (!sourceTerastallized || sourceItem !== 'Cornerstone Mask' as ItemName) {
        break;
      }

      output.boosts.def = 1;

      break;
    }

    case 'Embody Aspect (Hearthflame)': {
      output.name = sourceAbility;
      output.dict = 'abilities';

      if (!sourceTerastallized || sourceItem !== 'Hearthflame Mask' as ItemName) {
        break;
      }

      output.boosts.atk = 1;

      break;
    }

    case 'Embody Aspect (Teal)': {
      output.name = sourceAbility;
      output.dict = 'abilities';

      if (!sourceTerastallized) {
        break;
      }

      output.boosts.spe = 1;

      break;
    }

    case 'Embody Aspect (Wellspring)': {
      output.name = sourceAbility;
      output.dict = 'abilities';

      if (!sourceTerastallized || sourceItem !== 'Wellspring Mask' as ItemName) {
        break;
      }

      output.boosts.spd = 1;

      break;
    }

    // source (e.g., Landorous-Therian) & target Pokemon should be different here typically
    case 'Intimidate': {
      output.name = sourceAbility;
      output.dict = 'abilities';
      output.boosts.atk = -1;
      output.sourceKey = sourceKey;
      output.sourcePid = sourcePid;

      if (targetItem === 'Clear Amulet' as ItemName) {
        output.boosts.atk = 0;
        output.reffect = targetItem;
        output.reffectDict = 'items';

        break;
      }

      const blockers = [
        'Clear Body',
        'White Smoke',
        'Hyper Cutter',
        'Full Metal Body',
      ] as AbilityName[];

      if (gen > 7) {
        blockers.push(...([
          'Inner Focus',
          'Own Tempo',
          'Oblivious',
          'Scrappy',
        ] as AbilityName[]));
      }

      if (blockers.includes(targetAbility)) {
        output.boosts.atk = 0;
        output.reffect = targetAbility;
        output.reffectDict = 'abilities';

        break;
      }

      const reffects = [
        'Contrary',
        'Defiant',
        'Guard Dog',
        'Simple',
      ] as AbilityName[];

      if (reffects.includes(targetAbility)) {
        output.boosts.atk = targetAbility === 'Simple' as AbilityName ? -2 : 1;
        output.reffect = targetAbility;
        output.reffectDict = 'abilities';

        break;
      }

      if (targetAbility === 'Competitive' as AbilityName) {
        output.boosts.spa = 2; // in addition to the -1 ATK above
        output.reffect = targetAbility;
        output.reffectDict = 'abilities';

        break;
      }

      break;
    }

    case 'Intrepid Sword': {
      output.name = sourceAbility;
      output.dict = 'abilities';
      output.boosts.atk = 1;
      output.once = gen > 8;

      break;
    }

    default: {
      break;
    }
  }

  switch (sourceForme) {
    case 'Ogerpon': {
      const reqAbility = 'Embody Aspect (Teal)' as AbilityName;

      if (sourceAbility === reqAbility) {
        break;
      }

      output.name = reqAbility;
      output.dict = 'abilities';
      output.boosts = {};

      break;
    }

    case 'Ogerpon-Cornerstone': {
      const reqAbility = 'Embody Aspect (Cornerstone)' as AbilityName;

      if (sourceAbility === reqAbility) {
        break;
      }

      output.name = reqAbility;
      output.dict = 'abilities';
      output.boosts = {};

      break;
    }

    case 'Ogerpon-Hearthflame': {
      const reqAbility = 'Embody Aspect (Hearthflame)' as AbilityName;

      if (sourceAbility === reqAbility) {
        break;
      }

      output.name = reqAbility;
      output.dict = 'abilities';
      output.boosts = {};

      break;
    }

    case 'Ogerpon-Wellspring': {
      const reqAbility = 'Embody Aspect (Wellspring)' as AbilityName;

      if (sourceAbility === reqAbility) {
        break;
      }

      output.name = reqAbility;
      output.dict = 'abilities';
      output.boosts = {};

      break;
    }

    default: {
      break;
    }
  }

  switch (sourceItem) {
    case 'Electric Seed':
    case 'Grassy Seed':
    case 'Misty Seed':
    case 'Psychic Seed': {
      // e.g., sourceItem = 'Electric Seed' -> itemTerrain = 'Electric'
      const itemTerrain = sourceItem.split(' ')[0] as Terrain;

      if (terrain !== itemTerrain) {
        break;
      }

      output.name = sourceItem;
      output.dict = 'items';

      const boostedStat: Showdown.StatNameNoHp = (['Electric', 'Grassy'] as Terrain[]).includes(terrain) ? 'def' : 'spd';
      const contrary = sourceAbility === 'Contrary' as AbilityName;

      output.boosts[boostedStat] = 1 * (contrary ? -1 : 1);

      if (contrary) {
        output.reffect = sourceAbility;
        output.reffectDict = 'abilities';
      }

      break;
    }

    default: {
      break;
    }
  }

  // l.debug('output for', sourcePokemon?.ident, '->', targetPokemon?.ident, '\n', output);

  return output;
};
