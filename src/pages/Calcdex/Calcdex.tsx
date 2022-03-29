import * as React from 'react';
import cx from 'classnames';
import { useColorScheme } from '@showdex/components/app';
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
  const colorScheme = useColorScheme();

  const {
    dex,
    state,
    updatePokemon,
    updateField,
    // setActiveIndex,
    setSelectionIndex,
    setAutoSelect,
  } = useCalcdex({
    battle,
    tooltips,
  });

  l.debug(
    'rendering...',
    '\n', 'p1.pokemon', battle?.p1?.pokemon,
    '\n', 'p2.pokemon', battle?.p2?.pokemon,
    '\n', 'state', state,
    '\n', 'colorScheme', colorScheme,
  );

  const {
    battleId,
    gen,
    field,
    format,
    p1,
    p2,
  } = state;

  const playerKey = detectPlayerKeyFromBattle(battle);
  const opponentKey = playerKey === 'p1' ? 'p2' : 'p1';

  const player = playerKey === 'p1' ? p1 : p2;
  const opponent = playerKey === 'p1' ? p2 : p1;

  return (
    <div
      className={cx(
        'showdex-module',
        styles.container,
        !!colorScheme && styles[colorScheme],
      )}
    >
      <div className={styles.content}>
        <div className={styles.buildInfo}>
          {printBuildInfo()}
          <br />
          by doshidak/sumfuk &amp; camdawgboi
        </div>

        <PlayerCalc
          dex={dex}
          gen={gen}
          format={format}
          playerKey={playerKey}
          player={player}
          opponent={opponent}
          field={field}
          defaultName="Player"
          onPokemonChange={updatePokemon}
          onIndexSelect={(index) => setSelectionIndex(
            playerKey,
            index,
          )}
          onAutoSelectChange={(autoSelect) => setAutoSelect(
            playerKey,
            autoSelect,
          )}
        />

        <FieldCalc
          className={styles.fieldCalc}
          battleId={battleId}
          field={field}
          onFieldChange={updateField}
        />

        <PlayerCalc
          className={styles.opponentCalc}
          dex={dex}
          gen={gen}
          format={format}
          playerKey={playerKey}
          player={opponent}
          opponent={player}
          field={field}
          defaultName="Opponent"
          onPokemonChange={updatePokemon}
          onIndexSelect={(index) => setSelectionIndex(
            opponentKey,
            index,
          )}
          onAutoSelectChange={(autoSelect) => setAutoSelect(
            opponentKey,
            autoSelect,
          )}
        />
      </div>
    </div>
  );
};
