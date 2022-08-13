import * as React from 'react';
import cx from 'classnames';
// import { logger } from '@showdex/utils/debug';
import type { Generation } from '@pkmn/data';
import type { GenerationNum } from '@pkmn/types';
import type { CalcdexBattleField, CalcdexPokemon } from '@showdex/redux/store';
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
  playerPokemon,
  opponentPokemon,
  field,
  onPokemonChange,
}: PokeCalcProps): JSX.Element => {
  const calculateMatchup = useSmogonMatchup(
    dex,
    playerPokemon,
    opponentPokemon,
    field,
  );

  const handlePokemonChange = (
    mutation: DeepPartial<CalcdexPokemon>,
  ) => {
    const payload: DeepPartial<CalcdexPokemon> = {
      ...mutation,

      calcdexId: playerPokemon?.calcdexId,
      // ident: playerPokemon?.ident,
      // boosts: playerPokemon?.boosts,

      // nature: mutation?.nature ?? playerPokemon?.nature,

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
        gen={gen}
        format={format}
        pokemon={playerPokemon}
        onPokemonChange={handlePokemonChange}
      />

      {/* moves (duh) */}
      <PokeMoves
        className={styles.section}
        dex={dex}
        gen={gen}
        pokemon={playerPokemon}
        calculateMatchup={calculateMatchup}
        onPokemonChange={handlePokemonChange}
      />

      {/* IVs, EVs, calculated stats, boosts */}
      <PokeStats
        className={cx(styles.section, styles.stats)}
        dex={dex}
        pokemon={playerPokemon}
        onPokemonChange={handlePokemonChange}
      />
    </div>
  );
};
