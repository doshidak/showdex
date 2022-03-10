import * as React from 'react';
import cx from 'classnames';
import { logger, printBuildInfo } from '@showdex/utils/debug';
import { detectPlayerKeyFromBattle } from './detectPlayerKey';
import { FieldCalc } from './FieldCalc';
import { PlayerCalc } from './PlayerCalc';
import { useCalcdex } from './useCalcdex';
import styles from './Calcdex.module.scss';

interface CalcdexProps {
  battle?: Showdown.Battle;
  tooltips?: Showdown.BattleTooltips;
}

const l = logger('Calcdex');

export const Calcdex = ({
  battle,
  tooltips,
}: CalcdexProps): JSX.Element => {
  const {
    dex,
    state,
    updatePokemon,
    updateField,
    // setActiveIndex,
    setSelectionIndex,
  } = useCalcdex({
    battle,
    tooltips,
  });

  l.debug(
    'rendering...',
    '\n', 'p1.pokemon', battle?.p1?.pokemon,
    '\n', 'p2.pokemon', battle?.p2?.pokemon,
    '\n', 'state', state,
  );

  const {
    gen,
    field,
    format,
    p1,
    p2,
  } = state;

  const playerKey = detectPlayerKeyFromBattle(battle);

  const player = playerKey === 'p1' ? p1 : p2;
  const opponent = playerKey === 'p1' ? p2 : p1;

  return (
    <div
      className={cx(
        'showdex-module',
        styles.container,
      )}
    >
      <div className={styles.content}>
        <div className={styles.buildInfo}>
          {printBuildInfo()}
        </div>

        <PlayerCalc
          format={format}
          playerKey={playerKey}
          player={player}
          opponent={opponent}
          field={field}
          gen={gen}
          dex={dex}
          defaultName="Player"
          onPokemonChange={updatePokemon}
          onIndexSelect={(index) => setSelectionIndex(
            playerKey,
            index,
          )}
        />

        <FieldCalc
          style={{ marginTop: 30 }}
          field={field}
          onFieldChange={updateField}
        />

        <PlayerCalc
          style={{ marginTop: 30 }}
          format={format}
          playerKey={playerKey}
          player={opponent}
          opponent={player}
          field={field}
          gen={gen}
          dex={dex}
          defaultName="Opponent"
          onPokemonChange={updatePokemon}
          onIndexSelect={(index) => setSelectionIndex(
            playerKey === 'p1' ? 'p2' : 'p1',
            index,
          )}
        />
      </div>
    </div>
  );
};
