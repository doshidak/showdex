import * as React from 'react';
import cx from 'classnames';
// import { logger } from '@showdex/utils/debug';
import type { Generation } from '@pkmn/data';
import type { GenerationNum } from '@pkmn/types';
import type { CalcdexBattleField, CalcdexPokemon } from './CalcdexReducer';
import { createSmogonField } from './createSmogonField';
import { createSmogonPokemon } from './createSmogonPokemon';
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
  onPokemonChange?: (pokemon: Partial<CalcdexPokemon>) => void;
}

// const l = logger('Calcdex/PokeCalc');

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
  const smogonPlayerPokemon = createSmogonPokemon(gen, dex, playerPokemon);
  const smogonOpponentPokemon = createSmogonPokemon(gen, dex, opponentPokemon);
  const smogonField = createSmogonField(field);

  const calculateMatchup = useSmogonMatchup(
    gen,
    smogonPlayerPokemon,
    smogonOpponentPokemon,
    smogonField,
  );

  const handlePokemonChange = (
    mutation: DeepPartial<CalcdexPokemon>,
  ) => onPokemonChange?.({
    ...mutation,

    calcdexId: playerPokemon?.calcdexId,
    ident: playerPokemon?.ident,
    boosts: playerPokemon?.boosts,

    nature: mutation?.nature ?? playerPokemon?.nature,

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
  });

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
