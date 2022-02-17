import * as React from 'react';
import cx from 'classnames';
import { logger, printBuildInfo } from '@showdex/utils/debug';
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
    p1,
    p2,
  } = state;

  return (
    <div className={cx('showdex-module', styles.container)}>
      <div className={styles.content}>
        <div className={styles.buildInfo}>
          {printBuildInfo()}
        </div>

        <PlayerCalc
          player={p1}
          opponent={p2}
          field={field}
          gen={gen}
          dex={dex}
          defaultName="Player 1"
          onPokemonChange={updatePokemon}
          onIndexSelect={(index) => setSelectionIndex('p1', index)}
        />

        <FieldCalc
          style={{ marginTop: 30 }}
          field={field}
          onFieldChange={updateField}
        />

        <PlayerCalc
          style={{ marginTop: 30 }}
          player={p2}
          opponent={p1}
          field={field}
          gen={gen}
          dex={dex}
          defaultName="Player 2"
          onPokemonChange={updatePokemon}
          onIndexSelect={(index) => setSelectionIndex('p2', index)}
        />
      </div>
    </div>
  );
};
