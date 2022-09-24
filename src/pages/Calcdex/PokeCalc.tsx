import * as React from 'react';
import cx from 'classnames';
import {
  detectLegacyGen,
  detectToggledAbility,
  sanitizePokemon,
  toggleableAbility,
} from '@showdex/utils/battle';
import {
  calcLegacyHpDv,
  calcPokemonSpreadStats,
  convertLegacyDvToIv,
  getLegacySpcDv,
} from '@showdex/utils/calc';
// import { logger } from '@showdex/utils/debug';
import type { Generation } from '@pkmn/data';
import type { GenerationNum } from '@pkmn/types';
import type {
  CalcdexBattleField,
  CalcdexBattleRules,
  CalcdexPlayerKey,
  CalcdexPokemon,
} from '@showdex/redux/store';
import { PokeInfo } from './PokeInfo';
import { PokeMoves } from './PokeMoves';
import { PokeStats } from './PokeStats';
import { useSmogonMatchup } from './useSmogonMatchup';
import styles from './PokeCalc.module.scss';

interface PokeCalcProps {
  className?: string;
  style?: React.CSSProperties;
  dex?: Generation;
  gen?: GenerationNum;
  format?: string;
  rules?: CalcdexBattleRules;
  playerKey?: CalcdexPlayerKey;
  playerPokemon: CalcdexPokemon;
  opponentPokemon: CalcdexPokemon;
  field?: CalcdexBattleField;
  onPokemonChange?: (pokemon: DeepPartial<CalcdexPokemon>) => void;
}

// const l = logger('@showdex/pages/Calcdex/PokeCalc');

export const PokeCalc = ({
  className,
  style,
  dex,
  gen,
  format,
  rules,
  playerKey,
  playerPokemon,
  opponentPokemon,
  field,
  onPokemonChange,
}: PokeCalcProps): JSX.Element => {
  const legacy = detectLegacyGen(gen);

  const calculateMatchup = useSmogonMatchup(
    dex,
    playerPokemon,
    opponentPokemon,
    playerKey,
    field,
  );

  const handlePokemonChange = (
    mutation: DeepPartial<CalcdexPokemon>,
  ) => {
    const payload: DeepPartial<CalcdexPokemon> = {
      ...mutation,

      calcdexId: playerPokemon?.calcdexId,

      ivs: {
        ...playerPokemon?.ivs,
        ...mutation?.ivs,
      },

      evs: {
        ...playerPokemon?.evs,
        ...mutation?.evs,
      },

      dirtyBoosts: {
        ...playerPokemon?.dirtyBoosts,
        ...mutation?.dirtyBoosts,
      },
    };

    // perform special processing for IVs if we're in a legacy gen
    if (legacy) {
      // update SPA and SPD to equal each other since we don't keep track of SPC separately
      payload.ivs.spa = convertLegacyDvToIv(getLegacySpcDv(payload.ivs));
      payload.ivs.spd = payload.ivs.spa;

      // recalculate & convert the HP DV into an IV
      payload.ivs.hp = convertLegacyDvToIv(calcLegacyHpDv(payload.ivs));

      // also, remove any incompatible mechanics (like abilities and natures) from the payload
      // (it's ok that the payload doesn't actually have these properties)
      delete payload.ability;
      delete payload.dirtyAbility;
      delete payload.nature;

      // note: only items were introduced in gen 2
      if (gen === 1) {
        delete payload.item;
        delete payload.dirtyItem;
      }
    }

    // re-check for toggleable abilities in the mutation
    if ('ability' in payload || 'dirtyAbility' in payload) {
      const tempPokemon = {
        ...playerPokemon,
        ...payload,
      };

      payload.abilityToggleable = toggleableAbility(tempPokemon);

      if (payload.abilityToggleable) {
        payload.abilityToggled = detectToggledAbility(tempPokemon);
      }
    }

    // clear the dirtyAbility, if any, if it matches the ability
    if ('dirtyAbility' in payload && payload.dirtyAbility === playerPokemon?.ability) {
      payload.dirtyAbility = null;
    }

    // clear the dirtyItem, if any, if it matches the item
    if ('dirtyItem' in payload && payload.dirtyItem === playerPokemon?.item) {
      payload.dirtyItem = null;
    }

    // check for any possible abilities, base stat & type updates due to speciesForme changes
    if ('speciesForme' in payload && payload.speciesForme !== playerPokemon.speciesForme) {
      // const newSpecies = Dex.forGen(dex?.num).species.get(payload.speciesForme);

      const {
        abilities,
        baseStats,
        types,
      } = sanitizePokemon({
        ...playerPokemon,
        ...payload,
      }, gen);

      if (abilities?.length) {
        payload.abilities = [...abilities];
      }

      if (types?.length) {
        payload.types = [...types];
      }

      if (Object.keys(baseStats || {}).length) {
        payload.baseStats = { ...baseStats };
      }
    }

    // recalculate the stats with the updated EVs/IVs
    if (typeof dex !== 'undefined') {
      payload.spreadStats = calcPokemonSpreadStats(dex, {
        ...playerPokemon,
        ...payload,
      });
    }

    // clear any dirtyBoosts that match the current boosts
    Object.entries(playerPokemon.boosts).forEach(([
      stat,
      boost,
    ]: [
      stat: Showdown.StatNameNoHp,
      boost: number,
    ]) => {
      const dirtyBoost = payload.dirtyBoosts[stat];

      const validBoost = typeof boost === 'number';
      const validDirtyBoost = typeof dirtyBoost === 'number';

      if (validBoost && validDirtyBoost && dirtyBoost === boost) {
        payload.dirtyBoosts[stat] = undefined;
      }
    });

    onPokemonChange?.(payload);
  };

  return (
    <div
      className={className}
      style={style}
    >
      {/* name, types, level, HP, status, set, ability, nature, item */}
      <PokeInfo
        dex={dex}
        gen={gen}
        format={format}
        pokemon={playerPokemon}
        onPokemonChange={handlePokemonChange}
      />

      {/* moves (duh) */}
      <PokeMoves
        className={styles.section}
        // dex={dex}
        gen={gen}
        format={format}
        rules={rules}
        pokemon={playerPokemon}
        calculateMatchup={calculateMatchup}
        onPokemonChange={handlePokemonChange}
      />

      {/* IVs, EVs, calculated stats, boosts */}
      <PokeStats
        className={cx(styles.section, styles.stats)}
        // dex={dex}
        gen={gen}
        playerPokemon={playerPokemon}
        opponentPokemon={opponentPokemon}
        field={field}
        // side={side}
        playerKey={playerKey}
        onPokemonChange={handlePokemonChange}
      />
    </div>
  );
};
